'use client'

/**
 * Admin Email Deliverability Dashboard
 * Cursive Platform
 *
 * Displays deliverability metrics fetched from Resend via
 * /api/admin/email-stats. Refreshes on demand.
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { safeError } from '@/lib/utils/log-sanitizer'

// ============================================
// TYPES
// ============================================

interface CategoryStats {
  sent: number
  delivered: number
  bounced: number
  complained: number
}

interface RecentBounce {
  id: string
  to: string
  subject: string
  created_at: string
  last_event: string
}

interface Alert {
  level: 'warning' | 'critical'
  message: string
}

interface EmailStatsData {
  summary: {
    sent: number
    delivered: number
    bounced: number
    complained: number
    delivery_rate: number
    bounce_rate: number
    complaint_rate: number
  }
  by_category: Record<string, CategoryStats>
  recent_bounces: RecentBounce[]
  alerts: Alert[]
  meta: {
    emails_sampled: number
    note: string
  }
}

// ============================================
// HELPERS
// ============================================

function deliveryRateColor(rate: number): string {
  if (rate >= 95) return 'text-green-600'
  if (rate >= 90) return 'text-yellow-600'
  return 'text-red-600'
}

function deliveryRateBg(rate: number): string {
  if (rate >= 95) return 'bg-green-50 border-green-200'
  if (rate >= 90) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}

function bounceRateColor(rate: number): string {
  if (rate < 2) return 'text-green-600'
  if (rate < 5) return 'text-yellow-600'
  return 'text-red-600'
}

function complaintRateColor(rate: number): string {
  if (rate < 0.1) return 'text-green-600'
  if (rate < 0.5) return 'text-yellow-600'
  return 'text-red-600'
}

function alertBg(level: Alert['level']): string {
  return level === 'critical'
    ? 'bg-red-50 border border-red-200 text-red-800'
    : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
}

function alertDot(level: Alert['level']): string {
  return level === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
}

function categoryLabel(key: string): string {
  const labels: Record<string, string> = {
    welcome: 'Welcome',
    auth: 'Auth / Password Reset',
    notification: 'Notifications',
    billing: 'Billing',
    partner: 'Partner',
    marketplace: 'Marketplace',
    digest: 'Weekly Digest',
    other: 'Other',
  }
  return labels[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function AdminEmailStatsPage() {
  const [data, setData] = useState<EmailStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Admin role check — matches pattern used in other admin pages
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
  }, [])

  async function fetchStats(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/email-stats')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to load email stats')
      } else if (json.success) {
        setData(json.data)
        setLastUpdated(new Date())
      }
    } catch (err) {
      safeError('[AdminEmailStats] fetch error:', err)
      setError('Network error — could not load email stats')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (authChecked && isAdmin) fetchStats()
  }, [authChecked, isAdmin])

  // ---- Guard states ----
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
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-zinc-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-zinc-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  const summary = data?.summary
  const byCategory = data?.by_category ?? {}
  const recentBounces = data?.recent_bounces ?? []
  const alerts = data?.alerts ?? []
  const meta = data?.meta

  return (
    <div className="p-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Email Deliverability</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            Resend stats — {meta?.note ?? 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[12px] text-zinc-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="px-3 py-1.5 text-[13px] font-medium border border-zinc-300 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px]">
          {error}
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          <h2 className="text-[13px] font-semibold text-zinc-700 uppercase tracking-wide mb-2">
            Active Alerts
          </h2>
          {alerts.map((alert, i) => (
            <div key={i} className={`flex items-start gap-2.5 px-4 py-3 rounded-lg text-[13px] ${alertBg(alert.level)}`}>
              <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${alertDot(alert.level)}`} />
              <span className="font-medium capitalize mr-1">{alert.level}:</span>
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

        {/* Delivery Rate */}
        <div className={`bg-white border rounded-lg p-5 ${summary ? deliveryRateBg(summary.delivery_rate) : 'border-zinc-200'}`}>
          <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide">Delivery Rate</div>
          <div className={`text-3xl font-bold mt-1 ${summary ? deliveryRateColor(summary.delivery_rate) : 'text-zinc-400'}`}>
            {summary ? `${summary.delivery_rate.toFixed(1)}%` : '—'}
          </div>
          <div className="text-[12px] text-zinc-500 mt-1">
            {summary ? `${summary.delivered.toLocaleString()} of ${summary.sent.toLocaleString()} sent` : ''}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2">Target: &gt;95% green / 90–95% yellow / &lt;90% red</div>
        </div>

        {/* Bounce Rate */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide">Bounce Rate</div>
          <div className={`text-3xl font-bold mt-1 ${summary ? bounceRateColor(summary.bounce_rate) : 'text-zinc-400'}`}>
            {summary ? `${summary.bounce_rate.toFixed(2)}%` : '—'}
          </div>
          <div className="text-[12px] text-zinc-500 mt-1">
            {summary ? `${summary.bounced.toLocaleString()} bounced` : ''}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2">Alert: &gt;2% warning / &gt;5% critical</div>
        </div>

        {/* Complaint Rate */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide">Complaint Rate</div>
          <div className={`text-3xl font-bold mt-1 ${summary ? complaintRateColor(summary.complaint_rate) : 'text-zinc-400'}`}>
            {summary ? `${summary.complaint_rate.toFixed(3)}%` : '—'}
          </div>
          <div className="text-[12px] text-zinc-500 mt-1">
            {summary ? `${summary.complained.toLocaleString()} complaint${summary.complained !== 1 ? 's' : ''}` : ''}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2">Alert: &gt;0.1% warning / &gt;0.5% critical</div>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-lg mb-8">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-[14px] font-semibold text-zinc-900">Breakdown by Email Category</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Category</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Sent</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Delivered</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Bounced</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Complaints</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Delivery %</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byCategory).map(([key, stats]) => {
                  const rate = stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0
                  return (
                    <tr key={key} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-zinc-800">{categoryLabel(key)}</td>
                      <td className="px-5 py-3 text-right text-zinc-600">{stats.sent.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right text-zinc-600">{stats.delivered.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={stats.bounced > 0 ? 'text-red-600 font-medium' : 'text-zinc-400'}>
                          {stats.bounced.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={stats.complained > 0 ? 'text-orange-600 font-medium' : 'text-zinc-400'}>
                          {stats.complained.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {stats.sent > 0 ? (
                          <span className={deliveryRateColor(rate)}>
                            {rate.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Bounces */}
      <div className="bg-white border border-zinc-200 rounded-lg">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-[14px] font-semibold text-zinc-900">Recent Bounces</h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">Email addresses are partially redacted for privacy</p>
        </div>

        {recentBounces.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="text-2xl mb-2">No bounces</div>
            <p className="text-[13px] text-zinc-500">No bounced emails found in the latest sample.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Recipient</th>
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Subject</th>
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Event</th>
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentBounces.map((bounce) => (
                  <tr key={bounce.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-zinc-700">{bounce.to}</td>
                    <td className="px-5 py-3 text-zinc-600 max-w-xs truncate">{bounce.subject}</td>
                    <td className="px-5 py-3">
                      <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded text-[11px] font-medium capitalize">
                        {bounce.last_event}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-500 whitespace-nowrap">{formatDate(bounce.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer note */}
      {meta && (
        <p className="mt-4 text-[11px] text-zinc-400 text-center">
          Based on {meta.emails_sampled} emails sampled from Resend. Resend does not expose full aggregate delivery events via SDK — these stats reflect email status at last known webhook event.
        </p>
      )}
    </div>
  )
}
