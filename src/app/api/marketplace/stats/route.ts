// API endpoint for marketplace statistics
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User workspace not found' },
        { status: 404 }
      )
    }

    const workspaceId = userData.workspace_id

    // Get available leads count (leads not purchased by this workspace)
    const { count: availableCount, error: availableError } = await supabase
      .from('leads')
      .select('*', { count: 'estimated', head: true })
      .neq('workspace_id', workspaceId)
      .eq('status', 'available')

    if (availableError) {
      throw availableError
    }

    // Get credits balance
    const { data: creditsData, error: creditsError } = await supabase
      .from('workspace_credits')
      .select('balance')
      .eq('workspace_id', workspaceId)
      .single()

    const credits = creditsData?.balance || 0

    // Get purchase history count
    const { count: purchaseCount, error: purchaseError } = await supabase
      .from('lead_purchases')
      .select('*', { count: 'estimated', head: true })
      .eq('buyer_workspace_id', workspaceId)

    if (purchaseError) {
      throw purchaseError
    }

    // Get recent purchases for trend
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentPurchases, error: recentError } = await supabase
      .from('lead_purchases')
      .select('purchased_at, price_paid')
      .eq('buyer_workspace_id', workspaceId)
      .gte('purchased_at', thirtyDaysAgo.toISOString())

    if (recentError) {
      throw recentError
    }

    // Calculate total spent
    const totalSpent = recentPurchases?.reduce(
      (sum, p) => sum + (p.price_paid || 0),
      0
    ) || 0

    // Get average lead price
    const { data: avgPriceData, error: avgError } = await supabase
      .from('leads')
      .select('price')
      .neq('workspace_id', workspaceId)
      .eq('status', 'available')

    if (avgError) {
      throw avgError
    }

    const avgPrice = avgPriceData?.length
      ? avgPriceData.reduce((sum, l) => sum + (l.price || 0), 0) /
        avgPriceData.length
      : 0

    return NextResponse.json({
      availableLeads: availableCount || 0,
      credits: credits,
      totalPurchased: purchaseCount || 0,
      totalSpent: totalSpent,
      averagePrice: avgPrice,
      recentPurchases: recentPurchases?.length || 0,
    })
  } catch (error) {
    console.error('Error fetching marketplace stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch marketplace statistics' },
      { status: 500 }
    )
  }
}
