// Admin API: Manually Trigger Lead Generation
// Used for testing and manual runs


import { NextRequest, NextResponse } from 'next/server'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { inngest } from '@/inngest/client'
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/utils/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify platform admin access
    const { requireAdmin } = await import('@/lib/auth/admin')
    const admin = await requireAdmin()

    // SECURITY: Rate limit trigger operations to prevent excessive external API calls
    const rateLimitKey = `admin_trigger_lead_generation:${admin.email}`
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.admin_trigger_lead_generation)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many lead generation trigger requests. Please try again later.',
          retryAfter: rateLimit.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter),
            'X-RateLimit-Remaining': '0',
          }
        }
      )
    }

    const body = await request.json()
    const { query_id, workspace_id } = body

    if (query_id) {
      if (!workspace_id) {
        return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
      }

      await inngest.send({
        name: 'lead/generate' as const,
        data: { query_id, workspace_id },
      })
      safeLog(`[Admin Trigger Lead Generation] Generation queued for query ${query_id}`)

      return NextResponse.json({
        success: true,
        message: `Lead generation queued for query ${query_id}`,
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'Lead generation will run on next cron schedule (2 AM daily)',
        note: 'Use Inngest dashboard to manually invoke the daily-lead-generation function',
      })
    }
  } catch (error: any) {
    safeError('[Admin Trigger Lead Generation] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
