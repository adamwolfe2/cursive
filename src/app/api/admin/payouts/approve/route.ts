/**
 * Admin Payout Approval API
 * Approves a partner payout and executes the Stripe transfer
 */


import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe/client'
import { requireAdmin } from '@/lib/auth/admin'
import { handleApiError } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/utils/rate-limit'
import { z } from 'zod'

const payoutApproveSchema = z.object({
  payout_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()

    // SECURITY: Rate limit payout approvals to prevent abuse
    const rateLimitKey = `payout_approval:${admin.email}`
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.payout_approval)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many payout approvals. Please try again later.',
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

    const stripe = getStripeClient()

    // Parse and validate request body
    const { payout_id } = payoutApproveSchema.parse(await req.json())

    const adminClient = createAdminClient()

    // Get payout details
    const { data: payout, error: payoutError } = await adminClient
      .from('payout_requests')
      .select(`
        *,
        partner:partners(
          id,
          name,
          email,
          stripe_account_id,
          pending_balance,
          total_paid_out
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

    if (!payout.partner?.stripe_account_id) {
      return NextResponse.json(
        { error: 'Partner does not have a Stripe Connect account' },
        { status: 400 }
      )
    }

    // Update payout status to 'processing'
    await adminClient
      .from('payout_requests')
      .update({
        status: 'processing',
        approved_by_user_id: admin.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payout_id)

    try {
      // Create Stripe transfer to partner's connected account
      const transfer = await stripe.transfers.create({
        amount: Math.round(payout.amount * 100), // Convert to cents
        currency: 'usd',
        destination: payout.partner.stripe_account_id,
        description: `Commission payout for ${payout.lead_count} leads`,
        metadata: {
          payout_id: payout.id,
          partner_id: payout.partner.id,
          partner_name: payout.partner.name,
          lead_count: payout.lead_count.toString(),
        },
      })

      // Update payout status to 'completed'
      await adminClient
        .from('payout_requests')
        .update({
          status: 'completed',
          stripe_transfer_id: transfer.id,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payout_id)

      // Update partner balance
      const newPendingBalance = (payout.partner.pending_balance || 0) - payout.amount
      const newTotalPaidOut = (payout.partner.total_paid_out || 0) + payout.amount

      await adminClient
        .from('partners')
        .update({
          pending_balance: Math.max(0, newPendingBalance),
          total_paid_out: newTotalPaidOut,
          last_payout_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payout.partner.id)

      return NextResponse.json({
        success: true,
        payout_id,
        transfer_id: transfer.id,
        message: `Payout of $${payout.amount.toFixed(2)} approved and transferred to ${payout.partner.name}`,
      })
    } catch (stripeError: any) {
      safeError('[Admin Payouts] Stripe transfer failed:', stripeError)

      // Update payout status to 'failed'
      await adminClient
        .from('payout_requests')
        .update({
          status: 'failed',
          error_message: stripeError.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payout_id)

      return NextResponse.json(
        { error: 'Stripe transfer failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    return handleApiError(error)
  }
}
