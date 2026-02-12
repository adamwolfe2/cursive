/**
 * Admin Partner Payouts API
 * Manages partner commission payouts via Stripe transfers
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'

/**
 * GET /api/admin/payouts
 * List all partner payouts (pending, approved, rejected, completed)
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'
    const partnerId = searchParams.get('partner_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const adminClient = createAdminClient()

    // Build query with pagination
    // PERFORMANCE: Prevents loading 10,000+ payouts into memory
    let query = adminClient
      .from('payout_requests')
      .select(`
        *,
        partner:partners(
          id,
          name,
          email,
          stripe_account_id,
          payout_rate
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Filter by partner
    if (partnerId) {
      query = query.eq('partner_id', partnerId)
    }

    const { data: payouts, error, count } = await query

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
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error: any) {
    console.error('[Admin Payouts] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
