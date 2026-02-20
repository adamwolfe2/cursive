'use client'

/**
 * Admin Audit Logs Viewer
 * Cursive Platform
 *
 * Displays audit logs and security events with filtering, pagination,
 * and severity color-coding for compliance and debugging.
 */

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { safeError } from '@/lib/utils/log-sanitizer'

// ============ Types ============

type LogType = 'audit' | 'security'
type AuditSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical'
type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'import'
  | 'login'
  | 'logout'
  | 'approve'
  | 'reject'
  | 'send'
  | 'archive'
  | 'restore'

type ResourceType =
  | 'campaign'
  | 'lead'
  | 'email_send'
  | 'email_template'
  | 'conversation'
  | 'workspace'
  | 'user'
  | 'integration'
  | 'api_key'
  | 'settings'
  | 'suppression'

interface AuditLog {
  id: string
  workspaceId: string | null
  userId: string | null
  action: AuditAction
  resourceType: ResourceType
  resourceId: string | null
  ipAddress: string | null
  userAgent: string | null
  severity: AuditSeverity
  metadata: Record<string, unknown>
  tags: string[]
  createdAt: string
}

interface SecurityEvent {
  id: string
  workspaceId: string | null
  userId: string | null
  eventType: string
  eventCategory: string
  ipAddress: string | null
  userAgent: string | null
  riskLevel: string
  isSuspicious: boolean
  suspiciousReason: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

interface AuditLogsResponse {
  success: boolean
  data: {
    logs?: AuditLog[]
    events?: SecurityEvent[]
    pagination: Pagination
  }
}

interface Filters {
  type: LogType
  action: string
  resource_type: string
  page: number
}

// ============ Constants ============

const AUDIT_ACTIONS: AuditAction[] = [
  'create', 'update', 'delete', 'view', 'export', 'import',
  'login', 'logout', 'approve', 'reject', 'send', 'archive', 'restore',
]

const RESOURCE_TYPES: ResourceType[] = [
  'campaign', 'lead', 'email_send', 'email_template', 'conversation',
  'workspace', 'user', 'integration', 'api_key', 'settings', 'suppression',
]

const LIMIT = 50

// ============ Helpers ============

function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

function truncateId(id: string | null): string {
  if (!id) return '—'
  return id.length > 12 ? `${id.slice(0, 8)}…` : id
}

function SeverityBadge({ severity }: { severity: AuditSeverity | string }) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium'
  switch (severity) {
    case 'critical':
      return (
        <span className={`${base} bg-red-100 text-red-800 font-bold ring-1 ring-red-400`}>
          critical
        </span>
      )
    case 'error':
      return <span className={`${base} bg-red-50 text-red-700`}>error</span>
    case 'warning':
      return <span className={`${base} bg-amber-50 text-amber-700`}>warning</span>
    case 'info':
      return <span className={`${base} bg-zinc-100 text-zinc-600`}>info</span>
    case 'debug':
      return <span className={`${base} bg-zinc-50 text-zinc-400`}>debug</span>
    default:
      return <span className={`${base} bg-zinc-100 text-zinc-500`}>{severity}</span>
  }
}

function RiskBadge({ level }: { level: string }) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium'
  switch (level) {
    case 'critical':
      return <span className={`${base} bg-red-100 text-red-800 font-bold ring-1 ring-red-400`}>critical</span>
    case 'high':
      return <span className={`${base} bg-red-50 text-red-700`}>high</span>
    case 'medium':
      return <span className={`${base} bg-amber-50 text-amber-700`}>medium</span>
    case 'low':
      return <span className={`${base} bg-zinc-100 text-zinc-600`}>low</span>
    default:
      return <span className={`${base} bg-zinc-100 text-zinc-500`}>{level}</span>
  }
}

// ============ Skeleton ============

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-zinc-100 rounded mb-1" />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-12 bg-zinc-50 rounded mb-1" />
      ))}
    </div>
  )
}

// ============ Main Page ============

