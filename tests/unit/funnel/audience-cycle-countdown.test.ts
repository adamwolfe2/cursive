/**
 * The countdown only stays honest if it tracks the real cron
 * (al-audience-refresh, '0 8 * * 1' — Mondays 08:00 UTC). These pin the
 * boundary cases where an off-by-one would quietly show a wrong deadline.
 */

import { describe, it, expect } from 'vitest'
import {
  nextRefreshUtc,
  remainingUntil,
} from '@/app/get-leads/AudienceCycleCountdown'

const iso = (d: Date) => d.toISOString()

describe('nextRefreshUtc', () => {
  it('from midweek, targets the coming Monday 08:00 UTC', () => {
    // Wednesday 2026-08-26 20:00 UTC
    expect(iso(nextRefreshUtc(new Date('2026-08-26T20:00:00Z')))).toBe(
      '2026-08-31T08:00:00.000Z'
    )
  })

  it('on Monday before the build, targets that same morning', () => {
    expect(iso(nextRefreshUtc(new Date('2026-08-31T07:59:00Z')))).toBe(
      '2026-08-31T08:00:00.000Z'
    )
  })

  it('at exactly the build time, rolls to the following week', () => {
    // The job is running now — the next one a buyer can make is next Monday.
    expect(iso(nextRefreshUtc(new Date('2026-08-31T08:00:00Z')))).toBe(
      '2026-09-07T08:00:00.000Z'
    )
  })

  it('on Monday after the build, rolls to the following week', () => {
    expect(iso(nextRefreshUtc(new Date('2026-08-31T08:00:01Z')))).toBe(
      '2026-09-07T08:00:00.000Z'
    )
  })

  it('from Sunday night, targets the next morning', () => {
    expect(iso(nextRefreshUtc(new Date('2026-08-30T23:59:00Z')))).toBe(
      '2026-08-31T08:00:00.000Z'
    )
  })

  it('always returns a future date and always a Monday', () => {
    // Walk a full week hour by hour — no input may produce a past deadline.
    const start = new Date('2026-08-24T00:00:00Z').getTime()
    for (let h = 0; h < 24 * 8; h++) {
      const now = new Date(start + h * 3600_000)
      const next = nextRefreshUtc(now)
      expect(next.getTime()).toBeGreaterThan(now.getTime())
      expect(next.getUTCDay()).toBe(1)
      expect(next.getUTCHours()).toBe(8)
    }
  })
})

describe('remainingUntil', () => {
  it('breaks a span into days/hours/minutes/seconds', () => {
    const now = new Date('2026-08-26T20:00:00Z')
    const target = new Date('2026-08-31T08:00:00Z')
    expect(remainingUntil(target, now)).toEqual({
      days: 4,
      hours: 12,
      minutes: 0,
      seconds: 0,
    })
  })

  it('floors at zero rather than counting negative', () => {
    const now = new Date('2026-08-31T09:00:00Z')
    const target = new Date('2026-08-31T08:00:00Z')
    expect(remainingUntil(target, now)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    })
  })
})
