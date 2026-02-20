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
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { withRateLimit } from '@/lib/middleware/rate-limiter'
import { safeError } from '@/lib/utils/log-sanitizer'


const serviceRequestSchema = z.object({
  request_type: z.string().min(1).max(100),
  details: z.string().min(1).max(2000),
  metadata: z.record(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, 'default')
    if (rateLimited) return rateLimited

    // 1. Auth — Edge-compatible cookie read
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => {
            const cookieHeader = request.headers.get('cookie') || ''
            return cookieHeader.split(';').map(c => {
              const [name, ...rest] = c.trim().split('=')
              return { name, value: rest.join('=') }
            }).filter(c => c.name)
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Lookup workspace from users table
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('id, full_name, email, workspace_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Validate request body
    const body = await request.json()
    const validated = serviceRequestSchema.parse(body)

    // 4. Build message body (details + metadata if present)
    const messageParts = [validated.details]
    if (validated.metadata && Object.keys(validated.metadata).length > 0) {
      messageParts.push('')
      messageParts.push('Metadata:')
      messageParts.push(JSON.stringify(validated.metadata, null, 2))
    }

    // 5. Insert into support_messages
    const { error: insertError } = await adminClient
      .from('support_messages')
      .insert({
        name: userData.full_name || userData.email,
        email: userData.email,
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

    // 6. Send Slack notification (fire-and-forget, don't block response)
    const detailsSnippet = validated.details.length > 100
      ? validated.details.slice(0, 100) + '...'
      : validated.details

    await sendSlackAlert({
      type: 'new_dfy_client',
      severity: 'info',
      message: `New service request: ${validated.request_type}`,
      metadata: {
        user: userData.full_name || 'Unknown',
        email: userData.email,
        workspace: userData.workspace_id,
        request_type: validated.request_type,
        details: detailsSnippet,
      },
    })

    // 7. Return success
    return NextResponse.json({
      success: true,
      message: "Request submitted! We'll be in touch within 24 hours.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    safeError('[API] Service request error:', error)
    return NextResponse.json(
      { error: 'Failed to submit request. Please try again.' },
      { status: 500 }
    )
  }
}
