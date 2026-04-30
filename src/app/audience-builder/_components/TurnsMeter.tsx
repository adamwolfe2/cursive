'use client'

/**
 * Small pill showing "N / LIMIT messages" with a progress bar.
 * Turns amber when <= 2 remaining, red when at 0.
 */

interface TurnsMeterProps {
  used: number
  limit: number
  showDaily?: boolean
  dailyUsed?: number
  dailyLimit?: number
}

function pillClasses(remaining: number): string {
  if (remaining <= 0) {
    return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200'
  }
  if (remaining <= 2) {
    return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
  }
  return 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200'
}

function barColor(remaining: number): string {
  if (remaining <= 0) return 'bg-red-500'
  if (remaining <= 2) return 'bg-amber-500'
  return 'bg-blue-500'
}

export function TurnsMeter({
  used,
  limit,
  showDaily = false,
  dailyUsed = 0,
  dailyLimit = 0,
}: TurnsMeterProps) {
  const remaining = Math.max(0, limit - used)
  const pct = Math.min(100, Math.round((used / Math.max(1, limit)) * 100))

  return (
    <div className="flex items-center gap-2">
      <div
        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium ${pillClasses(
          remaining
        )}`}
      >
        <span className="tabular-nums">
          {used} / {limit} messages
          {showDaily && dailyLimit > 0 ? (
            <span className="ml-1 text-slate-400">
              · {dailyUsed}/{dailyLimit} today
            </span>
          ) : null}
        </span>
        <div className="h-1 w-10 overflow-hidden rounded-full bg-white/60">
          <div
            className={`h-full transition-all duration-300 ${barColor(remaining)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
