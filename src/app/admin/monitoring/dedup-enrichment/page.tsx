'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'

interface DedupStats {
  today: number
  last7d: number
  last30d: number
  bySource: Record<string, number>
  trend: Array<{ date: string; rejections: number }>
}

interface EnrichmentStats {
  total: number
  success: number
  noData: number
  failed: number
  today: number
  successRate: number
  topWorkspaces: Array<{ workspace_id: string; count: number; credits: number }>
  trend: Array<{ date: string; success: number; no_data: number; failed: number }>
}

interface MonitoringData {
  dedup: DedupStats
  enrichment: EnrichmentStats
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  status,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  status: 'healthy' | 'warning' | 'error' | 'neutral'
}) {
  const statusColors = {
    healthy: 'text-green-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
    neutral: 'text-zinc-500',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={statusColors[status]}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

function MiniBarChart({ data, maxVal }: { data: number[]; maxVal: number }) {
  const barMax = Math.max(maxVal, 1)
  return (
    <div className="flex items-end gap-0.5 h-10">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 bg-primary/70 rounded-t-sm min-h-[2px] transition-all"
          style={{ height: `${Math.max((v / barMax) * 100, 4)}%` }}
          title={`${v}`}
        />
      ))}
    </div>
  )
}

export default function DedupEnrichmentMonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every 60s
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/admin/monitoring/dedup-enrichment')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json.data)
      setError(null)
    } catch {
      setError('Failed to load monitoring data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Clock className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading metrics...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-muted-foreground">{error || 'No data available'}</p>
        </div>
      </div>
    )
  }

  const { dedup, enrichment } = data
  const dedupTrendMax = Math.max(...dedup.trend.map((d) => d.rejections), 1)
  const enrichTrendMax = Math.max(
    ...enrichment.trend.map((d) => d.success + d.no_data + d.failed),
    1
  )

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Dedup & Enrichment Monitoring</h1>
        <p className="text-muted-foreground">
          Track duplicate rejection rates and enrichment activity across all workspaces
        </p>
      </div>

      {/* ========== DEDUP SECTION ========== */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Deduplication
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Today"
            value={dedup.today.toLocaleString()}
            subtitle="rejections"
            icon={<Filter className="h-4 w-4" />}
            status="neutral"
          />
          <MetricCard
            title="Last 7 Days"
            value={dedup.last7d.toLocaleString()}
            subtitle="rejections"
            icon={<TrendingUp className="h-4 w-4" />}
            status="neutral"
          />
          <MetricCard
            title="Last 30 Days"
            value={dedup.last30d.toLocaleString()}
            subtitle="rejections"
            icon={<Activity className="h-4 w-4" />}
            status="neutral"
          />
          <MetricCard
            title="Daily Average"
            value={dedup.last7d > 0 ? Math.round(dedup.last7d / 7).toLocaleString() : '0'}
            subtitle="rejections / day (7d avg)"
            icon={<Clock className="h-4 w-4" />}
            status="neutral"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* By Source */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Rejections by Source (7d)</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(dedup.bySource).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No rejections yet</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(dedup.bySource)
                    .sort((a, b) => b[1] - a[1])
                    .map(([source, count]) => {
                      const pct = dedup.last7d > 0 ? Math.round((count / dedup.last7d) * 100) : 0
                      return (
                        <div key={source} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{source.replace(/_/g, ' ')}</span>
                            <span className="text-muted-foreground">
                              {count.toLocaleString()} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-primary/70 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Daily Rejections (14d)</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniBarChart data={dedup.trend.map((d) => d.rejections)} maxVal={dedupTrendMax} />
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span>{dedup.trend[0]?.date.slice(5)}</span>
                <span>{dedup.trend[dedup.trend.length - 1]?.date.slice(5)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========== ENRICHMENT SECTION ========== */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Enrichment
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Today"
            value={enrichment.today.toLocaleString()}
            subtitle="enrichments"
            icon={<Sparkles className="h-4 w-4" />}
            status="neutral"
          />
          <MetricCard
            title="Total (30d)"
            value={enrichment.total.toLocaleString()}
            subtitle="enrichments"
            icon={<Activity className="h-4 w-4" />}
            status="neutral"
          />
          <MetricCard
            title="Success Rate"
            value={`${(enrichment.successRate * 100).toFixed(1)}%`}
            subtitle={`${enrichment.success.toLocaleString()} successful`}
            icon={<CheckCircle2 className="h-4 w-4" />}
            status={
              enrichment.successRate > 0.7
                ? 'healthy'
                : enrichment.successRate > 0.5
                  ? 'warning'
                  : enrichment.total === 0
                    ? 'neutral'
                    : 'error'
            }
          />
          <MetricCard
            title="No Data"
            value={enrichment.noData.toLocaleString()}
            subtitle={
              enrichment.total > 0
                ? `${((enrichment.noData / enrichment.total) * 100).toFixed(1)}% of total`
                : 'no enrichments yet'
            }
            icon={<AlertTriangle className="h-4 w-4" />}
            status={
              enrichment.total > 0 && enrichment.noData / enrichment.total > 0.3
                ? 'warning'
                : 'neutral'
            }
          />
          <MetricCard
            title="Failed"
            value={enrichment.failed.toLocaleString()}
            subtitle={
              enrichment.total > 0
                ? `${((enrichment.failed / enrichment.total) * 100).toFixed(1)}% of total`
                : 'no enrichments yet'
            }
            icon={<AlertTriangle className="h-4 w-4" />}
            status={
              enrichment.total > 0 && enrichment.failed / enrichment.total > 0.1
                ? 'error'
                : 'neutral'
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Enrichment Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Daily Enrichments (14d)</CardTitle>
              <CardDescription>
                <span className="inline-flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500" /> Success
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> No data
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-red-500" /> Failed
                  </span>
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {enrichment.trend.map((day) => {
                  const total = day.success + day.no_data + day.failed
                  if (total === 0) {
                    return (
                      <div key={day.date} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-10 shrink-0">
                          {day.date.slice(5)}
                        </span>
                        <div className="flex-1 h-3 rounded-full bg-muted" />
                        <span className="text-[10px] text-muted-foreground w-6 text-right">0</span>
                      </div>
                    )
                  }
                  const sPct = (day.success / enrichTrendMax) * 100
                  const nPct = (day.no_data / enrichTrendMax) * 100
                  const fPct = (day.failed / enrichTrendMax) * 100
                  return (
                    <div key={day.date} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-10 shrink-0">
                        {day.date.slice(5)}
                      </span>
                      <div className="flex-1 flex h-3 rounded-full overflow-hidden bg-muted">
                        {day.success > 0 && (
                          <div
                            className="bg-green-500 transition-all"
                            style={{ width: `${sPct}%` }}
                          />
                        )}
                        {day.no_data > 0 && (
                          <div
                            className="bg-amber-500 transition-all"
                            style={{ width: `${nPct}%` }}
                          />
                        )}
                        {day.failed > 0 && (
                          <div
                            className="bg-red-500 transition-all"
                            style={{ width: `${fPct}%` }}
                          />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground w-6 text-right">
                        {total}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Workspaces */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Top Workspaces by Credits (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              {enrichment.topWorkspaces.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No enrichment activity yet
                </p>
              ) : (
                <div className="space-y-2">
                  {enrichment.topWorkspaces.map((ws, i) => (
                    <div
                      key={ws.workspace_id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground w-5">
                          #{i + 1}
                        </span>
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono text-xs truncate max-w-[140px]">
                          {ws.workspace_id.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span>{ws.count} enrichments</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {ws.credits} credits
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
