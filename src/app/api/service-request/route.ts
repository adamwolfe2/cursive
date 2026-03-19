/**
 * General-Purpose Service Request Endpoint
 *
 * POST /api/service-request
 * Accepts a service request from authenticated users, stores it in
 * support_messages, and sends a Slack notification.
 *
 * Edge runtime (Node.js routes hang on this Vercel deployment).
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { withRateLimit } from '@/lib/middleware/rate-limiter'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

const serviceRequestSchema = z.object({
  request_type: z.string().min(1).max(100),
  details: z.string().min(1).max(2000),
  metadata: z.record(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, 'default')
    if (rateLimited) return rateLimited

    // 1. Auth
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    // 2. Validate request body
    const body = await request.json()
    const validated = serviceRequestSchema.parse(body)

    // 3. Build message body (details + metadata if present)
    const messageParts = [validated.details]
    if (validated.metadata && Object.keys(validated.metadata).length > 0) {
      messageParts.push('')
      messageParts.push('Metadata:')
      messageParts.push(JSON.stringify(validated.metadata, null, 2))
    }

    // 4. Insert into support_messages
    const adminClient = createAdminClient()
    const { error: insertError } = await adminClient
      .from('support_messages')
      .insert({
        name: user.full_name || user.email,
        email: user.email,
        subject: `Service Request: ${validated.request_type}`,
        message: messageParts.join('\n'),
        priority: 'normal',
        status: 'unread',
        source: 'service_request',
      })

    if (insertError) {
      safeError('[API] Service request insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit request. Please try again.' },
        { status: 500 }
      )
    }

    // 5. Send Slack notification (fire-and-forget, don't block response)
    const detailsSnippet = validated.details.length > 100
      ? validated.details.slice(0, 100) + '...'
      : validated.details

    await sendSlackAlert({
      type: 'new_dfy_client',
      severity: 'info',
      message: `New service request: ${validated.request_type}`,
      metadata: {
        user: user.full_name || 'Unknown',
        email: user.email,
        workspace: user.workspace_id,
        request_type: validated.request_type,
        details: detailsSnippet,
      },
    })

    // 6. Return success
    return NextResponse.json({
      success: true,
      message: "Request submitted! We'll be in touch within 24 hours.",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
