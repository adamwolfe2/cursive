'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

interface SdrAnalyticsData {
  period_days: number
  total_replies: number
  auto_sent: number
  needs_approval: number
  approved: number
  rejected: number
  positive_replies: number
  positive_rate: number
  auto_rate: number
  intent_breakdown: Record<string, number>
  method_breakdown: {
    keyword: number
    claude: number
    keyword_pct: number
    claude_pct: number
  }
}

const INTENT_LABELS: Record<string, string> = {
  interested: 'Interested',
  meeting_request: 'Meeting Request',
  positive: 'Positive',
  not_interested: 'Not Interested',
  out_of_office: 'Out of Office',
  unsubscribe: 'Unsubscribe',
  question: 'Question',
  referral: 'Referral',
  unknown: 'Unknown',
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string | number
  sub?: string
  highlight?: 'warning' | 'success'
}) {
  const bgClass =
    highlight === 'warning'
      ? 'bg-red-50 border-red-200'
      : highlight === 'success'
        ? 'bg-green-50 border-green-200'
        : 'bg-white'
  const labelClass =
    highlight === 'warning'
      ? 'text-red-500'
      : highlight === 'success'
        ? 'text-green-600'
        : 'text-zinc-500'
  const valueClass =
    highlight === 'warning'
      ? 'text-red-600'
      : highlight === 'success'
        ? 'text-green-700'
        : 'text-zinc-900'

  return (
    <div className={`border rounded-xl p-4 ${bgClass}`}>
      <p className={`text-xs mb-1 ${labelClass}`}>{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="border rounded-xl p-4 bg-white animate-pulse">
      <div className="h-3 w-24 bg-zinc-200 rounded mb-2" />
      <div className="h-8 w-16 bg-zinc-200 rounded" />
    </div>
  )
}

export default function SdrAnalyticsPage() {
  const { data, isLoading, isError } = useQuery<{ success: boolean; data: SdrAnalyticsData }>({
    queryKey: ['sdr-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/sdr/analytics')
      if (!res.ok) throw new Error('Failed to load SDR analytics')
      return res.json()
    },
    staleTime: 60_000,
  })

  const stats = data?.data

  const sortedIntents = stats
    ? Object.entries(stats.intent_breakdown).sort(([, a], [, b]) => b - a)
    : []

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
            <Link href="/inbox" className="hover:text-zinc-700 transition-colors">
              Inbox
            </Link>
            <span>/</span>
            <span className="text-zinc-700">Analytics</span>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900">AI SDR Performance</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Last 30 days</p>
        </div>
        <Link
          href="/inbox"
          className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          Back to Inbox
        </Link>
      </div>

      {isError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load analytics. Please refresh and try again.
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              label="Total Replies"
              value={stats?.total_replies ?? 0}
              sub="classified by AI"
            />
            <StatCard
              label="Auto-Sent"
              value={stats ? `${stats.auto_rate}%` : '—'}
              sub={`${stats?.auto_sent ?? 0} conversations`}
              highlight={stats && stats.auto_rate >= 50 ? 'success' : undefined}
            />
            <StatCard
              label="Positive Rate"
              value={stats ? `${stats.positive_rate}%` : '—'}
              sub={`${stats?.positive_replies ?? 0} positive replies`}
              highlight={stats && stats.positive_rate >= 20 ? 'success' : undefined}
            />
            <StatCard
              label="Needs Approval"
              value={stats?.needs_approval ?? 0}
              sub="pending review"
              highlight={stats && stats.needs_approval > 0 ? 'warning' : undefined}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Classification Method Split */}
        <div className="bg-white border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-700 mb-4">Classification Method</h2>
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-zinc-100 rounded w-full" />
              <div className="h-4 bg-zinc-100 rounded w-3/4" />
            </div>
          ) : stats ? (
            <div className="space-y-3">
              {/* Keyword bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-600">Keyword-matched</span>
                  <span className="font-medium text-zinc-800">
                    {stats.method_breakdown.keyword_pct}%
                    <span className="text-xs text-zinc-400 ml-1">
                      ({stats.method_breakdown.keyword})
                    </span>
                  </span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full transition-all"
                    style={{ width: `${stats.method_breakdown.keyword_pct}%` }}
                  />
                </div>
              </div>
              {/* Claude bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-600">Claude-classified</span>
                  <span className="font-medium text-zinc-800">
                    {stats.method_breakdown.claude_pct}%
                    <span className="text-xs text-zinc-400 ml-1">
                      ({stats.method_breakdown.claude})
                    </span>
                  </span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-400 rounded-full transition-all"
                    style={{ width: `${stats.method_breakdown.claude_pct}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-400 pt-1">
                {stats.total_replies} total classifications in last 30 days
              </p>
            </div>
          ) : null}
        </div>

        {/* Draft Outcomes */}
        <div className="bg-white border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-700 mb-4">Draft Outcomes</h2>
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-zinc-100 rounded w-full" />
              <div className="h-4 bg-zinc-100 rounded w-3/4" />
            </div>
          ) : stats ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">Approved</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-green-700">
                  <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
                  {stats.approved}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">Rejected</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-red-600">
                  <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />
                  {stats.rejected}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">Auto-sent (no review)</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-blue-600">
                  <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />
                  {stats.auto_sent}
                </span>
              </div>
              {stats.approved + stats.rejected > 0 && (
                <p className="text-xs text-zinc-400 pt-1 border-t">
                  {Math.round(
                    (stats.approved / (stats.approved + stats.rejected)) * 100
                  )}
                  % approval rate on reviewed drafts
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Intent Breakdown */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold text-zinc-700">Intent Breakdown</h2>
          <p className="text-xs text-zinc-400 mt-0.5">How AI classified incoming replies</p>
        </div>
        {isLoading ? (
          <div className="divide-y">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="px-5 py-3 animate-pulse flex justify-between">
                <div className="h-4 w-32 bg-zinc-100 rounded" />
                <div className="h-4 w-12 bg-zinc-100 rounded" />
              </div>
            ))}
          </div>
        ) : sortedIntents.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-zinc-400">
            No classification data in the last 30 days.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-zinc-100">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">
                  Intent
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">
                  Count
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">
                  Share
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase w-40">
                  Distribution
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {sortedIntents.map(([intent, count]) => {
                const total = stats?.total_replies ?? 1
                const pct = Math.round((count / total) * 100)
                const isPositive = ['interested', 'meeting_request', 'positive'].includes(intent)
                const isNegative = ['not_interested', 'unsubscribe'].includes(intent)
                const badgeClass = isPositive
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : isNegative
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                const barClass = isPositive
                  ? 'bg-green-400'
                  : isNegative
                    ? 'bg-red-400'
                    : 'bg-zinc-300'

                return (
                  <tr key={intent} className="hover:bg-zinc-50/50">
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full border ${badgeClass}`}
                      >
                        {INTENT_LABELS[intent] ?? intent}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-zinc-700 font-medium">{count}</td>
                    <td className="px-5 py-3 text-sm text-zinc-500">{pct}%</td>
                    <td className="px-5 py-3">
                      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden w-32">
                        <div
                          className={`h-full rounded-full ${barClass}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
