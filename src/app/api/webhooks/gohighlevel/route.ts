/**
 * GoHighLevel Inbound Webhook Handler
 * Cursive Platform
 *
 * Receives webhook events from GoHighLevel (contact updates, opportunity stage
 * changes, message events, call recordings, etc.) and routes them to the
 * appropriate Inngest handler for async processing.
 *
 * GHL signs payloads with HMAC-SHA256 using the webhook secret configured in
 * the Marketplace app settings (header: x-wh-signature). We verify the
 * signature against the RAW body before parsing JSON.
 *
 * Configure in GHL Marketplace App → Webhooks:
 *   Endpoint: https://leads.meetcursive.com/api/webhooks/gohighlevel
 *   Events: ContactCreate, ContactUpdate, OpportunityCreate, OpportunityStatusUpdate,
 *           InboundMessage, OutboundMessage, CallStatusUpdate
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

/**
 * Constant-time string comparison.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * HMAC-SHA256 hex using Web Crypto API.
 */
async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verify the inbound payload signature against GHL_WEBHOOK_SECRET.
 *
 * GHL supports multiple signing schemes depending on app configuration. We
 * accept either:
 *   - Raw HMAC hex in `x-wh-signature` (legacy / shared-secret webhooks)
 *   - `sha256=<hex>` prefix in `x-wh-signature` (newer marketplace flow)
 */
async function verifySignature(request: NextRequest, rawBody: string): Promise<boolean> {
  const secret = process.env.GHL_WEBHOOK_SECRET
  if (!secret) {
    safeError(`${LOG_PREFIX} GHL_WEBHOOK_SECRET not configured`)
    return false
  }

  const signature =
    request.headers.get('x-wh-signature') ||
    request.headers.get('x-ghl-signature') ||
    request.headers.get('x-webhook-signature')

  if (!signature) {
    return false
  }

  const expected = await hmacSha256Hex(secret, rawBody)
  const provided = signature.replace(/^sha256=/, '').trim()
  return safeEqual(provided.toLowerCase(), expected.toLowerCase())
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

    // Verify signature
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
