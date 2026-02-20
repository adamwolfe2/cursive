/**
 * Partner Leaderboard CSV Export API
 * GET /api/partner/leaderboard/export
 *
 * Admin-only route. Returns the current leaderboard data as a CSV download.
 * Columns: Rank, Partner (anonymized), Tier, Leads Sold, Revenue, Conversion Rate
 *
 * Query params:
 *   period   — 'week' | 'month' | 'quarter' | 'alltime'  (default: 'month')
 *   category — 'revenue' | 'leads' | 'conversion'        (default: 'revenue')
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { getPartnerTier } from '@/lib/services/partner-tier.service'
import { safeError } from '@/lib/utils/log-sanitizer'

export const dynamic = 'force-dynamic'

type LeaderboardPeriod = 'week' | 'month' | 'quarter' | 'alltime'
type LeaderboardCategory = 'revenue' | 'leads' | 'conversion'

function getPeriodStart(period: LeaderboardPeriod): string | null {
  const now = new Date()
  switch (period) {
    case 'week': {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      weekStart.setHours(0, 0, 0, 0)
      return weekStart.toISOString()
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    case 'quarter': {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3
      return new Date(now.getFullYear(), quarterMonth, 1).toISOString()
    }
    case 'alltime':
    default:
      return null
  }
}

function obscureName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return 'Partner'
  const parts = trimmed.split(/\s+/)
  const firstName = parts[0]
  const lastName = parts.length > 1 ? parts[parts.length - 1] : null
  if (lastName) return `${firstName} ${lastName.charAt(0)}.`
  if (firstName.length > 3) return `${firstName.slice(0, 3)}...`
  return firstName
}

function escapeCsvField(value: string | number): string {
  const str = String(value)
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(req: NextRequest) {
  try {
    // 1. Require admin access
    await requireAdmin()

    // 2. Parse query params
    const { searchParams } = new URL(req.url)
    const rawPeriod = searchParams.get('period') ?? 'month'
    const rawCategory = searchParams.get('category') ?? 'revenue'

    const period: LeaderboardPeriod = (
      ['week', 'month', 'quarter', 'alltime'] as const
    ).includes(rawPeriod as LeaderboardPeriod)
      ? (rawPeriod as LeaderboardPeriod)
      : 'month'

    const category: LeaderboardCategory = (
      ['revenue', 'leads', 'conversion'] as const
    ).includes(rawCategory as LeaderboardCategory)
      ? (rawCategory as LeaderboardCategory)
      : 'revenue'

    const periodStart = getPeriodStart(period)

    const adminClient = createAdminClient()

    // 3. Query purchases
    let purchasesQuery = adminClient
      .from('lead_purchases')
      .select('partner_id, partner_commission')
      .not('partner_id', 'is', null)

    if (periodStart) {
      purchasesQuery = purchasesQuery.gte('purchased_at', periodStart)
    }

    const { data: purchaseRows, error: purchaseError } = await purchasesQuery

    if (purchaseError) {
      safeError('[Leaderboard Export] Failed to query lead_purchases:', purchaseError)
      return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 })
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

    const allPartnerIds = Object.keys(partnerMap)

    if (allPartnerIds.length === 0) {
      // Return empty CSV
      const csv = 'Rank,Partner,Tier,Leads Sold,Revenue,Conversion Rate\n'
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="leaderboard-${period}-${category}.csv"`,
        },
      })
    }

    // 4. Fetch partner profiles + uploads for conversion
    const [partnersResult, uploadsResult] = await Promise.all([
      adminClient
        .from('partners')
        .select('id, name, total_leads_uploaded')
        .in('id', allPartnerIds),
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
      safeError('[Leaderboard Export] Failed to query partners:', partnersResult.error)
      return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 })
    }

    const partnerProfiles: Record<string, { name: string; total_leads_uploaded: number }> = {}
    for (const p of partnersResult.data ?? []) {
      partnerProfiles[p.id] = {
        name: p.name,
        total_leads_uploaded: p.total_leads_uploaded ?? 0,
      }
    }

    const uploadedLeadsMap: Record<string, number> = {}
    if (category === 'conversion' && uploadsResult.data) {
      for (const row of uploadsResult.data as Array<{ partner_id: string; leads_count: number }>) {
        if (!row.partner_id) continue
        uploadedLeadsMap[row.partner_id] =
          (uploadedLeadsMap[row.partner_id] ?? 0) + (row.leads_count ?? 0)
      }
    }

    // 5. Build ranked list
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
        leads_sold: stats.leads_sold,
        earnings: Math.round(stats.earnings * 100) / 100,
        conversion_rate: conversionRate,
      }
    })

    ranked.sort((a, b) => {
      if (category === 'revenue') {
        return b.earnings - a.earnings || b.leads_sold - a.leads_sold
      } else if (category === 'leads') {
        return b.leads_sold - a.leads_sold || b.earnings - a.earnings
      } else {
        return b.conversion_rate - a.conversion_rate || b.leads_sold - a.leads_sold
      }
    })

    // Assign ranks
    let currentRank = 1
    const rankedWithRank = ranked.map((entry, i) => {
      if (i > 0) {
        const prev = ranked[i - 1]
        const isTie =
          category === 'revenue'
            ? entry.earnings === prev.earnings && entry.leads_sold === prev.leads_sold
            : category === 'leads'
            ? entry.leads_sold === prev.leads_sold && entry.earnings === prev.earnings
            : entry.conversion_rate === prev.conversion_rate &&
              entry.leads_sold === prev.leads_sold
        if (!isTie) currentRank = i + 1
      }
      return { ...entry, rank: currentRank }
    })

    // 6. Build CSV
    const headers = ['Rank', 'Partner', 'Tier', 'Leads Sold', 'Revenue', 'Conversion Rate']
    const rows = rankedWithRank.map((e) => [
      e.rank,
      obscureName(e.partner_name),
      e.tier,
      e.leads_sold,
      `$${e.earnings.toFixed(2)}`,
      `${e.conversion_rate.toFixed(1)}%`,
    ])

    const csvLines = [
      headers.map(escapeCsvField).join(','),
      ...rows.map((r) => r.map(escapeCsvField).join(',')),
    ]

    const csv = csvLines.join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leaderboard-${period}-${category}.csv"`,
      },
    })
  } catch (error) {
    safeError('[Leaderboard Export] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
