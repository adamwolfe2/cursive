'use client'

import { useEffect, useState } from 'react'

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
    <div className="mx-auto mb-10 max-w-2xl rounded-xl border border-gray-200 bg-white px-5 py-4">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold text-gray-900">
            Next audience build
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            We rebuild every active account&apos;s buyer list every Monday.
            Your pixel starts identifying visitors the moment you install it.
          </p>
        </div>

        <div
          className="flex items-center gap-2"
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
            <span className="text-xs text-gray-400">Loading…</span>
          )}
        </div>
      </div>
    </div>
  )
}

function TimeCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[3rem] flex-col items-center rounded-lg bg-gray-50 px-2.5 py-1.5">
      <span className="text-lg font-semibold tabular-nums leading-none text-gray-900">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-0.5 text-[10px] uppercase tracking-wide text-gray-400">
        {label}
      </span>
    </div>
  )
}

function Separator() {
  return <span className="text-sm font-medium text-gray-300">:</span>
}
