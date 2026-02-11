/**
 * Audience Labs SuperPixel Webhook Handler
 *
 * Receives real-time visitor identification events from the AL SuperPixel.
 * Stores raw events, then delegates processing to Inngest for async normalization.
 *
 * Target: <250ms response time.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { SuperPixelWebhookPayloadSchema } from '@/lib/audiencelab/schemas'
import { unwrapWebhookPayload, extractEventType, extractIpAddress } from '@/lib/audiencelab/field-map'
import { inngest } from '@/inngest/client'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[AL SuperPixel]'
const MAX_BODY_SIZE = 3 * 1024 * 1024 // 3MB

/**
 * Verify webhook secret header
 */
function verifySecret(request: NextRequest, rawBody: string): boolean {
  const secret = process.env.AUDIENCELAB_WEBHOOK_SECRET
  if (!secret) {
    // If no secret configured, reject all requests
    console.error(`${LOG_PREFIX} AUDIENCELAB_WEBHOOK_SECRET not configured`)
    return false
  }

  // Check shared secret header
  const headerSecret = request.headers.get('x-audiencelab-secret')
  if (headerSecret) {
    return crypto.timingSafeEqual(
      Buffer.from(headerSecret),
      Buffer.from(secret)
    )
  }

  // Fallback: check HMAC signature
  const signature = request.headers.get('x-audiencelab-signature') ||
                    request.headers.get('x-webhook-signature')
  if (signature) {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    const provided = signature.replace(/^sha256=/, '')
    try {
      return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
    } catch {
      return false
    }
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
 * Resolve workspace from pixel_id or domain via audiencelab_pixels mapping.
 * Falls back to admin workspace if no mapping found.
 */
async function resolveWorkspace(
  supabase: ReturnType<typeof createAdminClient>,
  pixelId: string | null,
  landingUrl: string | null
): Promise<string | null> {
  // Priority 1: pixel_id mapping
  if (pixelId) {
    const { data } = await supabase
      .from('audiencelab_pixels')
      .select('workspace_id')
      .eq('pixel_id', pixelId)
      .eq('is_active', true)
      .single()
    if (data?.workspace_id) return data.workspace_id
  }

  // Priority 2: domain mapping from landing_url
  if (landingUrl) {
    try {
      const domain = new URL(landingUrl).hostname.replace(/^www\./, '')
      const { data } = await supabase
        .from('audiencelab_pixels')
        .select('workspace_id')
        .eq('domain', domain)
        .eq('is_active', true)
        .single()
      if (data?.workspace_id) return data.workspace_id
    } catch { /* invalid URL, skip */ }
  }

  // Priority 3: fallback to admin workspace (well-known UUID)
  const ADMIN_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000'
  const { data: adminWorkspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', ADMIN_WORKSPACE_ID)
    .single()
  return adminWorkspace?.id || null
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
    if (!verifySecret(request, rawBody)) {
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

    // Resolve workspace from first event's pixel_id or landing_url
    const firstEvent = events[0] || {}
    const workspaceId = await resolveWorkspace(
      supabase,
      firstEvent.pixel_id || null,
      firstEvent.landing_url || firstEvent.page_url || null
    )

    // Store raw events and queue processing
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
        .single()

      if (insertError) {
        safeError(`${LOG_PREFIX} Failed to store event`, insertError)
        continue
      }

      if (inserted) {
        insertedIds.push(inserted.id)

        // Queue async processing via Inngest
        await inngest.send({
          name: 'audiencelab/event-received',
          data: {
            event_id: inserted.id,
            workspace_id: workspaceId || '',
            source: 'superpixel' as const,
          },
        })
      }
    }

    safeLog(`${LOG_PREFIX} Stored ${insertedIds.length}/${events.length} events`)

    return NextResponse.json({
      success: true,
      stored: insertedIds.length,
      total: events.length,
    })
  } catch (error) {
    safeError(`${LOG_PREFIX} Unhandled error`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
