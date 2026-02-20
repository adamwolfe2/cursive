'use client'

/**
 * Admin Email Deliverability Dashboard
 * Cursive Platform
 *
 * Displays a holistic deliverability health view combining:
 *   - Overall health score (0-100, colour-coded)
 *   - Three stat cards: open rate, bounce rate, unsubscribe rate
 *   - Top-20 domains table with per-domain open/bounce rates
 *   - Per-workspace bounce alerts (last 7 days)
 *   - Link to existing detailed Email Stats page (Resend data)
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { safeError } from '@/lib/utils/log-sanitizer'

// ---- Types ----

interface HealthData {
  health_score: number
  overall_open_rate: number
  overall_bounce_rate: number
  unsubscribe_rate: number
  total_sent: number
  total_opened: number
  total_bounced: number
  total_unsubscribed: number
  period_days: number
  note?: string
}

interface DomainStat {
  domain: string
  sent_count: number
  open_count: number
  bounce_count: number
  open_rate: number
  bounce_rate: number
}

interface DomainsData {
  domains: DomainStat[]
  period_days: number
  total_rows_scanned?: number
  note?: string
}

interface WorkspaceAlert {
  workspace_id: string
  workspace_name: string | null
  sent_count: number
  bounced_count: number
  bounce_rate: number
  alert_severity: 'critical' | 'warning'
}

interface AlertsData {
  alerts: WorkspaceAlert[]
  period_days: number
}

// ---- Helpers ----

function healthScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

function healthScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-50 border-green-200'
  if (score >= 60) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}

function healthScoreLabel(score: number): string {
  if (score >= 80) return 'Good'
  if (score >= 60) return 'Fair'
  return 'At Risk'
}

function openRateColor(rate: number): string {
  if (rate >= 20) return 'text-green-600'
  if (rate >= 15) return 'text-yellow-600'
  return 'text-red-600'
}

function bounceRateColor(rate: number): string {
  if (rate < 2) return 'text-green-600'
  if (rate < 5) return 'text-yellow-600'
  return 'text-red-600'
}

function unsubRateColor(rate: number): string {
  if (rate < 0.5) return 'text-green-600'
  if (rate < 1) return 'text-yellow-600'
  return 'text-red-600'
}

function domainBounceColor(rate: number): string {
  if (rate < 2) return 'text-zinc-600'
  if (rate < 5) return 'text-yellow-600 font-medium'
  return 'text-red-600 font-medium'
}

function alertSeverityBadge(severity: WorkspaceAlert['alert_severity']): string {
  return severity === 'critical'
    ? 'inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded text-[11px] font-semibold'
    : 'inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[11px] font-semibold'
}

// ---- Component ----

export default function AdminEmailDeliverabilityPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [domains, setDomains] = useState<DomainsData | null>(null)
  const [alerts, setAlerts] = useState<AlertsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Admin check — matches pattern used across admin pages
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchAll(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const [healthRes, domainsRes, alertsRes] = await Promise.all([
        fetch('/api/admin/email-deliverability/health'),
        fetch('/api/admin/email-deliverability/domains'),
        fetch('/api/admin/email-deliverability/alerts'),
      ])

      const [healthJson, domainsJson, alertsJson] = await Promise.all([
        healthRes.json(),
        domainsRes.json(),
        alertsRes.json(),
      ])

      if (!healthRes.ok) {
        setError(healthJson.error ?? 'Failed to load health score')
      } else if (healthJson.success) {
        setHealth(healthJson.data)
      }

      if (domainsJson.success) setDomains(domainsJson.data)
      if (alertsJson.success) setAlerts(alertsJson.data)

      setLastUpdated(new Date())
    } catch (err) {
      safeError('[EmailDeliverability] fetch error:', err)
      setError('Network error — could not load deliverability data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (authChecked && isAdmin) fetchAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="p-6 max-w-6xl">
        <div className="h-8 w-72 bg-zinc-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-zinc-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-72 bg-zinc-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  const alertList = alerts?.alerts ?? []
  const domainList = domains?.domains ?? []

  return (
    <div className="p-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Email Deliverability</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            Platform-wide stats from campaign email sends — last 30 days
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[12px] text-zinc-400">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="px-3 py-1.5 text-[13px] font-medium border border-zinc-300 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link
            href="/admin/email-stats"
            className="px-3 py-1.5 text-[13px] font-medium border border-zinc-300 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            View Resend Report
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px]">
          {error}
        </div>
      )}

      {/* Health Score + Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">

        {/* Health Score */}
        <div className={`bg-white border rounded-lg p-5 ${health ? healthScoreBg(health.health_score) : 'border-zinc-200'}`}>
          <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide">Health Score</div>
          <div className={`text-4xl font-bold mt-1 ${health ? healthScoreColor(health.health_score) : 'text-zinc-400'}`}>
            {health ? health.health_score : '—'}
          </div>
          <div className={`text-[13px] font-semibold mt-1 ${health ? healthScoreColor(health.health_score) : 'text-zinc-400'}`}>
            {health ? healthScoreLabel(health.health_score) : ''}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2">Green ≥80 / Yellow 60-79 / Red &lt;60</div>
        </div>

        {/* Open Rate */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide">Open Rate</div>
          <div className={`text-3xl font-bold mt-1 ${health ? openRateColor(health.overall_open_rate) : 'text-zinc-400'}`}>
            {health ? `${health.overall_open_rate.toFixed(1)}%` : '—'}
          </div>
          <div className="text-[12px] text-zinc-500 mt-1">
            {health ? `${health.total_opened.toLocaleString()} of ${health.total_sent.toLocaleString()} sent` : ''}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2">Target: &gt;20% green / &gt;15% yellow</div>
        </div>

        {/* Bounce Rate */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide">Bounce Rate</div>
          <div className={`text-3xl font-bold mt-1 ${health ? bounceRateColor(health.overall_bounce_rate) : 'text-zinc-400'}`}>
            {health ? `${health.overall_bounce_rate.toFixed(2)}%` : '—'}
          </div>
          <div className="text-[12px] text-zinc-500 mt-1">
            {health ? `${health.total_bounced.toLocaleString()} bounced` : ''}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2">Alert: &gt;2% warning / &gt;5% critical</div>
        </div>

        {/* Unsubscribe Rate */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide">Unsub Rate</div>
          <div className={`text-3xl font-bold mt-1 ${health ? unsubRateColor(health.unsubscribe_rate) : 'text-zinc-400'}`}>
            {health ? `${health.unsubscribe_rate.toFixed(3)}%` : '—'}
          </div>
          <div className="text-[12px] text-zinc-500 mt-1">
            {health ? `${health.total_unsubscribed.toLocaleString()} unsubscribed` : ''}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2">Alert: &gt;0.5% warning / &gt;1% critical</div>
        </div>
      </div>

      {/* Workspace Alerts */}
      {alertList.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[13px] font-semibold text-zinc-700 uppercase tracking-wide mb-3">
            Workspace Bounce Alerts — Last 7 Days
          </h2>
          <div className="bg-white border border-zinc-200 rounded-lg overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Workspace</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Sent</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Bounced</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Bounce Rate</th>
                  <th className="text-center px-5 py-3 font-medium text-zinc-500">Severity</th>
                </tr>
              </thead>
              <tbody>
                {alertList.map((alert) => (
                  <tr key={alert.workspace_id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-zinc-800">{alert.workspace_name ?? '(unnamed)'}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{alert.workspace_id}</div>
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-600">{alert.sent_count.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-red-600 font-medium">{alert.bounced_count.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={bounceRateColor(alert.bounce_rate)}>
                        {alert.bounce_rate.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={alertSeverityBadge(alert.alert_severity)}>
                        {alert.alert_severity.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Alerts State */}
      {alerts && alertList.length === 0 && (
        <div className="mb-8 px-5 py-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-[13px] text-green-700">
            No workspace bounce rate alerts in the last 7 days. All workspaces with 10+ sends are below 5% bounce rate.
          </p>
        </div>
      )}

      {/* Domain Table */}
      {domainList.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-lg mb-8">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-zinc-900">Top Domains</h2>
              <p className="text-[12px] text-zinc-500 mt-0.5">
                Last 30 days — top {domainList.length} recipient domains by volume
              </p>
            </div>
            {domains?.total_rows_scanned !== undefined && (
              <span className="text-[11px] text-zinc-400">
                {domains.total_rows_scanned.toLocaleString()} sends scanned
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Domain</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Sent</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Opened</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Bounced</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Open Rate</th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500">Bounce Rate</th>
                </tr>
              </thead>
              <tbody>
                {domainList.map((d) => (
                  <tr key={d.domain} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-zinc-800 font-mono text-[12px]">{d.domain}</td>
                    <td className="px-5 py-3 text-right text-zinc-600">{d.sent_count.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-zinc-600">{d.open_count.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={d.bounce_count > 0 ? 'text-red-600' : 'text-zinc-400'}>
                        {d.bounce_count.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={openRateColor(d.open_rate)}>
                        {d.open_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={domainBounceColor(d.bounce_rate)}>
                        {d.bounce_rate.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer link */}
      <div className="mt-2 text-center">
        <Link
          href="/admin/email-stats"
          className="text-[12px] text-zinc-400 hover:text-zinc-700 underline underline-offset-2 transition-colors"
        >
          View full deliverability report (Resend data) →
        </Link>
      </div>
    </div>
  )
}
