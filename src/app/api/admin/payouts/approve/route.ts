/**
 * Admin Payout Approval API
 * Approves a partner payout and executes the Stripe transfer
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe/client'

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripeClient()
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin, full_name')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse request body
    const { payout_id } = await req.json()

    if (!payout_id) {
      return NextResponse.json({ error: 'payout_id is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Get payout details
    const { data: payout, error: payoutError } = await adminClient
      .from('partner_payouts')
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
      .single()

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
      .from('partner_payouts')
      .update({
        status: 'processing',
        approved_by_user_id: user.id,
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
        .from('partner_payouts')
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
      console.error('[Admin Payouts] Stripe transfer failed:', stripeError)

      // Update payout status to 'failed'
      await adminClient
        .from('partner_payouts')
        .update({
          status: 'failed',
          error_message: stripeError.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payout_id)

      return NextResponse.json(
        { error: `Stripe transfer failed: ${stripeError.message}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[Admin Payouts] Approval error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
