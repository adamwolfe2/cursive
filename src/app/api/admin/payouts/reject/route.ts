/**
 * Admin Payout Rejection API
 * Rejects a partner payout request
 */


import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { handleApiError } from '@/lib/utils/api-error-handler'
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/utils/rate-limit'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'

const payoutRejectSchema = z.object({
  payout_id: z.string().uuid(),
  reason: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()

    // SECURITY: Rate limit payout rejections to prevent abuse
    const rateLimitKey = `payout_rejection:${admin.email}`
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.payout_rejection)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many payout operations. Please try again later.',
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



    // Parse and validate request body
    const { payout_id, reason } = payoutRejectSchema.parse(await req.json())

    const adminClient = createAdminClient()

    // Get payout details with partner info for balance refund
    const { data: payout, error: payoutError } = await adminClient
      .from('payout_requests')
      .select(`
        id, status, amount, partner_id,
        partner:partners (
          id,
          available_balance
        )
      `)
      .eq('id', payout_id)
      .maybeSingle()

    if (payoutError || !payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    if (payout.status !== 'pending') {
      return NextResponse.json(
        { error: `Payout already ${payout.status}` },
        { status: 400 }
      )
    }

    // Update payout status to 'rejected'
    await adminClient
      .from('payout_requests')
      .update({
        status: 'rejected',
        rejected_by_user_id: admin.id,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || 'No reason provided',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payout_id)

    // Refund the amount back to partner's available balance
    const partner = payout.partner as unknown as { id: string; available_balance: number }
    await adminClient
      .from('partners')
      .update({
        available_balance: Number(partner.available_balance || 0) + Number(payout.amount),
        updated_at: new Date().toISOString(),
      })
      .eq('id', partner.id)

    return NextResponse.json({
      success: true,
      payout_id,
      message: `Payout of $${payout.amount.toFixed(2)} rejected`,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
