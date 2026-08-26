'use client'

import { useEffect, useState } from 'react'
import { FUNNEL_TRIAL_DAYS } from '@/lib/stripe/funnel-products'

/**
 * Countdown to the next weekly audience build.
 *
 * The deadline is REAL: `alAudienceRefresh` (src/inngest/functions/
 * al-audience-refresh.ts) runs on `cron: '0 8 * * 1'` — Mondays at 08:00 UTC.
 * This counts down to that job and rolls to the following Monday once it
 * passes, so the timer keeps cycling because the underlying cycle keeps
 * cycling — not because it was reset to manufacture urgency.
 *
 * If that cron ever changes, change REFRESH_DAY_UTC / REFRESH_HOUR_UTC with
 * it, or the banner starts lying.
 */

const REFRESH_DAY_UTC = 1 // Monday
const REFRESH_HOUR_UTC = 8

export function nextRefreshUtc(from: Date): Date {
  const next = new Date(
    Date.UTC(
      from.getUTCFullYear(),
      from.getUTCMonth(),
      from.getUTCDate(),
      REFRESH_HOUR_UTC,
      0,
      0,
      0
    )
  )
  // Advance to the next occurrence of the refresh weekday that is still ahead.
  while (next.getUTCDay() !== REFRESH_DAY_UTC || next.getTime() <= from.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1)
    next.setUTCHours(REFRESH_HOUR_UTC, 0, 0, 0)
  }
  return next
}

export interface Remaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function remainingUntil(target: Date, now: Date): Remaining {
  const ms = Math.max(0, target.getTime() - now.getTime())
  const totalSeconds = Math.floor(ms / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

export function AudienceCycleCountdown() {
  // Null until mounted: the server has no clock the client agrees with, and a
  // ticking value in SSR output guarantees a hydration mismatch.
  const [remaining, setRemaining] = useState<Remaining | null>(null)

  useEffect(() => {
    function tick() {
      const now = new Date()
      setRemaining(remainingUntil(nextRefreshUtc(now), now))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="sticky top-0 z-50 w-full bg-blue-600 text-white shadow-sm">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-2.5 sm:flex-row sm:justify-between sm:gap-4 sm:px-6">
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold leading-tight">
            Free {FUNNEL_TRIAL_DAYS}-day trial — $0 today, cancel any time
          </p>
          <p className="mt-0.5 text-[11px] leading-tight text-blue-100">
            Next audience build in
          </p>
        </div>

        <div
          className="flex items-center gap-1.5"
          aria-live="off"
          suppressHydrationWarning
        >
          {remaining ? (
            <>
              <TimeCell value={remaining.days} label="days" />
              <Separator />
              <TimeCell value={remaining.hours} label="hrs" />
              <Separator />
              <TimeCell value={remaining.minutes} label="min" />
              <Separator />
              <TimeCell value={remaining.seconds} label="sec" />
            </>
          ) : (
            // Same footprint as the live cells so the bar does not jump on hydrate.
            <span className="text-xs text-blue-100">&nbsp;</span>
          )}
        </div>
      </div>
    </div>
  )
}

function TimeCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[2.75rem] flex-col items-center rounded-md bg-white/15 px-2 py-1">
      <span className="text-base font-semibold tabular-nums leading-none text-white">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-0.5 text-[9px] uppercase tracking-wide text-blue-100">
        {label}
      </span>
    </div>
  )
}

function Separator() {
  return <span className="text-sm font-medium text-blue-200">:</span>
}
