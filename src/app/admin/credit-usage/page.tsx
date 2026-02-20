'use client'

/**
 * Admin Credit Usage Dashboard
 * Cursive Platform
 *
 * Shows top workspaces by credit spend, platform totals, daily velocity,
 * and anomaly detection. Data fetched from /api/admin/credit-usage.
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { safeError } from '@/lib/utils/log-sanitizer'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TopWorkspace {
  workspace_id: string
  name: string
  credits_spent: number
}

interface DailyVelocity {
  date: string
  credits: number
}

interface Anomaly {
  workspace_id: string
  name: string
  recent_daily_avg: number
  prev_daily_avg: number
  multiplier: number
}

interface CreditUsageData {
  top_workspaces: TopWorkspace[]
  platform: {
    total_credits_issued: number
    total_credits_redeemed: number
  }
  daily_velocity: DailyVelocity[]
  anomalies: Anomaly[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminCreditUsagePage() {
  const [data, setData] = useState<CreditUsageData | null>(null)
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
        .single() as { data: { role: string } | null }
      if (!userData || (userData.role !== 'admin' && userData.role !== 'owner')) {
        window.location.href = '/dashboard'
        return
      }
      setIsAdmin(true)
      setAuthChecked(true)
    }
    checkAdmin()
  }, [])

  async function fetchData(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/credit-usage')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to load credit usage')
      } else {
        setData(json)
        setLastUpdated(new Date())
      }
    } catch (err) {
      safeError('[AdminCreditUsage] fetch error:', err)
      setError('Network error — could not load credit usage')
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
        <div className="h-8 w-64 bg-zinc-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-zinc-200 rounded-lg animate-pulse mb-6" />
        <div className="h-48 bg-zinc-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  const maxDaily = Math.max(...(data?.daily_velocity ?? []).map((d) => d.credits), 1)

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Credit Usage</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            Marketplace credit spend — last 30 days
          </p>
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

      {/* Platform Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide mb-1">
            Total Credits Redeemed (All Time)
          </div>
          <div className="text-3xl font-bold text-zinc-900">
            {(data?.platform.total_credits_redeemed ?? 0).toLocaleString()}
          </div>
          <div className="text-[12px] text-zinc-500 mt-1">via marketplace purchases</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide mb-1">
            Anomalies Detected
          </div>
          <div className={`text-3xl font-bold ${(data?.anomalies.length ?? 0) > 0 ? 'text-amber-600' : 'text-zinc-900'}`}>
            {data?.anomalies.length ?? 0}
          </div>
          <div className="text-[12px] text-zinc-500 mt-1">workspaces with &gt;3x normal usage</div>
        </div>
      </div>

      {/* Daily Velocity Chart */}
      <div className="bg-white border border-zinc-200 rounded-lg mb-8">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-[14px] font-semibold text-zinc-900">Daily Credit Velocity (Last 30 Days)</h2>
        </div>
        <div className="px-5 py-5">
          {(data?.daily_velocity ?? []).every((d) => d.credits === 0) ? (
            <p className="text-[13px] text-zinc-500 text-center py-4">No credit activity in the last 30 days.</p>
          ) : (
            <>
              <div className="flex items-end gap-0.5 h-36 w-full overflow-hidden">
                {(data?.daily_velocity ?? []).map((d) => {
                  const heightPct = maxDaily > 0 ? (d.credits / maxDaily) * 100 : 0
                  const isToday = d.date === new Date().toISOString().split('T')[0]
                  return (
                    <div
                      key={d.date}
                      className="group relative flex-1 flex flex-col items-center justify-end"
                      title={`${formatDate(d.date)}: ${d.credits} credits`}
                    >
                      <div
                        className={`w-full rounded-t transition-all ${
                          isToday ? 'bg-zinc-900' : d.credits > 0 ? 'bg-zinc-700' : 'bg-zinc-100'
                        }`}
                        style={{ height: `${Math.max(heightPct, d.credits > 0 ? 3 : 1)}%` }}
                      />
                      {d.credits > 0 && (
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                          <div className="bg-zinc-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap">
                            {formatDate(d.date)}: {d.credits}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-2 text-[11px] text-zinc-400">
                {data && data.daily_velocity.length > 0 && (
                  <>
                    <span>{formatDate(data.daily_velocity[0].date)}</span>
                    <span>{formatDate(data.daily_velocity[data.daily_velocity.length - 1].date)}</span>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top 10 Workspaces */}
      <div className="bg-white border border-zinc-200 rounded-lg mb-8">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-[14px] font-semibold text-zinc-900">Top 10 Workspaces by Credit Spend (Last 30 Days)</h2>
        </div>
        {!data || data.top_workspaces.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[13px] text-zinc-500">No purchases in the last 30 days.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">#</th>
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Workspace</th>
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">ID</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Credits Spent</th>
                </tr>
              </thead>
              <tbody>
                {data.top_workspaces.map((ws, idx) => (
                  <tr key={ws.workspace_id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3 text-zinc-400 font-mono text-[12px]">{idx + 1}</td>
                    <td className="px-5 py-3 font-medium text-zinc-900">{ws.name}</td>
                    <td className="px-5 py-3 text-zinc-400 font-mono text-[11px]">{ws.workspace_id.slice(0, 12)}...</td>
                    <td className="px-5 py-3 text-right font-semibold text-zinc-900">
                      {ws.credits_spent.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Anomalies */}
      <div className="bg-white border border-zinc-200 rounded-lg">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-[14px] font-semibold text-zinc-900">Usage Anomalies</h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">Workspaces with more than 3x their previous 30-day daily average</p>
        </div>
        {!data || data.anomalies.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[13px] text-zinc-500">No anomalies detected.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Workspace</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Recent Avg/Day</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Prev Avg/Day</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Multiplier</th>
                </tr>
              </thead>
              <tbody>
                {data.anomalies.map((a) => (
                  <tr key={a.workspace_id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-zinc-900">{a.name}</td>
                    <td className="px-5 py-3 text-right text-zinc-700">{a.recent_daily_avg}</td>
                    <td className="px-5 py-3 text-right text-zinc-500">{a.prev_daily_avg}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[11px] font-semibold">
                        {a.multiplier}x
                      </span>
                    </td>
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
