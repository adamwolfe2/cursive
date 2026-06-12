/**
 * Visitor-Estimate Lead Capture API
 * Public endpoint for the /visitor-estimate VSL calculator.
 *
 * Persists the lead, pings Slack, and enrolls the email into the
 * visitor-estimate nurture drip (Inngest). Best-effort on side effects —
 * a Slack/nurture failure never fails the capture for the visitor.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { createAdminClient } from '@/lib/supabase/admin'
import { handleApiError } from '@/lib/utils/api-error-handler'
import { withRateLimit } from '@/lib/middleware/rate-limiter'
import { inngest } from '@/inngest/client'

// CORS — allow the marketing origin to post here too
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const submitSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  // Sanitize at the source: strip HTML/quote/control chars so the value is safe
  // everywhere downstream (email subjects + bodies, Slack, any admin view).
  domain: z
    .string()
    .max(500)
    .optional()
    .transform((d) => (d ? d.replace(/[<>"'`\r\n]/g, '').trim().slice(0, 253) : d)),
  monthly_visitors: z.coerce.number().int().nonnegative().max(100_000_000).optional(),
  deal_size: z.coerce.number().int().nonnegative().max(100_000_000).optional(),
  industry: z.string().max(200).optional(),
  revenue_leak_annual: z.coerce.number().int().min(0).max(1_000_000_000_000).optional(),
  cursive_advantage_annual: z.coerce.number().int().min(0).max(1_000_000_000_000).optional(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
})

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, 'public-form')
    if (rateLimited) {
      Object.entries(corsHeaders).forEach(([k, v]) => rateLimited.headers.set(k, v))
      return rateLimited
    }

    const input = submitSchema.parse(await request.json())
    const email = input.email.toLowerCase().trim()

    const admin = createAdminClient()

    // Upsert by email — idempotent if a visitor re-submits.
    const { data: lead, error: upsertError } = await admin
      .from('visitor_estimate_leads')
      .upsert(
        {
          email,
          domain: input.domain ?? null,
          monthly_visitors: input.monthly_visitors ?? null,
          deal_size: input.deal_size ?? null,
          industry: input.industry ?? null,
          revenue_leak_annual: input.revenue_leak_annual ?? null,
          cursive_advantage_annual: input.cursive_advantage_annual ?? null,
          utm_source: input.utm_source ?? null,
          utm_medium: input.utm_medium ?? null,
          utm_campaign: input.utm_campaign ?? null,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          user_agent: request.headers.get('user-agent'),
          referrer: request.headers.get('referer'),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select('id, unsubscribed_at')
      .maybeSingle()

    if (upsertError) throw upsertError

    // Slack ping (best-effort)
    sendSlackAlert({
      type: 'visitor_estimate_lead',
      severity: 'info',
      message: `New visitor-estimate lead: ${email}${input.domain ? ` (${input.domain})` : ''}`,
      metadata: {
        email,
        domain: input.domain || 'n/a',
        monthly_visitors: input.monthly_visitors ?? 0,
        revenue_leak_annual: input.revenue_leak_annual ?? 0,
        utm_source: input.utm_source || 'direct',
      },
    }).catch((err) => safeError('[VisitorEstimate] Slack notify failed:', err))

    // Enroll in nurture drip — skip if they previously unsubscribed.
    if (!lead?.unsubscribed_at) {
      inngest
        .send({
          name: 'visitor-estimate/captured',
          data: {
            leadId: lead?.id,
            email,
            domain: input.domain,
            monthlyVisitors: input.monthly_visitors,
            dealSize: input.deal_size,
            industry: input.industry,
            revenueLeak: input.revenue_leak_annual,
            cursiveAdvantage: input.cursive_advantage_annual,
          },
        })
        .catch((err) => safeError('[VisitorEstimate] Inngest enroll failed:', err))
    }

    safeLog('[VisitorEstimate] Lead captured:', { email, id: lead?.id })

    const response = NextResponse.json(
      { success: true, message: 'Your report is on the way — check your inbox.' },
      { status: 201 }
    )
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v))
    return response
  } catch (error) {
    safeError('[VisitorEstimate] Capture error:', error)
    const errorResponse = handleApiError(error)
    Object.entries(corsHeaders).forEach(([k, v]) => errorResponse.headers.set(k, v))
    return errorResponse
  }
}