export default function AdminAuditLogsPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    type: 'audit',
    action: '',
    resource_type: '',
    page: 1,
  })

  const supabase = createClient()

  // Admin role check
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Build query URL from filters
  function buildQueryUrl(f: Filters): string {
    const params = new URLSearchParams({
      type: f.type,
      limit: String(LIMIT),
      page: String(f.page),
    })
    if (f.action) params.set('action', f.action)
    if (f.resource_type) params.set('resource_type', f.resource_type)
    return `/api/admin/audit-logs?${params.toString()}`
  }

  const { data, isLoading, refetch } = useQuery<AuditLogsResponse>({
    queryKey: ['admin', 'audit-logs', filters],
    queryFn: async () => {
      const res = await fetch(buildQueryUrl(filters))
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        safeError('[AuditLogs]', 'Fetch failed:', body)
        throw new Error(body?.error || 'Failed to fetch audit logs')
      }
      return res.json() as Promise<AuditLogsResponse>
    },
    enabled: authChecked && isAdmin,
    staleTime: 30_000,
  })

  // Summary counts — always fetch today's audit logs for the summary cards
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: summaryData } = useQuery<AuditLogsResponse>({
    queryKey: ['admin', 'audit-logs', 'summary-today'],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: 'audit',
        limit: '100',
        page: '1',
        start_date: todayStart.toISOString(),
      })
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch summary')
      return res.json() as Promise<AuditLogsResponse>
    },
    enabled: authChecked && isAdmin,
    staleTime: 60_000,
  })

  const logs = data?.data?.logs ?? []
  const events = data?.data?.events ?? []
  const pagination = data?.data?.pagination

  const todayLogs = summaryData?.data?.logs ?? []
  const todayTotal = summaryData?.data?.pagination?.total ?? 0
  const todayWarnings = todayLogs.filter(l => l.severity === 'warning').length
  const todayErrors = todayLogs.filter(l => l.severity === 'error' || l.severity === 'critical').length

  // ---- Guard rendering ----
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500 text-[13px]">Checking access...</p>
      </div>
    )
  }
  if (!isAdmin) return null

  // ---- Filter helpers ----
  function setType(type: LogType) {
    setFilters(prev => ({ ...prev, type, action: '', resource_type: '', page: 1 }))
  }
  function setAction(action: string) {
    setFilters(prev => ({ ...prev, action, page: 1 }))
  }
  function setResourceType(resource_type: string) {
    setFilters(prev => ({ ...prev, resource_type, page: 1 }))
  }
  function goToPage(page: number) {
    setFilters(prev => ({ ...prev, page }))
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">

      {/* ---- Header ---- */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Audit Logs</h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            Platform-wide activity trail for compliance and debugging
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="h-9 px-4 text-[13px] font-medium bg-white border border-zinc-300 rounded-lg text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* ---- Summary Cards ---- */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[12px] text-zinc-500 uppercase tracking-wide">Events Today</div>
          <div className="text-2xl font-semibold text-zinc-900 mt-1">{todayTotal}</div>
          <div className="text-[11px] text-zinc-400 mt-1">all severity levels</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[12px] text-amber-600 uppercase tracking-wide">Warnings Today</div>
          <div className="text-2xl font-semibold text-amber-700 mt-1">{todayWarnings}</div>
          <div className="text-[11px] text-zinc-400 mt-1">severity = warning</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[12px] text-red-600 uppercase tracking-wide">Errors Today</div>
          <div className="text-2xl font-semibold text-red-700 mt-1">{todayErrors}</div>
          <div className="text-[11px] text-zinc-400 mt-1">severity = error or critical</div>
        </div>
      </div>

      {/* ---- Filters ---- */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">

          {/* Type Toggle */}
          <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
            {(['audit', 'security'] as LogType[]).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                  filters.type === t
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {t === 'audit' ? 'Audit Logs' : 'Security Events'}
              </button>
            ))}
          </div>

          {/* Action filter — only for audit type */}
          {filters.type === 'audit' && (
            <select
              value={filters.action}
              onChange={e => setAction(e.target.value)}
              className="h-9 px-3 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 bg-white text-zinc-700"
            >
              <option value="">All actions</option>
              {AUDIT_ACTIONS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          )}

          {/* Resource type filter — only for audit type */}
          {filters.type === 'audit' && (
            <select
              value={filters.resource_type}
              onChange={e => setResourceType(e.target.value)}
              className="h-9 px-3 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 bg-white text-zinc-700"
            >
              <option value="">All resource types</option>
              {RESOURCE_TYPES.map(r => (
                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
              ))}
            </select>
          )}

          {/* Active filter badges */}
          {(filters.action || filters.resource_type) && (
            <button
              onClick={() => { setAction(''); setResourceType('') }}
              className="text-[12px] text-zinc-400 hover:text-zinc-600 underline"
            >
              Clear filters
            </button>
          )}

          <div className="ml-auto text-[12px] text-zinc-400">
            {pagination ? `${pagination.total.toLocaleString()} total` : ''}
          </div>
        </div>
      </div>

      {/* ---- Table ---- */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : filters.type === 'audit' ? (
          <AuditTable logs={logs} />
        ) : (
          <SecurityTable events={events} />
        )}
      </div>

      {/* ---- Pagination ---- */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-[12px] text-zinc-500">
            Page {pagination.page} of {pagination.total_pages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="h-8 px-3 text-[13px] border border-zinc-300 rounded-md text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.total_pages}
              className="h-8 px-3 text-[13px] border border-zinc-300 rounded-md text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ Audit Logs Table ============

function AuditTable({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="py-16 text-center text-zinc-400 text-[13px]">
        No audit logs found for these filters.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            <th className="text-left px-4 py-3 font-medium text-zinc-600 whitespace-nowrap">Timestamp</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 whitespace-nowrap">User ID</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 whitespace-nowrap">Action</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 whitespace-nowrap">Resource Type</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 whitespace-nowrap">Resource ID</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 whitespace-nowrap">Severity</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 whitespace-nowrap">IP Address</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => (
            <tr
              key={log.id}
              className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors ${
                log.severity === 'critical' ? 'bg-red-50' : ''
              }`}
            >
              <td className="px-4 py-3 text-zinc-500 whitespace-nowrap font-mono text-[12px]">
                {formatTimestamp(log.createdAt)}
              </td>
              <td className="px-4 py-3 text-zinc-700 font-mono text-[12px]" title={log.userId ?? ''}>
                {truncateId(log.userId)}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-mono text-[11px]">
                  {log.action}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                {log.resourceType.replace(/_/g, ' ')}
              </td>
              <td className="px-4 py-3 text-zinc-500 font-mono text-[12px]" title={log.resourceId ?? ''}>
                {truncateId(log.resourceId)}
              </td>
              <td className="px-4 py-3">
                <SeverityBadge severity={log.severity} />
              </td>
              <td className="px-4 py-3 text-zinc-500 font-mono text-[12px]">
                {log.ipAddress ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============ Security Events Table ============

function SecurityTable({ events }: { events: SecurityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="py-16 text-center text-zinc-400 text-[13px]">
        No security events found for these filters.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            <th className="text-left px-4 py-3 font-medium text-zinc-600 whitespace-nowrap">Timestamp</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 whitespace-nowrap">User ID</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 whitespace-nowrap">Event Type</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 whitespace-nowrap">Category</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 whitespace-nowrap">Risk Level</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 whitespace-nowrap">Suspicious</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 whitespace-nowrap">IP Address</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors ${
                event.isSuspicious ? 'bg-amber-50' : ''
              }`}
            >
              <td className="px-4 py-3 text-zinc-500 whitespace-nowrap font-mono text-[12px]">
                {formatTimestamp(event.createdAt)}
              </td>
              <td className="px-4 py-3 text-zinc-700 font-mono text-[12px]" title={event.userId ?? ''}>
                {truncateId(event.userId)}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-mono text-[11px]">
                  {event.eventType}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                {event.eventCategory.replace(/_/g, ' ')}
              </td>
              <td className="px-4 py-3">
                <RiskBadge level={event.riskLevel} />
              </td>
              <td className="px-4 py-3">
                {event.isSuspicious ? (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px] font-medium"
                    title={event.suspiciousReason ?? ''}
                  >
                    Yes
                  </span>
                ) : (
                  <span className="text-zinc-400 text-[12px]">No</span>
                )}
              </td>
              <td className="px-4 py-3 text-zinc-500 font-mono text-[12px]">
                {event.ipAddress ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
