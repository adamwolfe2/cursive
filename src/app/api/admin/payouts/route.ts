import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

export async function GET(request: NextRequest) {
  try {
    // Check admin access (throws if not admin)
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('payout_requests')
      .select(`
        *,
        partner:partners (
          name,
          email,
          company_name,
          stripe_account_id
        )
      `)
      .order('requested_at', { ascending: false })

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: payouts, error } = await query.limit(100)

    if (error) {
      console.error('Failed to fetch payouts:', error)
      return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
    }

    // Get stats
    const { data: pendingStats } = await supabase
      .from('payout_requests')
      .select('amount')
      .eq('status', 'pending')

    const { data: approvedStats } = await supabase
      .from('payout_requests')
      .select('amount')
      .eq('status', 'approved')

    const { data: processingStats } = await supabase
      .from('payout_requests')
      .select('amount')
      .eq('status', 'processing')

    // Get this month's completed payouts
    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)
    thisMonthStart.setHours(0, 0, 0, 0)

    const { data: thisMonthPayouts } = await supabase
      .from('payout_requests')
      .select('amount')
      .eq('status', 'completed')
      .gte('completed_at', thisMonthStart.toISOString())

    const stats = {
      pending_count: pendingStats?.length || 0,
      pending_amount: pendingStats?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
      approved_count: approvedStats?.length || 0,
      approved_amount: approvedStats?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
      processing_count: processingStats?.length || 0,
      processing_amount: processingStats?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
      total_paid_this_month: thisMonthPayouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    }

    return NextResponse.json({
      success: true,
      payouts: payouts || [],
      stats,
    })
  } catch (error: any) {
    console.error('Admin payouts error:', error)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}
