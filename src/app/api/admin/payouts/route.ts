/**
 * Admin Partner Payouts API
 * Manages partner commission payouts via Stripe transfers
 */
export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { safeError } from '@/lib/utils/log-sanitizer'
import { safeParsePagination } from '@/lib/utils/parse-number'

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
    const { page, limit, offset } = safeParsePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      { defaultLimit: 50, maxLimit: 100 }
    )

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
      safeError('[Admin Payouts] Query error:', error)
      return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
    }

    // Calculate totals using optimized SQL aggregation
    // PERFORMANCE: Replaced in-app iteration with SQL FILTER aggregates
    // This gives totals across ALL payouts (not just current page)
    // 10-100x faster than iterating in JavaScript
    const { data: totalsData, error: totalsError } = await adminClient
      .rpc('get_payout_totals', {
        p_status_filter: status === 'all' ? null : status,
        p_partner_id: partnerId || null,
        p_workspace_id: null,
      })

    if (totalsError) {
      safeError('[Admin Payouts] Totals query error:', totalsError)
      // Continue with zero totals rather than failing the whole request
    }

    const totals = totalsData || {
      pending_amount: 0,
      approved_amount: 0,
      completed_amount: 0,
      rejected_amount: 0,
      total_amount: 0,
    }

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
  } catch (error: unknown) {
    safeError('[Admin Payouts] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
