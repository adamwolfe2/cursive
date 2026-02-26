/**
 * GET /api/admin/enrichment-costs
 * Returns enrichment cost analytics for the admin dashboard (last 30 days).
 * Auth: platform admin only via requireAdmin() from @/lib/auth/admin.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET() {
  try {
    await requireAdmin()

    const supabase = createAdminClient()
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString()

    const [byTierResult, byProviderResult, totalsResult] = await Promise.all([
      supabase
        .from('enrichment_costs')
        .select('tier, credits_charged, api_cost_usd')
        .gte('created_at', thirtyDaysAgo),
      supabase
        .from('enrichment_costs')
        .select('provider, api_cost_usd, credits_charged')
        .gte('created_at', thirtyDaysAgo),
      supabase
        .from('enrichment_costs')
        .select('credits_charged, api_cost_usd')
        .gte('created_at', thirtyDaysAgo),
    ])

    // Aggregate by tier
    const aggregateByTier = (byTierResult.data ?? []).reduce<
      Record<string, { revenue: number; cost: number; count: number }>
    >((acc, r) => {
      if (!acc[r.tier]) acc[r.tier] = { revenue: 0, cost: 0, count: 0 }
      acc[r.tier].revenue += (r.credits_charged ?? 0) * 0.5
      acc[r.tier].cost += r.api_cost_usd ?? 0
      acc[r.tier].count++
      return acc
    }, {})

    // Aggregate by provider
    const aggregateByProvider = (byProviderResult.data ?? []).reduce<
      Record<string, { revenue: number; cost: number; count: number }>
    >((acc, r) => {
      if (!acc[r.provider]) acc[r.provider] = { revenue: 0, cost: 0, count: 0 }
      acc[r.provider].revenue += (r.credits_charged ?? 0) * 0.5
      acc[r.provider].cost += r.api_cost_usd ?? 0
      acc[r.provider].count++
      return acc
    }, {})

    const totalRevenue = (totalsResult.data ?? []).reduce(
      (s, r) => s + (r.credits_charged ?? 0) * 0.5,
      0
    )
    const totalCost = (totalsResult.data ?? []).reduce(
      (s, r) => s + (r.api_cost_usd ?? 0),
      0
    )

    return NextResponse.json({
      summary: {
        total_revenue: totalRevenue,
        total_cost: totalCost,
        gross_margin:
          totalRevenue > 0
            ? (
                ((totalRevenue - totalCost) / totalRevenue) *
                100
              ).toFixed(1) + '%'
            : '0%',
        total_enrichments: totalsResult.data?.length ?? 0,
      },
      by_tier: aggregateByTier,
      by_provider: aggregateByProvider,
      period_days: 30,
    })
  } catch (error) {
    safeError('[AdminEnrichmentCosts] GET failed:', error)
    if (
      error instanceof Error &&
      error.message.includes('Unauthorized')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch enrichment costs' },
      { status: 500 }
    )
  }
}
