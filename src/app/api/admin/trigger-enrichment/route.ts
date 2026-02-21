// Admin API: Manually Trigger Lead Enrichment
// Used for testing and manual enrichment


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { inngest } from '@/inngest/client'
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/utils/rate-limit'

const bodySchema = z.object({
  lead_id: z.string().uuid('lead_id must be a valid UUID'),
  workspace_id: z.string().uuid('workspace_id must be a valid UUID'),
})

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify platform admin access
    const { requireAdmin } = await import('@/lib/auth/admin')
    const admin = await requireAdmin()

    // SECURITY: Rate limit enrichment triggers to prevent excessive external API calls
    const rateLimitKey = `admin_trigger_enrichment:${admin.email}`
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.admin_trigger_enrichment)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many enrichment trigger requests. Please try again later.',
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
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const { lead_id, workspace_id } = parsed.data

    await inngest.send({
      name: 'lead/enrich' as const,
      data: { lead_id, workspace_id },
    })
    safeLog(`[Admin Trigger Enrichment] Enrichment queued for lead ${lead_id}`)

    return NextResponse.json({
      success: true,
      message: `Enrichment queued for lead ${lead_id}`,
    })
  } catch (error: any) {
    safeError('[Admin Trigger Enrichment] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
