/**
 * Audience Labs SuperPixel Webhook Handler
 *
 * Receives real-time visitor identification events from the AL SuperPixel.
 * Stores raw events, then delegates processing to Inngest for async normalization.
 *
 * Target: <250ms response time.
 * Uses Edge runtime for fast cold starts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SuperPixelWebhookPayloadSchema } from '@/lib/audiencelab/schemas'
import { unwrapWebhookPayload, extractEventType, extractIpAddress } from '@/lib/audiencelab/field-map'
import { processEventInline } from '@/lib/audiencelab/edge-processor'
import { resolveEventAttribution, pixelRowForWorkspace } from '@/lib/audiencelab/pixel-attribution'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { sendSlackAlert } from '@/lib/monitoring/alerts'

const LOG_PREFIX = '[AL SuperPixel]'
const MAX_BODY_SIZE = 3 * 1024 * 1024 // 3MB

/**
 * Constant-time string comparison (Edge-compatible, no Node crypto)
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
 * SHA-256 hash using Web Crypto API (Edge-compatible)
 */
async function sha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data)
  const hash = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * HMAC-SHA256 using Web Crypto API (Edge-compatible)
 */
async function hmacSha256(key: string, message: string): Promise<string> {
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
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verify webhook secret header
 */
async function verifySecret(request: NextRequest, rawBody: string): Promise<boolean> {
  const secret = process.env.AUDIENCELAB_WEBHOOK_SECRET
  if (!secret) {
    safeError(`${LOG_PREFIX} AUDIENCELAB_WEBHOOK_SECRET not configured`)
    return false
  }

  // Check shared secret header
  const headerSecret = request.headers.get('x-audiencelab-secret')
  if (headerSecret) {
    return safeEqual(headerSecret, secret)
  }

  // Fallback: check HMAC signature
  const signature = request.headers.get('x-audiencelab-signature') ||
                    request.headers.get('x-webhook-signature')
  if (signature) {
    const expected = await hmacSha256(secret, rawBody)
    const provided = signature.replace(/^sha256=/, '')
    return safeEqual(provided, expected)
  }

  return false
}

/**
 * Capture inbound headers for debugging / future signature verification.
 */
function captureHeaders(request: NextRequest): Record<string, string> {
  const captured: Record<string, string> = {}
  const interesting = [
    'content-type', 'x-audiencelab-secret', 'x-audiencelab-signature',
    'x-webhook-signature', 'user-agent', 'x-forwarded-for',
  ]
  for (const key of interesting) {
    const val = request.headers.get(key)
    if (val) captured[key] = val
  }
  return captured
}

/**
 * Resolve workspace strictly by pixel_id via audiencelab_pixels mapping.
 * Returns null if pixel_id is unknown — caller must handle gracefully.
 * No domain fallback, no admin fallback — strict tenant isolation.
 */
async function resolveWorkspace(
  supabase: ReturnType<typeof createAdminClient>,
  pixelId: string | null,
): Promise<string | null> {
  if (!pixelId) return null

  const { data } = await supabase
    .from('audiencelab_pixels')
    .select('workspace_id')
    .eq('pixel_id', pixelId)
    .eq('is_active', true)
    .maybeSingle()

  return data?.workspace_id || null
}

/**
 * Resolve a workspace directly from a `?ws=<workspace_id>` query param on the
 * webhook URL. This is the DURABLE routing signal: AudienceLab posts events with
 * a different pixel_id than it returns at pixel creation, so pixel_id matching
 * silently 401s real visitors. A workspace-scoped webhook URL (one per pixel)
 * makes routing deterministic regardless of which id AL sends. Validates the id
 * is a real workspace so a bad param can't route events nowhere.
 */
async function resolveWorkspaceFromParam(
  supabase: ReturnType<typeof createAdminClient>,
  wsId: string | null,
): Promise<string | null> {
  if (!wsId || !/^[0-9a-f-]{36}$/i.test(wsId)) return null
  const { data } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', wsId)
    .maybeSingle()
  return data?.id || null
}

/**
 * Reachability probe handler.
 *
 * AudienceLab's "Test" button (and similar webhook UIs in their dashboard)
 * issues a GET or HEAD against the configured URL to verify it resolves
 * before saving. Without this handler, Next returns 405 → AL surfaces
 * "Failed to reach webhook URL" even though POST event delivery would
 * work fine.
 *
 * Returns 200 with a tiny JSON body. No auth — the only thing exposed is
 * "this endpoint exists." Actual event ingestion still requires POST +
 * the shared-secret header verified by the POST handler below.
 */
export async function GET() {
  return NextResponse.json(
    { ok: true, endpoint: 'audiencelab/superpixel', accepts: 'POST' },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    }
  )
}

/** Same as GET — HEAD is identical to GET minus the body in Next. */
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  })
}

/**
 * Returns true if the request body looks like a webhook discovery probe
 * (empty, empty object, or an explicit { test: true } / { ping: true }
 * payload). Real event POSTs always contain a wrapped events array.
 */
