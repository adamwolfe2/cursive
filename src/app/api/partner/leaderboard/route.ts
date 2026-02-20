/**
 * Partner Leaderboard API
 * GET /api/partner/leaderboard
 *
 * Returns top 10 partners ranked by the chosen category and period,
 * plus the current user's own entry (even if outside the top 10).
 * Other partners' names are obscured for privacy (first name + last initial).
 *
 * Query params:
 *   period   — 'week' | 'month' | 'quarter' | 'alltime'  (default: 'month')
 *   category — 'revenue' | 'leads' | 'conversion'        (default: 'revenue')
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPartnerTier } from '@/lib/services/partner-tier.service'
import { safeError } from '@/lib/utils/log-sanitizer'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LeaderboardPeriod = 'week' | 'month' | 'quarter' | 'alltime'
export type LeaderboardCategory = 'revenue' | 'leads' | 'conversion'

export interface LeaderboardEntry {
  rank: number
  partner_name: string
  tier: 'Bronze' | 'Silver' | 'Gold'
  leads_sold_this_month: number
  earnings_this_month: number
  conversion_rate: number
  is_current_user: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Obscure a partner name to "First L." format for privacy.
 */
function obscureName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return 'Partner'

  const parts = trimmed.split(/\s+/)
  const firstName = parts[0]
  const lastName = parts.length > 1 ? parts[parts.length - 1] : null

  if (lastName) {
    return `${firstName} ${lastName.charAt(0)}.`
  }
  // Single word name: show first 3 chars + "."
  if (firstName.length > 3) {
    return `${firstName.slice(0, 3)}...`
  }
  return firstName
}

/**
 * Compute the ISO start date for the given period.
 * Returns null for 'alltime' (no date filter).
 */
