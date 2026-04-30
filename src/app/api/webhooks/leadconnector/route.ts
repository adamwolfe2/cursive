/**
 * GoHighLevel Marketplace Inbound Webhook Handler
 * Cursive Platform
 *
 * Receives webhook events from GHL Marketplace apps (contact updates,
 * opportunity stage changes, conversation messages) and routes them to the
 * appropriate Inngest handler for async processing.
 *
 * SIGNATURE VERIFICATION (RSA, not HMAC):
 *   GHL Marketplace signs every webhook with their PRIVATE RSA key. There is
 *   no per-app shared secret. We verify the `x-wh-signature` header (base64
 *   RSA-SHA256 signature of the raw body) against GHL's PUBLIC RSA key,
 *   stored in env as GHL_MARKETPLACE_PUBLIC_KEY (PEM, including the
 *   `-----BEGIN PUBLIC KEY-----` / `-----END PUBLIC KEY-----` lines).
 *
 *   Get the current key from:
 *     https://highlevel.stoplight.io/docs/integrations/  (Webhooks → Verify)
 *   GHL rotates rarely; cache statically in env, redeploy on rotation.
 *
 * Configure in GHL Marketplace App → Webhooks:
 *   Endpoint: https://leads.meetcursive.com/api/webhooks/leadconnector
 *   Events: ContactCreate, ContactUpdate, OpportunityCreate, OpportunityStatusUpdate,
 *           InboundMessage, OutboundMessage
 *
 * NOTE: Path is /leadconnector/, not /gohighlevel/. GHL's white-label policy
 * rejects any URL containing 'ghl' or 'highlevel' as a substring on the app.
 *
 * Returns 200 immediately after persisting the raw event — heavy processing
 * happens in Inngest.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/inngest/client'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[GHL Webhook]'
const MAX_BODY_SIZE = 2 * 1024 * 1024 // 2MB

// Cache the imported CryptoKey across requests to avoid re-parsing the PEM
// on every webhook. Module-scope cache survives within the Edge isolate.
let cachedPublicKey: CryptoKey | null = null

/**
 * Decode base64 (standard or URL-safe) into a Uint8Array.
 */
function base64ToBytes(b64: string): Uint8Array {
  // Normalize URL-safe base64 (+/_, no padding) to standard
  const normalized = b64.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/**
 * Convert a PEM-encoded public key to an ArrayBuffer (SPKI DER).
 */
function pemToSpki(pem: string): ArrayBuffer {
  const stripped = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')
  // Slice into a real ArrayBuffer (not a SharedArrayBuffer view)
  const bytes = base64ToBytes(stripped)
  const buf = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buf).set(bytes)
  return buf
}

/**
 * Lazy-load + cache the GHL marketplace public key as a CryptoKey.
 */
async function getGhlPublicKey(): Promise<CryptoKey | null> {
  if (cachedPublicKey) return cachedPublicKey

  const pem = process.env.GHL_MARKETPLACE_PUBLIC_KEY
  if (!pem || !pem.includes('BEGIN PUBLIC KEY')) {
    safeError(`${LOG_PREFIX} GHL_MARKETPLACE_PUBLIC_KEY missing or malformed`)
    return null
  }

  try {
    const spki = pemToSpki(pem)
    cachedPublicKey = await crypto.subtle.importKey(
      'spki',
      spki,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    )
    return cachedPublicKey
  } catch (err) {
    safeError(`${LOG_PREFIX} Failed to import GHL public key:`, err)
    return null
  }
}

/**
 * Verify the inbound payload signature against GHL's marketplace public key.
 *
 * GHL signs every marketplace webhook with their PRIVATE RSA key and sends
 * the base64-encoded SHA-256 signature in the `x-wh-signature` header. We
 * verify with their PUBLIC key — there is no shared secret to configure.
 */
async function verifySignature(request: NextRequest, rawBody: string): Promise<boolean> {
  const key = await getGhlPublicKey()
  if (!key) return false

  const signatureB64 =
    request.headers.get('x-wh-signature') || request.headers.get('x-ghl-signature')
  if (!signatureB64) return false

  try {
    // Web Crypto wants a real ArrayBuffer (not a typed-array view) under
    // strict TS lib settings — copy the bytes into a fresh ArrayBuffer.
    const sigBytes = base64ToBytes(signatureB64.trim())
    const sigBuf = new ArrayBuffer(sigBytes.byteLength)
    new Uint8Array(sigBuf).set(sigBytes)

    const dataBytes = new TextEncoder().encode(rawBody)
    const dataBuf = new ArrayBuffer(dataBytes.byteLength)
    new Uint8Array(dataBuf).set(dataBytes)

    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      sigBuf,
      dataBuf
    )
  } catch (err) {
    safeError(`${LOG_PREFIX} Signature verify error:`, err)
    return false
  }
}

/**
 * Map a GHL location_id back to the Cursive workspace_id by looking up the
 * crm_connections table.
 */
async function resolveWorkspaceId(locationId: string): Promise<string | null> {
  if (!locationId) return null
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('crm_connections')
    .select('workspace_id')
    .eq('provider', 'gohighlevel')
    .eq('status', 'active')
    .filter('metadata->>location_id', 'eq', locationId)
    .maybeSingle()

  if (error) {
    safeError(`${LOG_PREFIX} Failed to resolve workspace from locationId:`, error.message)
    return null
  }
  return (data?.workspace_id as string) ?? null
}

interface GhlWebhookPayload {
  type?: string
  locationId?: string
  companyId?: string
  contactId?: string
  opportunityId?: string
  [key: string]: unknown
}

export async function POST(request: NextRequest) {
  try {
    // Read raw body once — required for signature verification.
    const rawBody = await request.text()
    if (rawBody.length > MAX_BODY_SIZE) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    // Verify signature with GHL's public RSA key.
    const ok = await verifySignature(request, rawBody)
    if (!ok) {
      safeError(`${LOG_PREFIX} Signature verification failed`)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse payload
    let payload: GhlWebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const eventType = payload.type || 'unknown'
    const locationId = payload.locationId || ''

    // Resolve workspace from location — GHL webhooks are tenant-scoped.
    const workspaceId = await resolveWorkspaceId(locationId)
    if (!workspaceId) {
      // Acknowledge so GHL doesn't retry forever, but log for follow-up.
      safeLog(`${LOG_PREFIX} No active workspace for location ${locationId} (event=${eventType})`)
      return NextResponse.json({ ok: true, status: 'no_workspace' }, { status: 200 })
    }

    // Persist raw event for debugging / replay.
    const supabase = createAdminClient()
    await supabase.from('audit_logs').insert({
      workspace_id: workspaceId,
      action: 'webhook_received',
      resource_type: 'integration',
      metadata: {
        provider: 'gohighlevel',
        event_type: eventType,
        location_id: locationId,
        contact_id: payload.contactId ?? null,
        opportunity_id: payload.opportunityId ?? null,
        payload, // full payload for replay
      },
      severity: 'info',
    })

    // Fan out to Inngest for async processing.
    await inngest.send({
      name: 'ghl/webhook.received',
      data: {
        workspaceId,
        eventType,
        locationId,
        payload,
      },
    })

    // Return 200 immediately — keep handler under 250ms.
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error: unknown) {
    safeError(`${LOG_PREFIX} Handler error:`, error)
    // Return 200 to avoid retry storms during transient errors; we've already
    // logged. Switch to 500 if we want GHL to retry.
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

// GHL sends a verification GET when configuring some webhook types.
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Cursive GoHighLevel webhook endpoint. POST events here.',
  })
}
