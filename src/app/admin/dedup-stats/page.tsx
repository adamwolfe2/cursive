'use client'

/**
 * Admin Dedup Stats Page
 * Shows 30-day deduplication statistics: top workspaces, rejection reasons, sources, daily trend
 */

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Filter, TrendingUp, Users, RefreshCw, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DedupStatsData {
  total_rejections: number
  period_days: number
  by_workspace: Array<{ workspace_id: string; workspace_name: string | null; total: number }>
  by_reason: Array<{ rejection_reason: string; total: number }>
  by_source: Array<{ source: string | null; total: number }>
  daily_trend: Array<{ day: string; total: number }>
}

const reasonLabels: Record<string, string> = {
  duplicate_email: 'Duplicate Email',
  duplicate_phone: 'Duplicate Phone',
  duplicate_name_company: 'Duplicate Name+Company',
  low_quality: 'Low Quality Score',
  invalid_email: 'Invalid Email',
  blacklisted: 'Blacklisted',
  workspace_duplicate: 'Workspace Duplicate',
}

const sourceColors: Record<string, string> = {
  audiencelab: 'bg-indigo-100 text-indigo-700',
  daily_generation: 'bg-blue-100 text-blue-700',
  marketplace: 'bg-purple-100 text-purple-700',
  manual: 'bg-zinc-100 text-zinc-700',
  import: 'bg-amber-100 text-amber-700',
  '(unknown)': 'bg-zinc-100 text-zinc-500',
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-zinc-900">{value.toLocaleString()}</p>
            {subtitle && <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>}
          </div>
          <div className="text-zinc-400">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DedupStatsPage() {
  const {
    data: statsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'dedup-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/dedup-stats')
      if (!res.ok) throw new Error('Failed to fetch dedup stats')
      const json = await res.json()
      return json.data as DedupStatsData
    },
    staleTime: 5 * 60 * 1000,
  })

  const peakDay = statsData?.daily_trend.reduce(
    (max, d) => (d.total > max.total ? d : max),
    { day: '', total: 0 }
  )

  const dailyAvg = statsData
    ? Math.round(statsData.total_rejections / Math.max(statsData.daily_trend.length, 1))
    : 0

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Deduplication Stats</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Last 30 days · Lead rejection analysis across all workspaces
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load dedup stats. Ensure you have admin access.
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title="Total Rejections"
              value={statsData?.total_rejections ?? 0}
              subtitle="Last 30 days"
              icon={<Filter className="h-5 w-5" />}
            />
            <StatCard
              title="Daily Average"
              value={dailyAvg}
              subtitle="Rejections per day"
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              title="Workspaces Affected"
              value={statsData?.by_workspace.length ?? 0}
              subtitle="Unique workspaces"
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              title="Peak Day"
              value={peakDay?.total ?? 0}
              subtitle={peakDay?.day || '—'}
              icon={<Activity className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Rejection Reasons */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rejection Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : statsData?.by_reason.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">No rejections in this period</p>
            ) : (
              <div className="space-y-2">
                {statsData?.by_reason.map((item) => {
                  const pct = Math.round((item.total / (statsData.total_rejections || 1)) * 100)
                  return (
                    <div key={item.rejection_reason}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-zinc-700">
                          {reasonLabels[item.rejection_reason] ?? item.rejection_reason}
                        </span>
                        <span className="text-sm font-semibold text-zinc-900">
                          {item.total.toLocaleString()} <span className="text-zinc-400 font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-100">
                        <div
                          className="h-1.5 rounded-full bg-primary"
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

        {/* By Source */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rejections by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : statsData?.by_source.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">No data</p>
            ) : (
              <div className="space-y-3">
                {statsData?.by_source.map((item) => {
                  const src = item.source ?? '(unknown)'
                  const pct = Math.round((item.total / (statsData.total_rejections || 1)) * 100)
                  const colorClass = sourceColors[src] ?? 'bg-zinc-100 text-zinc-700'
                  return (
                    <div key={src} className="flex items-center justify-between">
                      <Badge className={`text-xs ${colorClass} border-0`}>
                        {src}
                      </Badge>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 rounded-full bg-zinc-100">
                          <div
                            className="h-1.5 rounded-full bg-zinc-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-zinc-900 w-12 text-right">
                          {item.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daily Rejection Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="flex items-end gap-1 h-24">
              {statsData?.daily_trend.map((item) => {
                const maxVal = Math.max(...(statsData.daily_trend.map((d) => d.total)), 1)
                const height = Math.max((item.total / maxVal) * 100, 4)
                return (
                  <div
                    key={item.day}
                    className="flex-1 relative group"
                    title={`${item.day}: ${item.total} rejections`}
                  >
                    <div
                      className="w-full rounded-sm bg-primary/70 hover:bg-primary transition-colors cursor-pointer"
                      style={{ height: `${height}%` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                      <div className="bg-zinc-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        {item.day}: {item.total}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="flex justify-between text-xs text-zinc-400 mt-2">
            <span>{statsData?.daily_trend[0]?.day ?? ''}</span>
            <span>{statsData?.daily_trend?.[statsData.daily_trend.length - 1]?.day ?? ''}</span>
          </div>
        </CardContent>
      </Card>

      {/* Top Workspaces */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top 10 Workspaces by Rejections</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : statsData?.by_workspace.length === 0 ? (
            <p className="text-sm text-zinc-400 py-4 text-center">No data</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left py-2 text-zinc-500 font-medium">#</th>
                    <th className="text-left py-2 text-zinc-500 font-medium">Workspace</th>
                    <th className="text-left py-2 text-zinc-500 font-medium">ID</th>
                    <th className="text-right py-2 text-zinc-500 font-medium">Rejections</th>
                    <th className="text-right py-2 text-zinc-500 font-medium">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {statsData?.by_workspace.map((ws, idx) => {
                    const pct = statsData.total_rejections
                      ? ((ws.total / statsData.total_rejections) * 100).toFixed(1)
                      : '0'
                    return (
                      <tr key={ws.workspace_id} className="border-b border-zinc-50 hover:bg-zinc-50">
                        <td className="py-2.5 text-zinc-400">{idx + 1}</td>
                        <td className="py-2.5 font-medium text-zinc-900">
                          {ws.workspace_name ?? <span className="text-zinc-400 italic">Unnamed</span>}
                        </td>
                        <td className="py-2.5 font-mono text-xs text-zinc-400">
                          {ws.workspace_id.slice(0, 8)}…
                        </td>
                        <td className="py-2.5 text-right font-semibold text-zinc-900">
                          {ws.total.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right text-zinc-500">{pct}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
