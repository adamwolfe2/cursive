'use client'

import { Users, Zap, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/design-system'
import type { VisitorStats, VisitorLead } from './visitor-types'

// ─── Stat Card ─────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconClass,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  iconClass?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('p-2 rounded-lg', iconClass ?? 'bg-primary/10')}>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

// ─── Stats Cards Grid ──────────────────────────────────────

interface VisitorStatsCardsProps {
  stats: VisitorStats
  dateRange: string
  isLoading: boolean
  visitors: VisitorLead[]
}

export function VisitorStatsCards({ stats, dateRange, isLoading, visitors }: VisitorStatsCardsProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <>
          <StatCard
            icon={Users}
            label="Total Identified"
            value={(stats.total ?? 0).toLocaleString()}
            sub={`last ${dateRange} days`}
            iconClass="bg-blue-100"
          />
          <StatCard
            icon={TrendingUp}
            label="This Week"
            value={(stats.this_week ?? 0).toLocaleString()}
            sub="new visitors"
            iconClass="bg-emerald-100"
          />
          <StatCard
            icon={Zap}
            label="Enriched"
            value={(stats.enriched ?? 0).toLocaleString()}
            sub={`${stats.match_rate ?? 0}% match rate`}
            iconClass="bg-blue-100"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Intent Score"
            value={stats.avg_score ?? 0}
            sub="out of 100"
            iconClass="bg-amber-100"
          />
        </>
      </div>

      {/* Source breakdown */}
      {!isLoading && visitors.length > 0 && (() => {
        const pixelCount = visitors.filter((v) =>
          v.source?.includes('pixel') || v.source?.includes('audiencelab')
        ).length
        const audienceCount = visitors.length - pixelCount
        return (
          <div className="flex gap-4 text-xs text-zinc-500 pl-1">
            <span>From pixel: <strong className="text-zinc-700">{pixelCount}</strong></span>
            <span>From audience: <strong className="text-zinc-700">{audienceCount}</strong></span>
            <span className="text-zinc-400">(this page)</span>
          </div>
        )
      })()}
    </div>
  )
}
