// Credit Breakdown API
// GET: returns credit usage breakdown by category, daily totals (last 30 days), and top 5 expenditures
// Auth: createClient() + getUser()

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

interface CategoryBreakdown {
  category: string
  credits: number
  count: number
}

interface DailyBreakdown {
  date: string
  credits: number
}

interface TopPurchase {
  id: string
  description: string
  credits: number
  created_at: string
}

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const workspaceId = userData.workspace_id
    const adminClient = createAdminClient()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

    // Fetch marketplace purchases (credits spent on leads) in last 30 days
    const { data: purchases } = await adminClient
      .from('marketplace_purchases')
      .select('id, total_price, credits_used, total_leads, created_at, status')
      .eq('buyer_workspace_id', workspaceId)
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgoISO)
      .order('credits_used', { ascending: false })

    // Fetch all-time purchases for top purchases list
    const { data: allPurchases } = await adminClient
      .from('marketplace_purchases')
      .select('id, total_price, credits_used, total_leads, created_at')
      .eq('buyer_workspace_id', workspaceId)
      .eq('status', 'completed')
      .order('credits_used', { ascending: false })
      .limit(5)

    // Build by_category from marketplace purchases
    // Categories: 'marketplace' (lead purchases), 'enrichment' (from enrichment_log), 'segment' (from segments)
    const categoryMap: Record<string, { credits: number; count: number }> = {}

    const marketplaceCredits = (purchases ?? []).reduce((sum, p) => sum + (p.credits_used || p.total_price || 0), 0)
    const marketplaceCount = (purchases ?? []).length

    if (marketplaceCount > 0) {
      categoryMap['Marketplace Purchases'] = { credits: marketplaceCredits, count: marketplaceCount }
    }

    // Fetch enrichment log (last 30 days) for this workspace
    const { data: enrichmentLogs } = await adminClient
      .from('enrichment_log')
      .select('id, credits_used, created_at')
      .eq('workspace_id', workspaceId)
      .gte('created_at', thirtyDaysAgoISO)

    if (enrichmentLogs && enrichmentLogs.length > 0) {
      const enrichmentCredits = enrichmentLogs.reduce((sum, e) => sum + (e.credits_used || 1), 0)
      categoryMap['Enrichment'] = { credits: enrichmentCredits, count: enrichmentLogs.length }
    }

    const by_category: CategoryBreakdown[] = Object.entries(categoryMap)
      .map(([category, { credits, count }]) => ({ category, credits, count }))
      .sort((a, b) => b.credits - a.credits)

    // Build daily breakdown for last 30 days
    const dailyMap: Record<string, number> = {}

    // Initialize all 30 days
    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      dailyMap[key] = 0
    }

    // Add marketplace purchases
    for (const p of purchases ?? []) {
      const day = p.created_at.split('T')[0]
      if (day in dailyMap) {
        dailyMap[day] += p.credits_used || p.total_price || 0
      }
    }

    // Add enrichment credits
    for (const e of enrichmentLogs ?? []) {
      const day = (e.created_at as string).split('T')[0]
      if (day in dailyMap) {
        dailyMap[day] += e.credits_used || 1
      }
    }

    const daily: DailyBreakdown[] = Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, credits]) => ({ date, credits }))

    // Top 5 purchases (all time)
    const top_purchases: TopPurchase[] = (allPurchases ?? []).slice(0, 5).map((p) => ({
      id: p.id,
      description: `${p.total_leads} lead${p.total_leads !== 1 ? 's' : ''} purchased`,
      credits: p.credits_used || p.total_price || 0,
      created_at: p.created_at,
    }))

    return NextResponse.json({ by_category, daily, top_purchases })
  } catch (error) {
    safeError('[CreditBreakdown] GET failed:', error)
    return NextResponse.json({ error: 'Failed to fetch credit breakdown' }, { status: 500 })
  }
}
