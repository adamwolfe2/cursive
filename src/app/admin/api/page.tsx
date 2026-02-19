/**
 * Admin API Cost Monitor
 * /admin/api
 *
 * Shows 30-day rolling stats: cost by service, daily trend, top workspaces,
 * and the 50 most recent calls. Uses admin client directly — no extra API route.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceRow {
  service: string
  calls: number
  total_cost: number
  avg_duration_ms: number | null
  errors: number
}

interface DailyRow {
  day: string
  calls: number
  total_cost: number
}

interface WorkspaceRow {
  workspace_id: string
  workspace_name: string
  calls: number
  total_cost: number
}

interface RecentCall {
  id: string
  service: string
  endpoint: string
  status_code: number | null
  duration_ms: number | null
  tokens_in: number | null
  tokens_out: number | null
  estimated_cost: number
  workspace_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// ─── Data fetchers ─────────────────────────────────────────────────────────────

async function fetchDashboardData() {
  const db = createAdminClient()
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const since14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const [summaryRes, serviceRes, dailyRes, workspaceRes, recentRes] = await Promise.all([
    // 30-day totals
    db.from('api_logs')
      .select('estimated_cost, status_code, service')
      .gte('created_at', since30d),

    // Per-service breakdown (placeholder — use raw query below)
    Promise.resolve({ data: null, error: null }),

    // Daily trend (14 days)
    db.from('api_logs')
      .select('created_at, estimated_cost')
      .gte('created_at', since14d)
      .order('created_at', { ascending: true }),

    // Top workspaces
    db.from('api_logs')
      .select('workspace_id, estimated_cost, workspaces!inner(name)')
      .gte('created_at', since30d)
      .not('workspace_id', 'is', null),

    // Recent 50
    db.from('api_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const allLogs = summaryRes.data ?? []
  const totalCalls = allLogs.length
  const totalCost = allLogs.reduce((s: number, r: { estimated_cost: number }) => s + Number(r.estimated_cost), 0)
  const totalErrors = allLogs.filter((r: { status_code: number | null }) => r.status_code && r.status_code >= 500).length

  // Build per-service map from raw data
  const serviceMap = new Map<string, ServiceRow>()
  for (const log of allLogs as { service: string; estimated_cost: number; status_code: number | null }[]) {
    const key = log.service
    if (!serviceMap.has(key)) {
      serviceMap.set(key, { service: key, calls: 0, total_cost: 0, avg_duration_ms: null, errors: 0 })
    }
    const row = serviceMap.get(key)!
    row.calls++
    row.total_cost += Number(log.estimated_cost)
    if (log.status_code && log.status_code >= 500) row.errors++
  }
  const services: ServiceRow[] = Array.from(serviceMap.values())
    .sort((a, b) => b.total_cost - a.total_cost)

  // Daily trend — bucket by date
  const dayMap = new Map<string, DailyRow>()
  for (const log of (dailyRes.data ?? [])) {
    const day = log.created_at.slice(0, 10)
    if (!dayMap.has(day)) dayMap.set(day, { day, calls: 0, total_cost: 0 })
    const d = dayMap.get(day)!
    d.calls++
    d.total_cost += Number(log.estimated_cost)
  }
  const daily: DailyRow[] = Array.from(dayMap.values()).sort((a, b) => a.day.localeCompare(b.day))

  // Top workspaces
  const wsMap = new Map<string, WorkspaceRow>()
  for (const log of (workspaceRes.data ?? [])) {
    const wid = log.workspace_id!
    const wsName = (log as any).workspaces?.name ?? wid.slice(0, 8)
    if (!wsMap.has(wid)) wsMap.set(wid, { workspace_id: wid, workspace_name: wsName, calls: 0, total_cost: 0 })
    const r = wsMap.get(wid)!
    r.calls++
    r.total_cost += Number(log.estimated_cost)
  }
  const topWorkspaces: WorkspaceRow[] = Array.from(wsMap.values())
    .sort((a, b) => b.total_cost - a.total_cost)
    .slice(0, 10)

  const recent: RecentCall[] = (recentRes.data ?? []) as RecentCall[]

  return { totalCalls, totalCost, totalErrors, services, daily, topWorkspaces, recent }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt$$(n: number) {
  if (n < 0.001) return '$0.00'
  return `$${n.toFixed(4)}`
}
function fmtMs(ms: number | null) {
  if (!ms) return '—'
  return ms > 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
}
function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const SERVICE_COLORS: Record<string, string> = {
  firecrawl: 'bg-orange-100 text-orange-700',
  fal:       'bg-purple-100 text-purple-700',
  anthropic: 'bg-violet-100 text-violet-700',
  openai:    'bg-green-100 text-green-700',
  resend:    'bg-blue-100 text-blue-700',
  slack:     'bg-yellow-100 text-yellow-700',
  millionverifier: 'bg-cyan-100 text-cyan-700',
  audiencelab: 'bg-rose-100 text-rose-700',
}

function ServiceBadge({ service }: { service: string }) {
  const cls = SERVICE_COLORS[service] ?? 'bg-zinc-100 text-zinc-600'
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${cls}`}>
      {service}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ApiCostPage() {
  try { await requireAdmin() } catch { redirect('/dashboard?error=admin_required') }

  const { totalCalls, totalCost, totalErrors, services, daily, topWorkspaces, recent } =
    await fetchDashboardData()

  const maxDailyCost = Math.max(...daily.map(d => d.total_cost), 0.001)
  const maxDailyCalls = Math.max(...daily.map(d => d.calls), 1)

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">API Cost Monitor</h1>
        <p className="text-sm text-zinc-500 mt-1">30-day rolling window — external API spend tracker</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Cost (30d)', value: `$${totalCost.toFixed(4)}`, sub: 'across all services' },
          { label: 'Total API Calls', value: totalCalls.toLocaleString(), sub: 'last 30 days' },
          { label: 'Error Rate', value: totalCalls > 0 ? `${((totalErrors / totalCalls) * 100).toFixed(1)}%` : '0%', sub: `${totalErrors} 5xx errors` },
          { label: 'Avg Cost / Call', value: totalCalls > 0 ? `$${(totalCost / totalCalls).toFixed(5)}` : '$0', sub: 'per API call' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white border border-zinc-200 rounded-xl p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{value}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Per-service breakdown */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-800">Cost by Service (30d)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Service</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">Calls</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">Total Cost</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">Errors</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">% of Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {services.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-400 text-sm">No API calls logged yet</td></tr>
                )}
                {services.map(row => (
                  <tr key={row.service} className="hover:bg-zinc-50">
                    <td className="px-4 py-3"><ServiceBadge service={row.service} /></td>
                    <td className="px-4 py-3 text-right text-zinc-700">{row.calls.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-900">{fmt$$(row.total_cost)}</td>
                    <td className="px-4 py-3 text-right">
                      {row.errors > 0
                        ? <span className="text-red-600 font-medium">{row.errors}</span>
                        : <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-zinc-100 rounded-full h-1.5 max-w-[100px]">
                          <div
                            className="bg-indigo-500 h-1.5 rounded-full"
                            style={{ width: `${totalCost > 0 ? Math.min(100, (row.total_cost / totalCost) * 100) : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-400 tabular-nums">
                          {totalCost > 0 ? `${((row.total_cost / totalCost) * 100).toFixed(0)}%` : '0%'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top workspaces */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-800">Top Workspaces by Cost</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            {topWorkspaces.length === 0 && (
              <p className="px-5 py-8 text-center text-zinc-400 text-sm">No workspace-linked calls</p>
            )}
            {topWorkspaces.map((ws, i) => (
              <div key={ws.workspace_id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-xs text-zinc-400 font-mono w-4 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 truncate">{ws.workspace_name}</p>
                  <p className="text-xs text-zinc-400">{ws.calls} calls</p>
                </div>
                <span className="text-sm font-semibold text-zinc-900 tabular-nums">{fmt$$(ws.total_cost)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 14-day trend */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-800 mb-4">14-Day Daily Trend</h2>
        {daily.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4">No data yet</p>
        ) : (
          <div className="space-y-2">
            {daily.map(d => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 w-20 shrink-0">{d.day.slice(5)}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-zinc-100 rounded-full h-2.5">
                    <div
                      className="bg-indigo-400 h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.max(2, (d.total_cost / maxDailyCost) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-zinc-500 w-16 text-right">{fmt$$(d.total_cost)}</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-zinc-100 rounded-full h-2.5">
                    <div
                      className="bg-blue-300 h-2.5 rounded-full"
                      style={{ width: `${Math.max(2, (d.calls / maxDailyCalls) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-zinc-400 w-12 text-right">{d.calls} calls</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent calls */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-800">Recent API Calls</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Service/Endpoint</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-zinc-500">Status</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">Duration</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">Tokens</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">Cost</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {recent.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-400">No logs yet</td></tr>
              )}
              {recent.map(r => (
                <tr key={r.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <ServiceBadge service={r.service} />
                      <span className="text-zinc-500 font-mono text-xs">{r.endpoint}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {r.status_code ? (
                      <span className={`text-xs font-medium ${r.status_code >= 500 ? 'text-red-600' : r.status_code >= 400 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {r.status_code}
                      </span>
                    ) : <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-zinc-500 tabular-nums">
                    {fmtMs(r.duration_ms)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-zinc-400 tabular-nums">
                    {r.tokens_in != null
                      ? `${(r.tokens_in / 1000).toFixed(1)}k / ${((r.tokens_out ?? 0) / 1000).toFixed(1)}k`
                      : <span className="text-zinc-200">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-zinc-700">
                    {fmt$$(Number(r.estimated_cost))}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-zinc-400">
                    {timeAgo(r.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
