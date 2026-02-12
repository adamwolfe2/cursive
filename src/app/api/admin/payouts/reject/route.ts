/**
 * Admin Payout Rejection API
 * Rejects a partner payout request
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const supabase = await createClient()

    // Get current user for audit trail
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const { payout_id, reason } = await req.json()

    if (!payout_id) {
      return NextResponse.json({ error: 'payout_id is required' }, { status: 400 })
    }

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

    // Update payout status to 'rejected'
    await adminClient
      .from('payout_requests')
      .update({
        status: 'rejected',
        rejected_by_user_id: user.id,
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
  } catch (error: any) {
    console.error('[Admin Payouts] Rejection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