function getPeriodStart(period: LeaderboardPeriod): string | null {
  const now = new Date()
  switch (period) {
    case 'week': {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay()) // Sunday
      weekStart.setHours(0, 0, 0, 0)
      return weekStart.toISOString()
    }
    case 'month': {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    }
    case 'quarter': {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3
      return new Date(now.getFullYear(), quarterMonth, 1).toISOString()
    }
    case 'alltime':
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    // 1. Parse query params
    const { searchParams } = new URL(req.url)
    const rawPeriod = searchParams.get('period') ?? 'month'
    const rawCategory = searchParams.get('category') ?? 'revenue'

    const period: LeaderboardPeriod = (['week', 'month', 'quarter', 'alltime'] as const).includes(
      rawPeriod as LeaderboardPeriod
    )
      ? (rawPeriod as LeaderboardPeriod)
      : 'month'

    const category: LeaderboardCategory = (
      ['revenue', 'leads', 'conversion'] as const
    ).includes(rawCategory as LeaderboardCategory)
      ? (rawCategory as LeaderboardCategory)
      : 'revenue'

    // 2. Auth: verify the caller is a logged-in partner
    const supabase = await createClient()
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, role, partner_approved, linked_partner_id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle()

    if (!user || user.role !== 'partner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const currentPartnerId = user.linked_partner_id

    // 3. Compute date range for period
    const periodStart = getPeriodStart(period)
    const now = new Date()

    // 4. Use admin client to query across all partners
    const adminClient = createAdminClient()

    // Build purchases query with optional date filter
    let purchasesQuery = adminClient
      .from('lead_purchases')
      .select('partner_id, partner_commission')
      .not('partner_id', 'is', null)

    if (periodStart) {
      purchasesQuery = purchasesQuery.gte('purchased_at', periodStart)
    }

    const { data: purchaseRows, error: purchaseError } = await purchasesQuery

    if (purchaseError) {
      safeError('[Leaderboard] Failed to query lead_purchases:', purchaseError)
      return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })
    }

    // Aggregate by partner_id
    const partnerMap: Record<string, { leads_sold: number; earnings: number }> = {}
    for (const row of purchaseRows ?? []) {
      if (!row.partner_id) continue
      if (!partnerMap[row.partner_id]) {
        partnerMap[row.partner_id] = { leads_sold: 0, earnings: 0 }
      }
      partnerMap[row.partner_id].leads_sold += 1
      partnerMap[row.partner_id].earnings += row.partner_commission ?? 0
    }

    // 5. Ensure current partner is included even with 0 activity
    if (currentPartnerId && !partnerMap[currentPartnerId]) {
      partnerMap[currentPartnerId] = { leads_sold: 0, earnings: 0 }
    }

    // Collect all partner IDs we need to look up
    const allPartnerIds = Object.keys(partnerMap)

    if (allPartnerIds.length === 0) {
      // No activity; return empty top 10 with current user at rank 1
      const noActivityEntry: LeaderboardEntry[] = []

      if (currentPartnerId) {
        const { data: selfPartner } = await adminClient
          .from('partners')
          .select('id, name, total_leads_uploaded')
          .eq('id', currentPartnerId)
          .maybeSingle()

        if (selfPartner) {
          const tier = getPartnerTier(selfPartner.total_leads_uploaded ?? 0)
          noActivityEntry.push({
            rank: 1,
            partner_name: selfPartner.name,
            tier: tier.name,
            leads_sold_this_month: 0,
            earnings_this_month: 0,
            conversion_rate: 0,
            is_current_user: true,
          })
        }
      }

      return NextResponse.json({
        leaderboard: noActivityEntry,
        month: now.toISOString(),
        period,
        category,
      })
    }

    // 6. Fetch partner profiles (name + total_leads_uploaded for tier + total_leads_uploaded for conversion)
    const [partnersResult, uploadsResult] = await Promise.all([
      adminClient.from('partners').select('id, name, total_leads_uploaded').in('id', allPartnerIds),
      // For conversion category: get total uploaded leads per partner in the period
      category === 'conversion'
        ? (async () => {
            let q = adminClient
              .from('partner_uploads')
              .select('partner_id, leads_count')
              .in('partner_id', allPartnerIds)
            if (periodStart) {
              q = q.gte('created_at', periodStart)
            }
            return q
          })()
        : Promise.resolve({ data: null, error: null }),
    ])

    if (partnersResult.error) {
      safeError('[Leaderboard] Failed to query partners:', partnersResult.error)
      return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })
    }

    // Build partner profiles lookup
    const partnerProfiles: Record<string, { name: string; total_leads_uploaded: number }> = {}
    for (const p of partnersResult.data ?? []) {
      partnerProfiles[p.id] = {
        name: p.name,
        total_leads_uploaded: p.total_leads_uploaded ?? 0,
      }
    }

    // Build uploaded leads map for conversion calculation
    const uploadedLeadsMap: Record<string, number> = {}
    if (category === 'conversion' && uploadsResult.data) {
      for (const row of uploadsResult.data as Array<{ partner_id: string; leads_count: number }>) {
        if (!row.partner_id) continue
        uploadedLeadsMap[row.partner_id] = (uploadedLeadsMap[row.partner_id] ?? 0) + (row.leads_count ?? 0)
      }
    }

    // 7. Compose sorted list
    const ranked = allPartnerIds.map((pid) => {
      const stats = partnerMap[pid]
      const profile = partnerProfiles[pid]
      const tierObj = getPartnerTier(profile?.total_leads_uploaded ?? 0)
      const uploadedLeads = uploadedLeadsMap[pid] ?? 0
      const conversionRate =
        uploadedLeads > 0
          ? Math.round((stats.leads_sold / uploadedLeads) * 10000) / 100
          : 0

      return {
        partner_id: pid,
        partner_name: profile?.name ?? 'Partner',
        tier: tierObj.name as 'Bronze' | 'Silver' | 'Gold',
        leads_sold_this_month: stats.leads_sold,
        earnings_this_month: Math.round(stats.earnings * 100) / 100,
        conversion_rate: conversionRate,
        is_current_user: pid === currentPartnerId,
      }
    })

    // Sort based on category
    ranked.sort((a, b) => {
      if (category === 'revenue') {
        return (
          b.earnings_this_month - a.earnings_this_month ||
          b.leads_sold_this_month - a.leads_sold_this_month
        )
      } else if (category === 'leads') {
        return (
          b.leads_sold_this_month - a.leads_sold_this_month ||
          b.earnings_this_month - a.earnings_this_month
        )
      } else {
        // conversion
        return (
          b.conversion_rate - a.conversion_rate ||
          b.leads_sold_this_month - a.leads_sold_this_month
        )
      }
    })

    // Assign ranks (ties get the same rank)
    let currentRank = 1
    for (let i = 0; i < ranked.length; i++) {
      if (i > 0) {
        const prev = ranked[i - 1]
        const curr = ranked[i]
        const isTie =
          category === 'revenue'
            ? curr.earnings_this_month === prev.earnings_this_month &&
              curr.leads_sold_this_month === prev.leads_sold_this_month
            : category === 'leads'
            ? curr.leads_sold_this_month === prev.leads_sold_this_month &&
              curr.earnings_this_month === prev.earnings_this_month
            : curr.conversion_rate === prev.conversion_rate &&
              curr.leads_sold_this_month === prev.leads_sold_this_month

        if (!isTie) {
          currentRank = i + 1
        }
      }
      ;(ranked[i] as any).rank = currentRank
    }

    // 8. Build response: top 10 always shown; current user appended if outside top 10
    const top10 = ranked.slice(0, 10)
    const currentUserEntry = ranked.find((e) => e.is_current_user)
    const currentUserInTop10 = top10.some((e) => e.is_current_user)

    const leaderboard: LeaderboardEntry[] = top10.map((e) => ({
      rank: (e as any).rank,
      partner_name: e.is_current_user ? e.partner_name : obscureName(e.partner_name),
      tier: e.tier,
      leads_sold_this_month: e.leads_sold_this_month,
      earnings_this_month: e.earnings_this_month,
      conversion_rate: e.conversion_rate,
      is_current_user: e.is_current_user,
    }))

    if (!currentUserInTop10 && currentUserEntry) {
      leaderboard.push({
        rank: (currentUserEntry as any).rank,
        partner_name: currentUserEntry.partner_name,
        tier: currentUserEntry.tier,
        leads_sold_this_month: currentUserEntry.leads_sold_this_month,
        earnings_this_month: currentUserEntry.earnings_this_month,
        conversion_rate: currentUserEntry.conversion_rate,
        is_current_user: true,
      })
    }

    return NextResponse.json({ leaderboard, month: now.toISOString(), period, category })
  } catch (error) {
    safeError('[Leaderboard] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