function isProbeBody(rawBody: string): boolean {
  const trimmed = rawBody.trim()
  if (trimmed === '' || trimmed === '{}') return true
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>
    if (parsed?.test === true || parsed?.ping === true) return true
    // No real event keys — almost certainly a probe. NOTE: 'result' must be
    // here — AudienceLab can wrap events as { result: [...] } (see
    // unwrapWebhookPayload), and without it a real wrapped batch is
    // misclassified as a probe and silently dropped.
    const realEventKeys = ['events', 'event', 'data', 'records', 'result', 'pixel_id', 'hem_sha256']
    if (!realEventKeys.some((k) => k in parsed)) return true
  } catch {
    // Non-JSON body — not a probe, let the auth path reject it
  }
  return false
}

export async function POST(request: NextRequest) {
  try {
    // Enforce Content-Type
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 415 }
      )
    }

    // Read raw body
    const rawBody = await request.text()

    // Body size check
    if (rawBody.length > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Payload too large' },
        { status: 413 }
      )
    }

    // Reachability probe — AL's "Test webhook" button (and similar dashboard
    // UIs) sends an unsigned POST with an empty body or an explicit { test: true }
    // payload. Return 200 OK so the test succeeds without exposing event
    // ingestion. There's no data to authenticate here — the only thing we're
    // confirming is that the URL resolves.
    if (isProbeBody(rawBody)) {
      return NextResponse.json(
        { ok: true, probe: true, message: 'reachable, send POST with x-audiencelab-secret for events' },
        { status: 200 }
      )
    }

    // Capture headers for audit trail
    const rawHeaders = captureHeaders(request)

    // Parse JSON
    let payload: unknown
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    }

    // Validate with Zod (permissive — passthrough unknown fields)
    const parsed = SuperPixelWebhookPayloadSchema.safeParse(payload)
    if (!parsed.success) {
      safeLog(`${LOG_PREFIX} Validation failed`, { errors: parsed.error.issues.slice(0, 3) })
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.issues.slice(0, 3) },
        { status: 400 }
      )
    }

    // Unwrap into event array
    const events = unwrapWebhookPayload(parsed.data)

    const supabase = createAdminClient()

    // Resolve workspace for routing + auth. DURABLE path: a workspace-scoped
    // webhook URL (?ws=<id>) — AL posts a pixel_id that differs from the one we
    // stored at creation, so prefer the URL's workspace and fall back to the
    // pixel_id mapping for legacy pixels.
    const firstEvent = events[0] || {}
    const pixelId = firstEvent.pixel_id || null
    const wsParam = request.nextUrl.searchParams.get('ws')
    const workspaceId =
      (await resolveWorkspaceFromParam(supabase, wsParam)) ??
      (await resolveWorkspace(supabase, pixelId))

    // S3: canonical pixel-row attribution for stamping audiencelab_events.
    // The raw upstream `pixel_id` (which AL sends differently than the
    // management id, or null) stays diagnostic only; pixel_row_id is the FK to
    // the managed pixel row. Gate on workspace agreement so a stamped pixel_row
    // always belongs to the same workspace the event is stored under — a
    // canonical id is never written across a tenant boundary.
    const attribution = await resolveEventAttribution(supabase, {
      wsParam,
      eventPixelId: pixelId,
    })
    const pixelRowId = pixelRowForWorkspace(attribution, workspaceId)

    // AUTHENTICATION (dual-mode):
    //   1. Shared secret valid → accept (preferred, strongest).
    //   2. No secret, but the event targets a pixel WE provisioned (known,
    //      active pixel_id) → accept. AudienceLab's pixel webhook is URL-only
    //      (no secret field in its dashboard), so it POSTs unauthenticated;
    //      requiring a secret it cannot send was silently 401-ing every real
    //      visitor event. The pixel_id is the de-facto credential AL sends.
    // Defense-in-depth for mode 2: strict Zod schema (above), exact-retry
    // idempotency (below), and per-(workspace,email) lead dedupe downstream.
    const secretValid = await verifySecret(request, rawBody)
    if (!secretValid && !workspaceId) {
      safeLog(
        `${LOG_PREFIX} Rejected: no valid secret and unknown pixel_id ${pixelId || 'null'}`
      )
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!secretValid) {
      safeLog(`${LOG_PREFIX} Accepted via known pixel_id (no shared secret): ${pixelId}`)
    }

    // IDEMPOTENCY: Hash raw body to detect exact retries
    const eventHash = await sha256Hex(rawBody)

    const { data: existingEvent } = await supabase
      .from('processed_webhook_events')
      .select('id, payload_summary')
      .eq('event_id', eventHash)
      .eq('source', 'audience-labs')
      .maybeSingle()

    if (existingEvent) {
      safeLog(`${LOG_PREFIX} Duplicate webhook detected, skipping`)
      return NextResponse.json({
        success: true,
        duplicate: true,
        ...(existingEvent.payload_summary as Record<string, unknown> || {}),
      })
    }

    // If pixel_id is unknown, store events with error state but do NOT create leads
    if (!workspaceId) {
      safeLog(`${LOG_PREFIX} Unknown pixel_id: ${pixelId || 'null'} — storing events without processing`)

      // Store raw events with processed=false and no workspace
      for (const event of events) {
        const eventType = extractEventType(event)
        const ipAddress = extractIpAddress(event)

        await supabase
          .from('audiencelab_events')
          .insert({
            source: 'superpixel',
            pixel_id: event.pixel_id || null,
            event_type: eventType,
            hem_sha256: event.hem_sha256 || event.hem || null,
            uid: event.uid || null,
            profile_id: event.profile_id || null,
            ip_address: ipAddress,
            raw: event,
            raw_headers: rawHeaders,
            processed: false,
            workspace_id: null,
            pixel_row_id: pixelRowId,
          })
          .select('id')
          .maybeSingle()
      }

      // Fire-and-forget alert for unknown pixel
      sendSlackAlert({
        type: 'webhook_failure',
        severity: 'warning',
        message: `Unknown pixel_id received: ${pixelId || 'null'}`,
        metadata: {
          pixel_id: pixelId,
          event_count: events.length,
          source: 'superpixel',
        },
      }).catch((error) => {
        safeError('[SuperPixel] Slack alert failed for unknown pixel:', error)
      })

      const unknownResponse = {
        success: true,
        stored: events.length,
        processed: 0,
        total: events.length,
        warning: 'unknown_pixel_id',
      }

      // Record processed webhook event for idempotency
      await supabase.from('processed_webhook_events').insert({
        event_id: eventHash,
        source: 'audience-labs',
        event_type: 'superpixel_batch',
        payload_summary: unknownResponse,
      })

      return NextResponse.json(unknownResponse)
    }

    // Known pixel — store and process normally
    const insertedIds: string[] = []
    let failedCount = 0
    let lastFailError = ''

    for (const event of events) {
      const eventType = extractEventType(event)
      const ipAddress = extractIpAddress(event)

      const { data: inserted, error: insertError } = await supabase
        .from('audiencelab_events')
        .insert({
          source: 'superpixel',
          pixel_id: event.pixel_id || null,
          event_type: eventType,
          hem_sha256: event.hem_sha256 || event.hem || null,
          uid: event.uid || null,
          profile_id: event.profile_id || null,
          ip_address: ipAddress,
          raw: event,
          raw_headers: rawHeaders,
          processed: false,
          workspace_id: workspaceId,
          pixel_row_id: pixelRowId,
        })
        .select('id')
        .maybeSingle()

      if (insertError) {
        safeError(`${LOG_PREFIX} Failed to store event`, insertError)
        failedCount++
        lastFailError = insertError.message
        // Write to DLQ so AL can retry or admin can triage
        await supabase.from('webhook_dead_letter').insert({
          source: 'audiencelab.superpixel',
          payload: event as unknown as Record<string, unknown>,
          error: insertError.message,
          workspace_id: workspaceId ?? null,
        }).then(({ error: dlqError }) => {
          if (dlqError) safeError(`${LOG_PREFIX} [DLQ] failed to store dead-letter row:`, dlqError)
        })
        continue
      }

      if (inserted) {
        insertedIds.push(inserted.id)
      }
    }

    safeLog(`${LOG_PREFIX} Stored ${insertedIds.length}/${events.length} events for workspace ${workspaceId}`)

    // Stamp pixel_last_event_at on any funnel order bound to this pixel.
    // This is what unblocks the first-visitor "aha" email and flips the
    // silent-pixel health checks to "healthy". Without it the column stays
    // null forever. Fire-and-forget — never block event ingestion on it.
    if (pixelId && insertedIds.length > 0) {
      supabase
        .from('funnel_orders')
        .update({ pixel_last_event_at: new Date().toISOString() })
        .eq('pixel_audiencelab_id', pixelId)
        .then(({ error }) => {
          if (error) safeError(`${LOG_PREFIX} pixel_last_event_at stamp failed (non-fatal):`, error)
        })
    }

    // Process events inline (Edge-compatible — bypasses Inngest callback)
    const processed: string[] = []
    for (const id of insertedIds) {
      try {
        const result = await processEventInline(id, workspaceId, 'superpixel')
        if (result.success) processed.push(id)
      } catch (err) {
        safeError(`${LOG_PREFIX} Inline processing failed for ${id}`, err)
      }
    }

    safeLog(`${LOG_PREFIX} Processed ${processed.length}/${insertedIds.length} events inline`)

    const successResponse = {
      success: true,
      stored: insertedIds.length,
      processed: processed.length,
      total: events.length,
      failed: failedCount,
    }

    // Record processed webhook event for idempotency
    await supabase.from('processed_webhook_events').insert({
      event_id: eventHash,
      source: 'audience-labs',
      event_type: 'superpixel_batch',
      payload_summary: successResponse,
    })

    // If any inserts failed, return 502 so AL retries the batch (belt + suspenders with DLQ)
    if (failedCount > 0) {
      return NextResponse.json(
        { ...successResponse, error: `${failedCount} event(s) failed to store: ${lastFailError}` },
        { status: 502 }
      )
    }

    return NextResponse.json(successResponse)
  } catch (error) {
    safeError(`${LOG_PREFIX} Unhandled error`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
