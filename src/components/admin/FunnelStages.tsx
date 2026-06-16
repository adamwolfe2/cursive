'use client'

import {
  Eye,
  Calculator,
  CalendarCheck,
  CreditCard,
  Code2,
  UserCheck,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import type { LaunchFunnelStage } from '@/lib/funnel/launch-funnel'

const BRAND_BLUE = '#007AFF'

const STAGE_ICONS: Record<string, LucideIcon> = {
  traffic: Eye,
  estimate: Calculator,
  booked: CalendarCheck,
  bought: CreditCard,
  installed: Code2,
  first_visitor: UserCheck,
  renewed: RefreshCw,
}

interface FunnelStagesProps {
  stages: LaunchFunnelStage[]
}

const numberFmt = new Intl.NumberFormat('en-US')

/** Conversion vs the previous stage, or null when not computable. */
function stepConversion(
  current: number | null,
  previous: number | null
): number | null {
  if (current === null || previous === null || previous === 0) return null
  return (current / previous) * 100
}

/** % of total traffic (the first stage with a real count). */
function ofTotal(count: number | null, total: number | null): number | null {
  if (count === null || total === null || total === 0) return null
  return (count / total) * 100
}

export default function FunnelStages({ stages }: FunnelStagesProps) {
  // Baseline = first stage that has a usable count (Traffic, else first non-null).
  const baseline =
    stages.find((s) => s.count !== null && s.count > 0)?.count ?? null
  const maxCount = Math.max(
    1,
    ...stages.map((s) => (s.count === null ? 0 : s.count))
  )

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const Icon = STAGE_ICONS[stage.key] ?? Eye
        const prev = i > 0 ? stages[i - 1].count : null
        const conv = stepConversion(stage.count, prev)
        const pctTotal = ofTotal(stage.count, baseline)
        const widthPct =
          stage.count === null ? 0 : Math.max((stage.count / maxCount) * 100, 1.5)

        return (
          <div
            key={stage.key}
            className="bg-white border border-zinc-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <Icon className="h-4 w-4" style={{ color: BRAND_BLUE }} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-zinc-400">
                      {i + 1}
                    </span>
                    <span className="text-[14px] font-medium text-zinc-900">
                      {stage.label}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-zinc-900 tabular-nums">
                    {stage.count === null ? '—' : numberFmt.format(stage.count)}
                  </span>
                </div>

                {/* Proportional bar */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: BRAND_BLUE,
                    }}
                  />
                </div>

                {/* Meta row */}
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="truncate" title={stage.source}>
                    {stage.note ? (
                      <span className="text-amber-600">{stage.note}</span>
                    ) : (
                      stage.source
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-3 tabular-nums">
                    {pctTotal !== null && (
                      <span>{pctTotal.toFixed(1)}% of traffic</span>
                    )}
                    {conv !== null && i > 0 && (
                      <span className="font-medium text-blue-600">
                        {conv.toFixed(1)}% step
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
