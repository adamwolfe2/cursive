/**
 * Outbound Partner Commission Ramp — unit tests.
 * Pure logic from src/lib/affiliate/ramp.ts (no DB).
 */

import { describe, it, expect } from 'vitest'
import {
  rampRate,
  currentTier,
  nextTier,
  commissionForInvoice,
  RAMP_TIERS,
  MIN_RATE,
  MAX_RATE,
} from '@/lib/affiliate/ramp'

describe('rampRate', () => {
  it('starts at 15% for the first paying referral', () => {
    expect(rampRate(0)).toBe(15)
    expect(rampRate(1)).toBe(15)
    expect(rampRate(4)).toBe(15)
  })

  it('steps to 20/25/30/35/40 at 5/15/25/35/45', () => {
    expect(rampRate(5)).toBe(20)
    expect(rampRate(14)).toBe(20)
    expect(rampRate(15)).toBe(25)
    expect(rampRate(24)).toBe(25)
    expect(rampRate(25)).toBe(30)
    expect(rampRate(34)).toBe(30)
    expect(rampRate(35)).toBe(35)
    expect(rampRate(44)).toBe(35)
    expect(rampRate(45)).toBe(40)
    expect(rampRate(1000)).toBe(40)
  })

  it('never exceeds MAX_RATE or drops below MIN_RATE', () => {
    expect(MIN_RATE).toBe(15)
    expect(MAX_RATE).toBe(40)
    for (let n = 0; n <= 200; n++) {
      const r = rampRate(n)
      expect(r).toBeGreaterThanOrEqual(MIN_RATE)
      expect(r).toBeLessThanOrEqual(MAX_RATE)
    }
  })

  it('is monotonically non-decreasing', () => {
    let prev = 0
    for (let n = 0; n <= 60; n++) {
      const r = rampRate(n)
      expect(r).toBeGreaterThanOrEqual(prev)
      prev = r
    }
  })

  it('defends against bad input (negative / NaN / floats)', () => {
    expect(rampRate(-5)).toBe(15)
    expect(rampRate(Number.NaN)).toBe(15)
    expect(rampRate(4.9)).toBe(15) // floored to 4
    expect(rampRate(5.9)).toBe(20) // floored to 5
  })
})

describe('currentTier', () => {
  it('returns the right tier label/rate per count', () => {
    expect(currentTier(0).rate).toBe(15)
    expect(currentTier(5).label).toBe('Bronze')
    expect(currentTier(45).label).toBe('Elite')
    expect(currentTier(45).rate).toBe(40)
  })
})

describe('nextTier', () => {
  it('reports remaining referrals to the next rate', () => {
    expect(nextTier(0)).toEqual({ at: 5, rate: 20, remaining: 5, label: 'Bronze' })
    expect(nextTier(3)).toEqual({ at: 5, rate: 20, remaining: 2, label: 'Bronze' })
    expect(nextTier(14)).toEqual({ at: 15, rate: 25, remaining: 1, label: 'Silver' })
  })

  it('returns null at the max tier', () => {
    expect(nextTier(45)).toBeNull()
    expect(nextTier(99)).toBeNull()
  })
})

describe('commissionForInvoice', () => {
  it('applies the ramp rate and floors to whole cents', () => {
    // $247.00 invoice at 20% = $49.40 → 4940 cents
    expect(commissionForInvoice(24700, 5)).toBe(4940)
    // $97.00 at 15% = $14.55 → 1455 cents
    expect(commissionForInvoice(9700, 0)).toBe(1455)
    // $247.00 at 40% = $98.80 → 9880 cents
    expect(commissionForInvoice(24700, 45)).toBe(9880)
  })

  it('returns 0 for non-positive or invalid amounts', () => {
    expect(commissionForInvoice(0, 10)).toBe(0)
    expect(commissionForInvoice(-100, 10)).toBe(0)
    expect(commissionForInvoice(Number.NaN, 10)).toBe(0)
  })

  it('floors fractional cents (never over-pays)', () => {
    // 333 cents at 15% = 49.95 → floor 49
    expect(commissionForInvoice(333, 0)).toBe(49)
  })
})

describe('RAMP_TIERS integrity', () => {
  it('has 6 ascending tiers from 15% to 40%', () => {
    expect(RAMP_TIERS).toHaveLength(6)
    const rates = RAMP_TIERS.map((t) => t.rate)
    expect(rates).toEqual([15, 20, 25, 30, 35, 40])
    const mins = RAMP_TIERS.map((t) => t.minPaying)
    expect(mins).toEqual([0, 5, 15, 25, 35, 45])
  })
})
