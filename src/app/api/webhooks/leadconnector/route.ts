/**
 * GoHighLevel Marketplace Inbound Webhook Handler
 * Cursive Platform
 *
 * Receives webhook events from GHL Marketplace apps (contact updates,
 * opportunity stage changes, conversation messages) and routes them to the
 * appropriate Inngest handler for async processing.
 *
 * ─── SIGNATURE VERIFICATION ──────────────────────────────────────────────────
 * GHL sends TWO signature headers on every marketplace webhook:
 *
 *   x-ghl-signature   — Ed25519 signature  (newer; base64-encoded)
 *   x-wh-signature    — RSA-SHA256 signature (legacy; base64-encoded)
 *
 * Both headers ship on every request. We prefer Ed25519 (faster, smaller)
 * and fall back to RSA if the Ed25519 key is not yet configured.
 *
 * Per GHL docs: the legacy header can carry the literal string 'N/A' instead
 * of a signature. Treat that as missing — refuse the request.
 *
 * RSA public key (RSASSA-PKCS1-v1_5 SHA-256, 4096-bit):
 *   Hard-coded below as GHL_RSA_PUBLIC_KEY_PEM — this is the well-known key
 *   published at https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide
 *   Override via GHL_MARKETPLACE_PUBLIC_KEY env var if GHL ever rotates it.
 *
 * Ed25519 public key:
 *   Set GHL_MARKETPLACE_ED25519_KEY env var (base64-encoded raw 32-byte key)
 *   from the same docs page → "Ed25519 Signature Verification" section.
 *   When set, Ed25519 is tried first; RSA is a fallback.
 *
 * ─── CONFIGURE IN GHL MARKETPLACE APP → WEBHOOKS ────────────────────────────
 *   Endpoint: https://leads.meetcursive.com/api/webhooks/leadconnector
 *   Events: ContactCreate, ContactUpdate, OpportunityCreate,
 *           OpportunityStatusUpdate, InboundMessage, OutboundMessage
 *
 * NOTE: Path is /leadconnector/, not /gohighlevel/. GHL's white-label policy
 * rejects any URL containing 'ghl' or 'highlevel' as a substring.
 *
 * Returns 200 immediately — heavy processing happens in Inngest.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/inngest/client'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[GHL Webhook]'
const MAX_BODY_SIZE = 2 * 1024 * 1024 // 2MB

// ─── WELL-KNOWN RSA PUBLIC KEY ─────────────────────────────────────────────
// Published by GHL at https://marketplace.gohighlevel.com/docs/webhook/
// Identical across both legacy (2021-04-15) and current (2023-02-21) doc pages.
// Override with GHL_MARKETPLACE_PUBLIC_KEY env var if GHL rotates the key.
const GHL_RSA_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAokvo/r9tVgcfZ5DysOSC
Frm602qYV0MaAiNnX9O8KxMbiyRKWeL9JpCpVpt4XHIcBOK4u3cLSqJGOLaPuXw6
dO0t6Q/ZVdAV5Phz+ZtzPL16iCGeK9po6D6JHBpbi989mmzMryUnQJezlYJ3DVfB
csedpinheNnyYeFXolrJvcsjDtfAeRx5ByHQmTnSdFUzuAnC9/GepgLT9SM4nCpv
uxmZMxrJt5Rw+VUaQ9B8JSvbMPpez4peKaJPZHBbU3OdeCVx5klVXXZQGNHOs8gF
3kvoV5rTnXV0IknLBXlcKKAQLZcY/Q9rG6Ifi9c+5vqlvHPCUJFT5XUGG5RKgOKU
J062fRtN+rLYZUV+BjafxQauvC8wSWeYja63VSUruvmNj8xkx2zE/Juc+yjLjTXp
IocmaiFeAO6fUtNjDeFVkhf5LNb59vECyrHD2SQIrhgXpO4Q3dVNA5rw576PwTzN
h/AMfHKIjE4xQA1SZuYJmNnmVZLIZBlQAF9Ntd03rfadZ+yDiOXCCs9FkHibELhC
HULgCsnuDJHcrGNd5/Ddm5hxGQ0ASitgHeMZ0kcIOwKDOzOU53lDza6/Y09T7sYJ
PQe7z0cvj7aE4B+Ax1ZoZGPzpJlZtGXCsu9aTEGEnKzmsFqwcSsnw3JB31IGKAyk
T1hhTiaCeIY/OwwwNUY2yvcCAwEAAQ==
-----END PUBLIC KEY-----`

// ─── MODULE-LEVEL KEY CACHE ────────────────────────────────────────────────
// Avoids re-importing the PEM on every request within an Edge isolate.
let cachedRsaKey: CryptoKey | null = null
let cachedEd25519Key: CryptoKey | null = null

// ─── HELPERS ───────────────────────────────────────────────────────────────

/** Decode base64 (standard or URL-safe) into a fresh ArrayBuffer. */
function base64ToBuffer(b64: string): ArrayBuffer {
  const normalized = b64.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const buf = new ArrayBuffer(binary.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i)
  return buf
}

