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

    // Capture headers for audit trail
    const rawHeaders = captureHeaders(request)

    // Verify authentication
    if (!(await verifySecret(request, rawBody))) {
      safeLog(`${LOG_PREFIX} Rejected: invalid secret/signature`)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

    // Resolve workspace strictly by pixel_id
    const firstEvent = events[0] || {}
    const pixelId = firstEvent.pixel_id || null
    const workspaceId = await resolveWorkspace(supabase, pixelId)

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
        })
        .select('id')
        .maybeSingle()

      if (insertError) {
        safeError(`${LOG_PREFIX} Failed to store event`, insertError)
        continue
      }

      if (inserted) {
        insertedIds.push(inserted.id)
      }
    }

    safeLog(`${LOG_PREFIX} Stored ${insertedIds.length}/${events.length} events for workspace ${workspaceId}`)

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
    }

    // Record processed webhook event for idempotency
    await supabase.from('processed_webhook_events').insert({
      event_id: eventHash,
      source: 'audience-labs',
      event_type: 'superpixel_batch',
      payload_summary: successResponse,
    })

    return NextResponse.json(successResponse)
  } catch (error) {
    safeError(`${LOG_PREFIX} Unhandled error`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
