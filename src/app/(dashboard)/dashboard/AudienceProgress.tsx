'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

/**
 * Audience build progress — replaces the indeterminate spinner with a milestone
 * bar so the buyer understands what's happening and doesn't feel dead in the
 * water while their audience assembles.
 *
 * Steps 1-2 are driven by real order timestamps (submitted / received). The
 * build stages (3-6) advance on a time estimate since submission and cap at 95%
 * until the audience is actually delivered, so the bar feels alive without
 * over-promising completion.
 */

const STEPS = [
  'Audience submitted',
  'Audience received',
  'Building your audience',
  'Cleaning + verifying emails',
  'Enriching contact details',
  'Syncing to your dashboard',
]

// Typical end-to-end build window. The bar fills toward 95% across this, then
// completes the moment delivery actually lands.
const EXPECTED_MS = 12 * 60 * 1000

interface Props {
  submittedAt?: string | null
  receivedAt?: string | null
  delivered: boolean
}

export function AudienceProgress({ submittedAt, receivedAt, delivered }: Props) {
  const [now, setNow] = useState<number>(() => (submittedAt ? new Date(submittedAt).getTime() : 0))

  useEffect(() => {
    if (delivered) return
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, 1500)
    return () => clearInterval(id)
  }, [delivered])

  const startMs = submittedAt ? new Date(submittedAt).getTime() : now
  const elapsed = Math.max(0, now - startMs)

  const pct = delivered ? 100 : Math.min(95, Math.round((elapsed / EXPECTED_MS) * 100))

  // Which steps are complete. 1 = submitted (real), 2 = received (real),
  // 3-6 = time-estimated across the build window.
  const completed = STEPS.map((_, i) => {
    if (delivered) return true
    if (i === 0) return !!submittedAt
    if (i === 1) return !!receivedAt
    // steps 2..5 (0-indexed) map across 0-95%
    const stepThreshold = ((i - 1) / (STEPS.length - 1)) * 95
    return pct >= stepThreshold + 12
  })
  const activeIndex = delivered ? STEPS.length : completed.findIndex((c) => !c)

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card px-5 py-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          {delivered ? 'Your audience is ready' : 'Building your audience'}
        </p>
        <span className="text-sm font-medium tabular-nums text-muted-foreground">{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Milestones */}
      <ol className="mt-4 grid gap-2.5">
        {STEPS.map((label, i) => {
          const done = completed[i]
          const active = i === activeIndex && !delivered
          return (
            <li key={label} className="flex items-center gap-2.5">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  done
                    ? 'bg-primary text-white'
                    : active
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span
                className={`text-sm ${
                  done ? 'text-muted-foreground' : active ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}
              >
                {label}
                {active && (
                  <span className="ml-2 inline-flex items-center gap-1 align-middle">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">in progress</span>
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ol>

      {!delivered && (
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Your identified website visitors start appearing the moment your pixel fires, while we
          finish assembling your verified audience. You can leave this page; we will email you the
          moment it is ready.
        </p>
      )}
    </div>
  )
}
