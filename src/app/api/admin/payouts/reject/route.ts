/**
 * Admin Payout Rejection API
 * Rejects a partner payout request
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse request body
    const { payout_id, reason } = await req.json()

    if (!payout_id) {
      return NextResponse.json({ error: 'payout_id is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Get payout details
    const { data: payout, error: payoutError } = await adminClient
      .from('partner_payouts')
      .select('id, status, amount, partner_id')
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
      .from('partner_payouts')
      .update({
        status: 'rejected',
        rejected_by_user_id: user.id,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || 'No reason provided',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payout_id)

    return NextResponse.json({
      success: true,
      payout_id,
      message: `Payout of $${payout.amount.toFixed(2)} rejected`,
    })
  } catch (error: any) {
    console.error('[Admin Payouts] Rejection error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
