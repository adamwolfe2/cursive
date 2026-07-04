// API endpoint for marketplace statistics

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fastAuth } from '@/lib/auth/fast-auth'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(request: NextRequest) {
  try {
    const user = await fastAuth(request)
    if (!user) return unauthorized()

    const workspaceId = user.workspaceId
    const supabase = await createClient()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const cutoff = thirtyDaysAgo.getTime()

    // Available-leads count (exact) + a price sample for the "average price" tile.
    const [
      { data: availableLeadsData, count: availableCount, error: availableError },
      { data: creditsData, error: creditsError },
    ] = await Promise.all([
      supabase
        .from('leads')
        .select('price', { count: 'exact' })
        .neq('workspace_id', workspaceId)
        .eq('status', 'available')
        .limit(100),
      supabase
        .from('workspace_credits')
        .select('balance')
        .eq('workspace_id', workspaceId)
        .maybeSingle(),
    ])

    if (availableError) throw availableError
    if (creditsError) throw creditsError

    // Buyer purchase totals must union BOTH purchase flows:
    //   • marketplace_purchases — bulk filter-based buys (the active flow; was
    //     entirely excluded before, so bulk buyers saw 0 purchased / $0 spent)
    //   • lead_purchases        — single-lead Stripe buys (1 row = 1 lead)
    // Previously totalPurchased used PostgREST count:'estimated' (a stale planner
    // estimate, not the real count). We now count exactly from the actual rows.
    // Each table query is independently non-fatal so an issue in one never zeroes
    // the whole dashboard.
    const [mpRes, lpRes] = await Promise.allSettled([
      supabase
        .from('marketplace_purchases')
        .select('total_leads, total_price, created_at')
        .eq('buyer_workspace_id', workspaceId)
        .eq('status', 'completed')
        .limit(100000),
      supabase
        .from('lead_purchases')
        .select('purchase_price, purchased_at')
        .eq('buyer_workspace_id', workspaceId)
        .limit(100000),
    ])

    const mpRows =
      mpRes.status === 'fulfilled' && !mpRes.value.error ? mpRes.value.data ?? [] : []
    if (mpRes.status === 'fulfilled' && mpRes.value.error) {
      safeError('marketplace_purchases stats query failed:', mpRes.value.error)
    } else if (mpRes.status === 'rejected') {
      safeError('marketplace_purchases stats query rejected:', mpRes.reason)
    }

    const lpRows =
      lpRes.status === 'fulfilled' && !lpRes.value.error ? lpRes.value.data ?? [] : []
    if (lpRes.status === 'fulfilled' && lpRes.value.error) {
      safeError('lead_purchases stats query failed:', lpRes.value.error)
    } else if (lpRes.status === 'rejected') {
      safeError('lead_purchases stats query rejected:', lpRes.reason)
    }

    const mpLeads = mpRows.reduce((sum, p) => sum + (Number(p.total_leads) || 0), 0)
    const mpSpent = mpRows.reduce((sum, p) => sum + (Number(p.total_price) || 0), 0)
    const mpRecent = mpRows.filter(
      (p) => p.created_at && new Date(p.created_at).getTime() >= cutoff
    ).length

    const lpCount = lpRows.length
    const lpSpent = lpRows.reduce((sum, p) => sum + (Number(p.purchase_price) || 0), 0)
    const lpRecent = lpRows.filter(
      (p) => p.purchased_at && new Date(p.purchased_at).getTime() >= cutoff
    ).length

    const credits = creditsData?.balance || 0
    const totalPurchased = mpLeads + lpCount
    const totalSpent = mpSpent + lpSpent
    const recentPurchases = mpRecent + lpRecent

    // Sample of currently-listed available leads (up to 100) — reflects current
    // marketplace listing prices, not the buyer's historical purchase average.
    const avgPrice = availableLeadsData?.length
      ? availableLeadsData.reduce((sum, l) => sum + (l.price || 0), 0) / availableLeadsData.length
      : 0

    return NextResponse.json({
      availableLeads: availableCount || 0,
      credits,
      totalPurchased,
      totalSpent,
      averagePrice: avgPrice,
      recentPurchases,
    })
  } catch (error) {
    safeError('Error fetching marketplace stats:', error)
    return handleApiError(error)
  }
}
