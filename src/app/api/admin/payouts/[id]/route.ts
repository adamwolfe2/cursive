import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, getCurrentAdminId } from '@/lib/auth/admin'
import Stripe from 'stripe'

function getStripeClient(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access (throws if not admin)
    await requireAdmin()

    const { id: payoutId } = await params
    const { action, admin_notes, rejection_reason } = await request.json()

    if (!action || !['approve', 'reject', 'process'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const supabase = await createClient()
    const adminId = await getCurrentAdminId()

    // Get payout request
    const { data: payout, error: fetchError } = await supabase
      .from('payout_requests')
      .select(`
        *,
        partner:partners (
          id,
          name,
          email,
          stripe_account_id,
          available_balance
        )
      `)
      .eq('id', payoutId)
      .single()

    if (fetchError || !payout) {
      return NextResponse.json({ error: 'Payout request not found' }, { status: 404 })
    }

    const now = new Date().toISOString()

    // Handle different actions
    switch (action) {
      case 'approve': {
        if (payout.status !== 'pending') {
          return NextResponse.json(
            { error: 'Only pending requests can be approved' },
            { status: 400 }
          )
        }

        await supabase
          .from('payout_requests')
          .update({
            status: 'approved',
            admin_notes,
            reviewed_at: now,
            reviewed_by: adminId,
            updated_at: now,
          })
          .eq('id', payoutId)

        break
      }

      case 'reject': {
        if (payout.status !== 'pending') {
          return NextResponse.json(
            { error: 'Only pending requests can be rejected' },
            { status: 400 }
          )
        }

        if (!rejection_reason) {
          return NextResponse.json(
            { error: 'Rejection reason is required' },
            { status: 400 }
          )
        }

        // Update payout request
        await supabase
          .from('payout_requests')
          .update({
            status: 'rejected',
            admin_notes,
            rejection_reason,
            reviewed_at: now,
            reviewed_by: adminId,
            updated_at: now,
          })
          .eq('id', payoutId)

        // Refund the amount back to partner's available balance
        const partner = payout.partner as any
        await supabase
          .from('partners')
          .update({
            available_balance: Number(partner.available_balance || 0) + Number(payout.amount),
            updated_at: now,
          })
          .eq('id', partner.id)

        break
      }

      case 'process': {
        if (payout.status !== 'approved') {
          return NextResponse.json(
            { error: 'Only approved requests can be processed' },
            { status: 400 }
          )
        }

        const partner = payout.partner as any

        if (!partner.stripe_account_id) {
          return NextResponse.json(
            { error: 'Partner does not have a connected Stripe account' },
            { status: 400 }
          )
        }

        // Update status to processing
        await supabase
          .from('payout_requests')
          .update({
            status: 'processing',
            admin_notes,
            updated_at: now,
          })
          .eq('id', payoutId)

        try {
          // Create Stripe transfer
          const stripe = getStripeClient()
          const transfer = await stripe.transfers.create({
            amount: Math.round(Number(payout.amount) * 100), // Convert to cents
            currency: 'usd',
            destination: partner.stripe_account_id,
            metadata: {
              payout_request_id: payoutId,
              partner_id: partner.id,
            },
          })

          // Update payout request with Stripe transfer ID
          await supabase
            .from('payout_requests')
            .update({
              status: 'completed',
              stripe_payout_id: transfer.id,
              completed_at: now,
              updated_at: now,
            })
            .eq('id', payoutId)

          // Update partner earnings to paid_out status
          await supabase
            .from('partner_earnings')
            .update({ status: 'paid_out' })
            .eq('partner_id', partner.id)
            .eq('status', 'available')

        } catch (stripeError: any) {
          console.error('Stripe transfer failed:', stripeError)

          // Revert to approved status
          await supabase
            .from('payout_requests')
            .update({
              status: 'approved',
              admin_notes: `${admin_notes || ''}\nStripe transfer failed: ${stripeError.message}`,
              updated_at: now,
            })
            .eq('id', payoutId)

          return NextResponse.json(
            { error: `Stripe transfer failed: ${stripeError.message}` },
            { status: 500 }
          )
        }

        break
      }
    }

    return NextResponse.json({
      success: true,
      message: `Payout request ${action}${action === 'process' ? 'ed' : 'd'} successfully`,
    })
  } catch (error: any) {
    console.error('Payout action error:', error)
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 })
  }
}
