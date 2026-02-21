/**
 * Admin: Failed Background Jobs
 * View and manage failed Inngest/background jobs from the error-handling service
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, RotateCcw, CheckCircle, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import { safeError } from '@/lib/utils/log-sanitizer'

interface FailedJob {
  id: string
  job_type: string
  job_name: string
  error_type: string
  error_code: string | null
  error_message: string
  related_type: string | null
  related_id: string | null
  attempts: number
  max_attempts: number
  status: string
  next_retry_at: string | null
  resolved_at: string | null
  resolution_notes: string | null
  created_at: string
}

interface JobStats {
  error_type: string
  job_type: string
  total: number
  resolved: number
  abandoned: number
  pending: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
  has_more: boolean
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-800 border-yellow-200',
    retrying:  'bg-blue-100 text-blue-800 border-blue-200',
    abandoned: 'bg-red-100 text-red-800 border-red-200',
    resolved:  'bg-green-100 text-green-800 border-green-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${map[status] ?? 'bg-zinc-100 text-zinc-700'}`}>
      {status}
    </span>
  )
}

function ErrorTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    database:   'bg-orange-100 text-orange-800',
    validation: 'bg-purple-100 text-purple-800',
    external:   'bg-sky-100 text-sky-800',
    timeout:    'bg-rose-100 text-rose-800',
    unknown:    'bg-zinc-100 text-zinc-700',
  }
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${map[type] ?? 'bg-zinc-100 text-zinc-700'}`}>
      {type}
    </span>
  )
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function FailedJobsPage() {
  const { toast } = useToast()
  const [jobs, setJobs] = useState<FailedJob[]>([])
  const [stats, setStats] = useState<JobStats[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('pending,retrying,abandoned')
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), limit: '20', status: statusFilter })
      const res = await fetch(`/api/admin/failed-jobs?${params}`)
      if (!res.ok) throw new Error('Failed to load jobs')
      const data = await res.json()
      setJobs(data.data?.jobs ?? [])
      setPagination(data.data?.pagination ?? null)
    } catch (err) {
      safeError('[Admin/FailedJobs] Load error:', err)
      toast({ type: 'error', message: 'Failed to load failed jobs' })
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, toast])

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const res = await fetch('/api/admin/failed-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_stats', hours: 24 }),
      })
      if (!res.ok) throw new Error('Failed to load stats')
      const data = await res.json()
      setStats(data.data?.stats ?? [])
    } catch (err) {
      safeError('[Admin/FailedJobs] Stats error:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  async function handleRetry(jobId: string) {
    setActionLoading(jobId)
    try {
      const res = await fetch('/api/admin/failed-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry', job_id: jobId }),
      })
      if (!res.ok) throw new Error('Failed to retry job')
      toast({ type: 'success', message: 'Job queued for retry' })
      loadJobs()
    } catch (err) {
      safeError('[Admin/FailedJobs] Retry error:', err)
      toast({ type: 'error', message: 'Failed to retry job' })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleResolve(jobId: string) {
    setActionLoading(jobId)
    try {
      const res = await fetch('/api/admin/failed-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', job_id: jobId, notes: 'Manually resolved via admin panel' }),
      })
      if (!res.ok) throw new Error('Failed to resolve job')
      toast({ type: 'success', message: 'Job marked as resolved' })
      loadJobs()
    } catch (err) {
      safeError('[Admin/FailedJobs] Resolve error:', err)
      toast({ type: 'error', message: 'Failed to resolve job' })
    } finally {
      setActionLoading(null)
    }
  }

  // Summarise stats into top-level counts
  const totalPending = stats.reduce((s, r) => s + r.pending, 0)
  const totalAbandoned = stats.reduce((s, r) => s + r.abandoned, 0)
  const totalResolved = stats.reduce((s, r) => s + r.resolved, 0)

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Failed Background Jobs</h1>
          <p className="text-sm text-zinc-500 mt-1">Last 24 hours • Inngest job failures and retries</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { loadJobs(); loadStats() }} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-500">Pending / Retrying</p>
            <p className={`text-3xl font-bold mt-1 ${totalPending > 0 ? 'text-yellow-600' : 'text-zinc-900'}`}>
              {statsLoading ? '…' : totalPending}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-500">Abandoned (max retries)</p>
            <p className={`text-3xl font-bold mt-1 ${totalAbandoned > 0 ? 'text-red-600' : 'text-zinc-900'}`}>
              {statsLoading ? '…' : totalAbandoned}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-500">Resolved (24h)</p>
            <p className="text-3xl font-bold mt-1 text-green-600">
              {statsLoading ? '…' : totalResolved}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error breakdown */}
      {stats.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Error Breakdown (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-zinc-100">
              {stats.map((s, i) => (
                <div key={i} className="py-2 flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <ErrorTypeBadge type={s.error_type} />
                    <span className="text-zinc-600 truncate">{s.job_type}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 flex-shrink-0">
                    <span>{s.total} total</span>
                    {s.pending > 0 && <span className="text-yellow-600 font-medium">{s.pending} pending</span>}
                    {s.abandoned > 0 && <span className="text-red-600 font-medium">{s.abandoned} abandoned</span>}
                    {s.resolved > 0 && <span className="text-green-600">{s.resolved} resolved</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Jobs</CardTitle>
            <div className="flex items-center gap-2">
              {(['pending,retrying,abandoned', 'resolved', ''] as const).map((val) => {
                const label = val === '' ? 'All' : val === 'resolved' ? 'Resolved' : 'Active'
                return (
                  <button
                    key={val}
                    onClick={() => { setStatusFilter(val); setPage(1) }}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      statusFilter === val
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-zinc-400">Loading…</div>
          ) : jobs.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No jobs matching this filter</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {jobs.map((job) => (
                <div key={job.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={job.status} />
                        <ErrorTypeBadge type={job.error_type} />
                        <span className="text-sm font-medium text-zinc-900 truncate">{job.job_name || job.job_type}</span>
                        {job.attempts > 1 && (
                          <span className="text-xs text-zinc-400">{job.attempts}/{job.max_attempts} attempts</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-zinc-600 truncate">{job.error_message}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                        <span>Created {formatDate(job.created_at)}</span>
                        {job.next_retry_at && job.status !== 'abandoned' && job.status !== 'resolved' && (
                          <span>Next retry {formatDate(job.next_retry_at)}</span>
                        )}
                        {job.related_type && job.related_id && (
                          <span>{job.related_type}: {job.related_id.substring(0, 8)}…</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                        className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                      >
                        {expandedJob === job.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {job.status !== 'resolved' && (
                        <>
                          <button
                            onClick={() => handleRetry(job.id)}
                            disabled={actionLoading === job.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Retry
                          </button>
                          <button
                            onClick={() => handleResolve(job.id)}
                            disabled={actionLoading === job.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Resolve
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expandedJob === job.id && (
                    <div className="mt-3 rounded-lg bg-zinc-50 border border-zinc-200 p-3 text-xs space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-zinc-400">Job ID:</span> <span className="font-mono text-zinc-700">{job.id}</span></div>
                        <div><span className="text-zinc-400">Error code:</span> <span className="font-mono text-zinc-700">{job.error_code || '—'}</span></div>
                        {job.related_type && <div><span className="text-zinc-400">Related:</span> <span className="font-mono text-zinc-700">{job.related_type}/{job.related_id}</span></div>}
                        {job.resolved_at && <div><span className="text-zinc-400">Resolved:</span> <span className="text-zinc-700">{formatDate(job.resolved_at)}</span></div>}
                      </div>
                      <div>
                        <p className="text-zinc-400 mb-1">Error message:</p>
                        <pre className="text-zinc-700 whitespace-pre-wrap break-all bg-white rounded border border-zinc-200 p-2">{job.error_message}</pre>
                      </div>
                      {job.resolution_notes && (
                        <div>
                          <p className="text-zinc-400 mb-1">Resolution notes:</p>
                          <p className="text-zinc-700">{job.resolution_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs rounded border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.has_more}
                  className="px-3 py-1 text-xs rounded border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zero-state health check */}
      {!loading && totalPending === 0 && totalAbandoned === 0 && jobs.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-800">All background jobs healthy</p>
            <p className="text-xs text-green-600 mt-1">No failed jobs in the last 24 hours</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
