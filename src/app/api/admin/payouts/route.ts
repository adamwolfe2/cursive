/**
 * Admin Partner Payouts API
 * Manages partner commission payouts via Stripe transfers
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/admin/payouts
 * List all partner payouts (pending, approved, rejected, completed)
 */
export async function GET(req: NextRequest) {
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

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'
    const partnerId = searchParams.get('partner_id')

    const adminClient = createAdminClient()

    // Build query
    let query = adminClient
      .from('partner_payouts')
      .select(`
        *,
        partner:partners(
          id,
          name,
          email,
          stripe_account_id,
          payout_rate
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Filter by partner
    if (partnerId) {
      query = query.eq('partner_id', partnerId)
    }

    const { data: payouts, error } = await query

    if (error) {
      console.error('[Admin Payouts] Query error:', error)
      return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
    }

    // Calculate totals
    const totals = {
      pending_amount: 0,
      approved_amount: 0,
      completed_amount: 0,
      rejected_amount: 0,
    }

    payouts?.forEach(payout => {
      if (payout.status === 'pending') {
        totals.pending_amount += payout.amount
      } else if (payout.status === 'approved') {
        totals.approved_amount += payout.amount
      } else if (payout.status === 'completed') {
        totals.completed_amount += payout.amount
      } else if (payout.status === 'rejected') {
        totals.rejected_amount += payout.amount
      }
    })

    return NextResponse.json({
      success: true,
      payouts,
      totals,
    })
  } catch (error: any) {
    console.error('[Admin Payouts] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
