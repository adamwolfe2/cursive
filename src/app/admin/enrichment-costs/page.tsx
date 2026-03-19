'use client'

/**
 * Admin Enrichment Costs Dashboard
 * Cursive Platform
 *
 * Shows intelligence enrichment cost analytics: revenue, API cost, margin,
 * breakdown by tier/provider, and top workspaces. Data from /api/admin/enrichment-costs.
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { safeError } from '@/lib/utils/log-sanitizer'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TierData {
  revenue: number
  cost: number
  count: number
}

interface ProviderData {
  revenue: number
  cost: number
  count: number
}

interface RawWorkspaceCost {
  workspace_id: string
  credits_charged: number | null
  api_cost_usd: number | null
}

interface EnrichmentCostsData {
  summary: {
    total_revenue: number
    total_cost: number
    gross_margin: string
    total_enrichments: number
  }
  by_tier: Record<string, TierData>
  by_provider: Record<string, ProviderData>
  raw_workspace_costs: RawWorkspaceCost[]
  period_days: number
}

interface WorkspaceAggregate {
  workspace_id: string
  credits: number
  revenue: number
  cost: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(value: number): string {
  return '$' + value.toFixed(2)
}

function fmtPct(revenue: number, cost: number): string {
  if (revenue <= 0) return '0.0%'
  return (((revenue - cost) / revenue) * 100).toFixed(1) + '%'
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminEnrichmentCostsPage() {
  const [data, setData] = useState<EnrichmentCostsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const supabase = createClient()

  // Admin auth check — same pattern as other admin pages
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        window.location.href = '/login'
        return
      }
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .maybeSingle() as { data: { role: string } | null }
      if (!userData || (userData.role !== 'admin' && userData.role !== 'owner')) {
        window.location.href = '/dashboard'
        return
      }
      setIsAdmin(true)
      setAuthChecked(true)
    }
    checkAdmin()
  }, [supabase])

  async function fetchData(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/enrichment-costs')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to load enrichment costs')
      } else {
        setData(json)
        setLastUpdated(new Date())
      }
    } catch (err) {
      safeError('[AdminEnrichmentCosts] fetch error:', err)
      setError('Network error — could not load enrichment costs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (authChecked && isAdmin) fetchData()
  }, [authChecked, isAdmin])

  // ── Guard states ──────────────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500 text-sm">Checking access...</p>
      </div>
    )
  }
  if (!isAdmin) return null

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-72 bg-zinc-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-zinc-200 rounded-lg animate-pulse mb-6" />
        <div className="h-48 bg-zinc-200 rounded-lg animate-pulse mb-6" />
        <div className="h-64 bg-zinc-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  // Aggregate raw workspace costs client-side
  const workspaceAggregates: WorkspaceAggregate[] = Object.values(
    (data?.raw_workspace_costs ?? []).reduce<Record<string, WorkspaceAggregate>>(
      (acc, r) => {
        if (!acc[r.workspace_id]) {
          acc[r.workspace_id] = { workspace_id: r.workspace_id, credits: 0, revenue: 0, cost: 0 }
        }
        acc[r.workspace_id].credits += r.credits_charged ?? 0
        acc[r.workspace_id].revenue += (r.credits_charged ?? 0) * 0.5
        acc[r.workspace_id].cost += r.api_cost_usd ?? 0
        return acc
      },
      {}
    )
  )
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const tierEntries = Object.entries(data?.by_tier ?? {})
  const providerEntries = Object.entries(data?.by_provider ?? {})

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Intelligence Enrichment Costs</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">Last 30 days</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[12px] text-zinc-400">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="px-3 py-1.5 text-[13px] font-medium border border-zinc-300 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px]">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide mb-1">
            Total Revenue
          </div>
          <div className="text-3xl font-bold text-zinc-900">
            {fmt$(data?.summary.total_revenue ?? 0)}
          </div>
          <div className="text-[12px] text-zinc-500 mt-1">credits × $0.50</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide mb-1">
            Total API Cost
          </div>
          <div className="text-3xl font-bold text-zinc-900">
            {fmt$(data?.summary.total_cost ?? 0)}
          </div>
          <div className="text-[12px] text-zinc-500 mt-1">provider spend</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide mb-1">
            Gross Margin
          </div>
          <div className="text-3xl font-bold text-zinc-900">
            {data?.summary.gross_margin ?? '0%'}
          </div>
          <div className="text-[12px] text-zinc-500 mt-1">revenue minus cost</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide mb-1">
            Total Enrichments
          </div>
          <div className="text-3xl font-bold text-zinc-900">
            {(data?.summary.total_enrichments ?? 0).toLocaleString()}
          </div>
          <div className="text-[12px] text-zinc-500 mt-1">last 30 days</div>
        </div>
      </div>

      {/* By Tier Table */}
      <div className="bg-white border border-zinc-200 rounded-lg mb-6">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-[14px] font-semibold text-zinc-900">By Tier</h2>
        </div>
        {tierEntries.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[13px] text-zinc-500">No enrichment activity in the last 30 days.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Tier</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Count</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Revenue</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">API Cost</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {tierEntries.map(([tier, d]) => (
                  <tr key={tier} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-zinc-900 capitalize">{tier.replace('_', ' ')}</td>
                    <td className="px-5 py-3 text-right text-zinc-700">{d.count.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-zinc-700">{fmt$(d.revenue)}</td>
                    <td className="px-5 py-3 text-right text-zinc-700">{fmt$(d.cost)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-zinc-900">
                      {fmtPct(d.revenue, d.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* By Provider Table */}
      <div className="bg-white border border-zinc-200 rounded-lg mb-6">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-[14px] font-semibold text-zinc-900">By Provider</h2>
        </div>
        {providerEntries.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[13px] text-zinc-500">No provider data available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Provider</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Count</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Revenue</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">API Cost</th>
                </tr>
              </thead>
              <tbody>
                {providerEntries.map(([provider, d]) => (
                  <tr key={provider} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-zinc-900 font-mono text-[12px]">{provider}</td>
                    <td className="px-5 py-3 text-right text-zinc-700">{d.count.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-zinc-700">{fmt$(d.revenue)}</td>
                    <td className="px-5 py-3 text-right text-zinc-700">{fmt$(d.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Workspaces */}
      <div className="bg-white border border-zinc-200 rounded-lg">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-[14px] font-semibold text-zinc-900">Top Workspaces</h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">Top 10 by revenue, aggregated from raw cost records</p>
        </div>
        {workspaceAggregates.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[13px] text-zinc-500">No workspace cost data available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Workspace ID</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Credits</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Revenue</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">API Cost</th>
                </tr>
              </thead>
              <tbody>
                {workspaceAggregates.map((ws) => (
                  <tr key={ws.workspace_id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-[11px] text-zinc-500">
                      {ws.workspace_id.slice(0, 8)}...
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-700">{ws.credits.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-semibold text-zinc-900">{fmt$(ws.revenue)}</td>
                    <td className="px-5 py-3 text-right text-zinc-700">{fmt$(ws.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
