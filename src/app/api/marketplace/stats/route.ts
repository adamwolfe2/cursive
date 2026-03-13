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

    // Run 4 queries in parallel.
    // Queries 1 and 5 (available leads count + price sample) are merged into one
    // round-trip: fetch up to 100 available leads with their price and an exact
    // count, then derive both availableCount and avgPrice from the same result.
    const [
      { data: availableLeadsData, count: availableCount, error: availableError },
      { data: creditsData, error: creditsError },
      { count: purchaseCount, error: purchaseError },
      { data: recentPurchases, error: recentError },
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
      supabase
        .from('lead_purchases')
        .select('*', { count: 'estimated', head: true })
        .eq('buyer_workspace_id', workspaceId),
      supabase
        .from('lead_purchases')
        .select('purchased_at, price_paid')
        .eq('buyer_workspace_id', workspaceId)
        .gte('purchased_at', thirtyDaysAgo.toISOString())
        .limit(1000),
    ])

    if (availableError) throw availableError
    if (creditsError) throw creditsError
    if (purchaseError) throw purchaseError
    if (recentError) throw recentError

    const credits = creditsData?.balance || 0
    const totalSpent =
      recentPurchases?.reduce((sum, p) => sum + (p.price_paid || 0), 0) || 0
    const avgPrice = availableLeadsData?.length
      ? availableLeadsData.reduce((sum, l) => sum + (l.price || 0), 0) / availableLeadsData.length
      : 0

    return NextResponse.json({
      availableLeads: availableCount || 0,
      credits,
      totalPurchased: purchaseCount || 0,
      totalSpent,
      averagePrice: avgPrice,
      recentPurchases: recentPurchases?.length || 0,
    })
  } catch (error) {
    safeError('Error fetching marketplace stats:', error)
    return handleApiError(error)
  }
}