/** Strip PEM headers/footers and whitespace, return SPKI DER as ArrayBuffer. */
function pemToSpki(pem: string): ArrayBuffer {
  const stripped = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')
  return base64ToBuffer(stripped)
}

/** Lazy-import and cache the RSA CryptoKey. */
async function getRsaKey(): Promise<CryptoKey | null> {
  if (cachedRsaKey) return cachedRsaKey
  const pem = process.env.GHL_MARKETPLACE_PUBLIC_KEY || GHL_RSA_PUBLIC_KEY_PEM
  try {
    cachedRsaKey = await crypto.subtle.importKey(
      'spki',
      pemToSpki(pem),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    )
    return cachedRsaKey
  } catch (err) {
    safeError(`${LOG_PREFIX} Failed to import RSA public key:`, err)
    return null
  }
}

/** Lazy-import and cache the Ed25519 CryptoKey (optional). */
async function getEd25519Key(): Promise<CryptoKey | null> {
  if (cachedEd25519Key) return cachedEd25519Key
  const b64Key = process.env.GHL_MARKETPLACE_ED25519_KEY
  if (!b64Key) return null
  try {
    cachedEd25519Key = await crypto.subtle.importKey(
      'raw',
      base64ToBuffer(b64Key),
      { name: 'Ed25519' },
      false,
      ['verify']
    )
    return cachedEd25519Key
  } catch (err) {
    safeError(`${LOG_PREFIX} Failed to import Ed25519 key:`, err)
    return null
  }
}

/** Encode text to a fresh ArrayBuffer (strict-TS BufferSource compat). */
function encodeText(text: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(text)
  const buf = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buf).set(bytes)
  return buf
}

// ─── SIGNATURE VERIFICATION ────────────────────────────────────────────────

/**
 * Verify the inbound payload against GHL's published public keys.
 *
 * Strategy:
 *   1. Refuse the literal string 'N/A' (GHL's "no signature" sentinel).
 *   2. Try Ed25519 (x-ghl-signature) if the key env var is configured.
 *   3. Fall back to RSA-SHA256 (x-wh-signature) with the hardcoded key.
 *   4. Reject if neither passes.
 */
async function verifySignature(request: NextRequest, rawBody: string): Promise<boolean> {
  const edSig = request.headers.get('x-ghl-signature')?.trim() ?? null
  const rsaSig = request.headers.get('x-wh-signature')?.trim() ?? null

  // GHL docs: the legacy header may carry 'N/A' — treat as absent.
  const validEdSig = edSig && edSig !== 'N/A' ? edSig : null
  const validRsaSig = rsaSig && rsaSig !== 'N/A' ? rsaSig : null

  if (!validEdSig && !validRsaSig) {
    safeError(`${LOG_PREFIX} No valid signature header present`)
    return false
  }

  const data = encodeText(rawBody)

  // ── Prefer Ed25519 ────────────────────────────────────────────────────────
  if (validEdSig) {
    const edKey = await getEd25519Key()
    if (edKey) {
      try {
        const ok = await crypto.subtle.verify(
          'Ed25519',
          edKey,
          base64ToBuffer(validEdSig),
          data
        )
        if (ok) return true
        safeError(`${LOG_PREFIX} Ed25519 signature invalid`)
        // Fall through to RSA — don't short-circuit on Ed25519 failure alone
        // in case the payload was signed before a key rotation.
      } catch (err) {
        safeError(`${LOG_PREFIX} Ed25519 verify error:`, err)
        // Edge runtime may not support Ed25519 yet on older V8 builds.
        // Fall through to RSA.
      }
    }
  }

  // ── RSA fallback ──────────────────────────────────────────────────────────
  if (validRsaSig) {
    const rsaKey = await getRsaKey()
    if (!rsaKey) return false
    try {
      return await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        rsaKey,
        base64ToBuffer(validRsaSig),
        data
      )
    } catch (err) {
      safeError(`${LOG_PREFIX} RSA verify error:`, err)
      return false
    }
  }

  return false
}

// ─── WORKSPACE RESOLUTION ──────────────────────────────────────────────────

/**
 * Map a GHL location_id back to the Cursive workspace_id via crm_connections.
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

// ─── PAYLOAD TYPE ──────────────────────────────────────────────────────────

interface GhlWebhookPayload {
  type?: string
  locationId?: string
  companyId?: string
  contactId?: string
  opportunityId?: string
  [key: string]: unknown
}

// ─── HANDLER ───────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    if (rawBody.length > MAX_BODY_SIZE) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    const ok = await verifySignature(request, rawBody)
    if (!ok) {
      safeError(`${LOG_PREFIX} Signature verification failed`)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    let payload: GhlWebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const eventType = payload.type || 'unknown'
    const locationId = payload.locationId || ''

    const workspaceId = await resolveWorkspaceId(locationId)
    if (!workspaceId) {
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
        payload,
      },
      severity: 'info',
    })

    // Fan out to Inngest for async processing.
    await inngest.send({
      name: 'ghl/webhook.received',
      data: { workspaceId, eventType, locationId, payload },
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error: unknown) {
    safeError(`${LOG_PREFIX} Handler error:`, error)
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
