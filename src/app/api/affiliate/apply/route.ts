/**
 * POST /api/affiliate/apply
 * Public application submission endpoint.
 *
 * Heavy dependencies (Supabase admin, Resend emails) are dynamically imported
 * to keep cold-start fast — the OPTIONS preflight must respond instantly.
 */

export const runtime = 'nodejs'
export const maxDuration = 15

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const applySchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional(),
  website: z.string().max(500).optional(),
  audienceSize: z.enum(['under_500', '500_2k', '2k_10k', '10k_50k', '50k_plus']),
  audienceTypes: z.array(z.string()).min(1).max(10),
  promotionPlan: z.string().min(10).max(2000),
})

const ALLOWED_ORIGINS = [
  'https://www.meetcursive.com',
  'https://meetcursive.com',
  'https://leads.meetcursive.com',
]

function cors(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  }
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: cors(request) })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const headers = cors(request)
  try {
    // Lazy-import heavy deps to keep cold start fast
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const { safeError } = await import('@/lib/utils/log-sanitizer')

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    // Lightweight in-function rate limiting with a DB check (with timeout)
    const admin = createAdminClient()
    const windowStart = new Date(Date.now() - 60_000) // 1-minute window
    const rateLimitPromise = admin
      .from('rate_limit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('key', `public-form:${ip}`)
      .gte('created_at', windowStart.toISOString())

    // 3-second timeout on rate limit check — never let it block the form
    const rateResult = await Promise.race([
      rateLimitPromise,
      new Promise<{ count: null; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ count: null, error: { message: 'Rate limit timeout' } }), 3000)
      ),
    ])

    // Fail OPEN for rate limiting — a hung DB shouldn't block real applicants
    if (rateResult.count !== null && !rateResult.error && (rateResult.count ?? 0) >= 5) {
      return NextResponse.json(
        { error: 'Too many applications from this IP. Try again later.' },
        { status: 429, headers }
      )
    }

    const body = await request.json()
    const validation = applySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: validation.error.flatten() },
        { status: 400, headers }
      )
    }

    const data = validation.data

    // Dedup
    const { data: existing } = await admin
      .from('affiliate_applications')
      .select('id, status')
      .eq('email', data.email.toLowerCase())
      .in('status', ['pending', 'approved'])
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true }, { headers })
    }

    const { data: application, error: insertError } = await admin
      .from('affiliate_applications')
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        website: data.website || null,
        audience_size: data.audienceSize,
        audience_types: data.audienceTypes,
        promotion_plan: data.promotionPlan,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError || !application) {
      throw new Error(insertError?.message || 'Failed to save application')
    }

    // Log for rate limiting (fire-and-forget)
    void admin.from('rate_limit_logs').insert({
      key: `public-form:${ip}`,
      limit_type: 'public-form',
      identifier: ip,
    })

    // Send emails in background (don't block response)
    const emailMod = await import('@/lib/email/affiliate-emails')
    emailMod.sendPartnerApplicationReceived(data.email, data.firstName).catch((err: unknown) => safeError('[affiliate/apply] Confirmation email failed:', err))
    emailMod.sendPartnerApplicationNotification(
      application.id,
      `${data.firstName} ${data.lastName}`,
      data.audienceTypes,
      data.audienceSize
    ).catch((err: unknown) => safeError('[affiliate/apply] Admin notification failed:', err))

    return NextResponse.json({ success: true }, { headers })
  } catch (error: unknown) {
    const { safeError } = await import('@/lib/utils/log-sanitizer')
    safeError('[affiliate/apply] Error:', error)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500, headers })
  }
}
