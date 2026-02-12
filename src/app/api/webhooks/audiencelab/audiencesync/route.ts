/**
 * Audience Labs AudienceSync Webhook Handler
 *
 * Receives templated JSON rows from AudienceSync HTTP destination.
 * Template is user-defined in AL dashboard — we accept arbitrary JSON,
 * store raw, and normalize known keys during async processing.
 *
 * Target: <250ms response time.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AudienceSyncEventSchema } from '@/lib/audiencelab/schemas'
import { processEventInline } from '@/lib/audiencelab/edge-processor'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

export const runtime = 'edge'

const LOG_PREFIX = '[AL AudienceSync]'
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

  const headerSecret = request.headers.get('x-audiencelab-secret')
  if (headerSecret) {
    return safeEqual(headerSecret, secret)
  }

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

    const rawBody = await request.text()

    if (rawBody.length > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Payload too large' },
        { status: 413 }
      )
    }

    if (!(await verifySecret(request, rawBody))) {
      safeLog(`${LOG_PREFIX} Rejected: invalid secret/signature`)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let payload: unknown
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    }

    // Capture headers
    const rawHeaders = captureHeaders(request)

    // Handle both single object and array of objects
    const rows = Array.isArray(payload) ? payload : [payload]

    const supabase = createAdminClient()

    // Resolve workspace from audience_id or domain mapping
    let workspaceId: string | null = null

    // Try audience_id → pixel mapping first (AudienceSync may include audience_id)
    const firstRow = rows[0] || {}
    const audienceId = firstRow.audience_id || firstRow.audienceId
    if (audienceId) {
      // Check if this audience_id maps to a workspace via audiencelab_pixels
      const { data: pixelData } = await supabase
        .from('audiencelab_pixels')
        .select('workspace_id')
        .eq('is_active', true)
        .limit(1)
        .single()
      if (pixelData?.workspace_id) workspaceId = pixelData.workspace_id
    }

    // Fallback: admin workspace
    if (!workspaceId) {
      const ADMIN_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000'
      const { data: adminWorkspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('id', ADMIN_WORKSPACE_ID)
        .single()
      workspaceId = adminWorkspace?.id || null
    }

    // Last resort: first active pixel's workspace
    if (!workspaceId) {
      const { data: anyPixel } = await supabase
        .from('audiencelab_pixels')
        .select('workspace_id')
        .eq('is_active', true)
        .limit(1)
        .single()
      workspaceId = anyPixel?.workspace_id || null
    }

    const insertedIds: string[] = []

    for (const row of rows) {
      // Validate with permissive schema
      const parsed = AudienceSyncEventSchema.safeParse(row)
      if (!parsed.success) {
        safeLog(`${LOG_PREFIX} Row validation failed, storing raw anyway`)
      }

      const data = parsed.success ? parsed.data : (row as Record<string, any>)

      const { data: inserted, error: insertError } = await supabase
        .from('audiencelab_events')
        .insert({
          source: 'audiencesync',
          event_type: 'audiencesync_row',
          hem_sha256: data.hem_sha256 || null,
          uid: data.uid || null,
          profile_id: data.profile_id || null,
          raw: row,
          raw_headers: rawHeaders,
          processed: false,
          workspace_id: workspaceId,
        })
        .select('id')
        .single()

      if (insertError) {
        safeError(`${LOG_PREFIX} Failed to store row`, insertError)
        continue
      }

      if (inserted) {
        insertedIds.push(inserted.id)
      }
    }

    safeLog(`${LOG_PREFIX} Stored ${insertedIds.length}/${rows.length} rows`)

    // Process events inline (Edge-compatible — bypasses Inngest callback)
    const processed: string[] = []
    for (const id of insertedIds) {
      try {
        const result = await processEventInline(id, workspaceId || '', 'audiencesync')
        if (result.success) processed.push(id)
      } catch (err) {
        safeError(`${LOG_PREFIX} Inline processing failed for ${id}`, err)
      }
    }

    safeLog(`${LOG_PREFIX} Processed ${processed.length}/${insertedIds.length} rows inline`)

    return NextResponse.json({
      success: true,
      stored: insertedIds.length,
      processed: processed.length,
      total: rows.length,
    })
  } catch (error) {
    safeError(`${LOG_PREFIX} Unhandled error`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
