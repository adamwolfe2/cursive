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
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { AudienceSyncEventSchema } from '@/lib/audiencelab/schemas'
import { inngest } from '@/inngest/client'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[AL AudienceSync]'
const MAX_BODY_SIZE = 3 * 1024 * 1024 // 3MB

/**
 * Verify webhook secret header
 */
function verifySecret(request: NextRequest, rawBody: string): boolean {
  const secret = process.env.AUDIENCELAB_WEBHOOK_SECRET
  if (!secret) {
    console.error(`${LOG_PREFIX} AUDIENCELAB_WEBHOOK_SECRET not configured`)
    return false
  }

  const headerSecret = request.headers.get('x-audiencelab-secret')
  if (headerSecret) {
    return crypto.timingSafeEqual(
      Buffer.from(headerSecret),
      Buffer.from(secret)
    )
  }

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

    if (!verifySecret(request, rawBody)) {
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

    // Determine workspace (admin fallback via well-known UUID)
    const ADMIN_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000'
    const { data: adminWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', ADMIN_WORKSPACE_ID)
      .single()
    const workspaceId = adminWorkspace?.id || null

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

        await inngest.send({
          name: 'audiencelab/event-received',
          data: {
            event_id: inserted.id,
            workspace_id: workspaceId || '',
            source: 'audiencesync' as const,
          },
        })
      }
    }

    safeLog(`${LOG_PREFIX} Stored ${insertedIds.length}/${rows.length} rows`)

    return NextResponse.json({
      success: true,
      stored: insertedIds.length,
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
