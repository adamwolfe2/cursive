/**
 * Partner Commission Calculation Tests
 *
 * Tests calculateCommission() from src/lib/services/commission.service.ts.
 *
 * Commission structure:
 *   Base rate:             30% (COMMISSION_CONFIG.BASE_RATE)
 *   Fresh sale bonus:     +10% (sold within 7 days of lead creation)
 *   High verification:    +5%  (partner.verification_pass_rate >= 95%)
 *   Volume bonus:         +5%  (partner.bonus_commission_rate > 0)
 *   Cap:                  50%  (COMMISSION_CONFIG.MAX_RATE)
 *
 * All tests are pure unit tests — no DB calls.
 */

import { describe, it, expect } from 'vitest'
import {
  calculateCommission,
  calculatePayableDate,
  COMMISSION_CONFIG,
} from '@/lib/services/commission.service'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a lead created N days ago from a given sale date. */
function daysAgo(n: number, from: Date = new Date()): Date {
  const d = new Date(from)
  d.setDate(d.getDate() - n)
  return d
}

/** Partner with no bonuses active. */
const basePartner = {
  id: 'partner-base',
  verification_pass_rate: 0,
  bonus_commission_rate: 0,
  base_commission_rate: null, // falls back to COMMISSION_CONFIG.BASE_RATE
}

/** Partner with high verification rate (>= 95%). */
const highVerificationPartner = {
  ...basePartner,
  id: 'partner-hv',
  verification_pass_rate: 96,
}

/** Partner with bonus_commission_rate set (simulates volume bonus). */
const volumePartner = {
  ...basePartner,
  id: 'partner-vol',
  bonus_commission_rate: COMMISSION_CONFIG.VOLUME_BONUS,
}

/** Partner with all bonuses eligible. */
const premiumPartner = {
  id: 'partner-premium',
  verification_pass_rate: 97,
  bonus_commission_rate: COMMISSION_CONFIG.VOLUME_BONUS,
  base_commission_rate: null,
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('COMMISSION_CONFIG constants', () => {
  it('base rate is 30%', () => {
    expect(COMMISSION_CONFIG.BASE_RATE).toBe(0.30)
  })

  it('fresh sale bonus is 10%', () => {
    expect(COMMISSION_CONFIG.FRESH_SALE_BONUS).toBe(0.10)
  })

  it('high verification bonus is 5%', () => {
    expect(COMMISSION_CONFIG.HIGH_VERIFICATION_BONUS).toBe(0.05)
  })

  it('volume bonus is 5%', () => {
    expect(COMMISSION_CONFIG.VOLUME_BONUS).toBe(0.05)
  })

  it('max commission cap is 50%', () => {
    expect(COMMISSION_CONFIG.MAX_RATE).toBe(0.50)
  })

  it('fresh sale threshold is 7 days', () => {
    expect(COMMISSION_CONFIG.FRESH_SALE_DAYS).toBe(7)
  })

  it('high verification threshold is 95%', () => {
    expect(COMMISSION_CONFIG.HIGH_VERIFICATION_THRESHOLD).toBe(95)
  })

  it('holdback period is 14 days', () => {
    expect(COMMISSION_CONFIG.HOLDBACK_DAYS).toBe(14)
  })

  it('minimum payout is $50', () => {
    expect(COMMISSION_CONFIG.MIN_PAYOUT_AMOUNT).toBe(50)
  })
})

describe('Base commission (30%) — no bonuses', () => {
  const saleDate = new Date('2026-02-20T12:00:00Z')
  const leadCreatedAt = daysAgo(30, saleDate) // stale — no fresh bonus

  it('returns 30% rate with no bonuses active', () => {
    const r = calculateCommission({
      salePrice: 0.10,
      partner: basePartner,
      leadCreatedAt,
      saleDate,
    })
    expect(r.rate).toBe(0.30)
  })

  it('calculates correct amount: $0.10 * 30% = $0.03', () => {
    const r = calculateCommission({
      salePrice: 0.10,
      partner: basePartner,
      leadCreatedAt,
      saleDate,
    })
    expect(r.amount).toBeCloseTo(0.03, 4)
  })

  it('returns empty bonuses array when no bonuses apply', () => {
    const r = calculateCommission({
      salePrice: 0.10,
      partner: basePartner,
      leadCreatedAt,
      saleDate,
    })
    expect(r.bonuses).toHaveLength(0)
  })

  it('handles various lead prices correctly at 30%', () => {
    const prices = [0.05, 0.10, 0.15, 0.20, 0.25]
    for (const salePrice of prices) {
      const r = calculateCommission({ salePrice, partner: basePartner, leadCreatedAt, saleDate })
      expect(r.amount).toBeCloseTo(salePrice * 0.30, 4)
    }
  })

  it('uses partner.base_commission_rate when set instead of default BASE_RATE', () => {
    const customPartner = { ...basePartner, base_commission_rate: 0.25 }
    const r = calculateCommission({
      salePrice: 0.10,
      partner: customPartner,
      leadCreatedAt,
      saleDate,
    })
    // Custom base of 25% (no other bonuses since stale lead, 0 verify rate, 0 bonus rate)
    expect(r.rate).toBe(0.25)
    expect(r.amount).toBeCloseTo(0.025, 4)
  })
})

describe('Fresh sale bonus (+10%) — sold within 7 days', () => {
  const saleDate = new Date('2026-02-20T12:00:00Z')

  it('applies fresh sale bonus on day 0 (same day)', () => {
    const r = calculateCommission({
      salePrice: 0.10,
      partner: basePartner,
      leadCreatedAt: saleDate,
      saleDate,
    })
    expect(r.bonuses).toContain('fresh_sale')
    expect(r.rate).toBe(0.40) // 30% + 10%
  })

  it('applies fresh sale bonus at exactly 7 days', () => {
    const r = calculateCommission({
      salePrice: 0.10,
      partner: basePartner,
      leadCreatedAt: daysAgo(7, saleDate),
      saleDate,
    })
    expect(r.bonuses).toContain('fresh_sale')
  })

  it('does NOT apply fresh sale bonus at 8 days', () => {
    const r = calculateCommission({
      salePrice: 0.10,
      partner: basePartner,
      leadCreatedAt: daysAgo(8, saleDate),
      saleDate,
    })
    expect(r.bonuses).not.toContain('fresh_sale')
    expect(r.rate).toBe(0.30)
  })

  it('correct amount with fresh bonus: $0.20 * 40% = $0.08', () => {
    const r = calculateCommission({
      salePrice: 0.20,
      partner: basePartner,
      leadCreatedAt: daysAgo(3, saleDate),
      saleDate,
    })
    expect(r.rate).toBe(0.40)
    expect(r.amount).toBeCloseTo(0.08, 4)
  })
})

describe('High verification bonus (+5%) — >= 95%', () => {
  const saleDate = new Date('2026-02-20T12:00:00Z')
  const leadCreatedAt = daysAgo(30, saleDate)

  it('applies bonus at exactly 95% verification rate', () => {
    const partner = { ...basePartner, verification_pass_rate: 95 }
    const r = calculateCommission({ salePrice: 0.10, partner, leadCreatedAt, saleDate })
    expect(r.bonuses).toContain('high_verification')
    expect(r.rate).toBe(0.35) // 30% + 5%
  })

  it('applies bonus above 95%', () => {
    const r = calculateCommission({
      salePrice: 0.10,
      partner: highVerificationPartner,
      leadCreatedAt,
      saleDate,
    })
    expect(r.bonuses).toContain('high_verification')
    expect(r.rate).toBe(0.35)
  })

  it('does NOT apply bonus below 95%', () => {
    const partner = { ...basePartner, verification_pass_rate: 94.9 }
    const r = calculateCommission({ salePrice: 0.10, partner, leadCreatedAt, saleDate })
    expect(r.bonuses).not.toContain('high_verification')
  })

  it('does NOT apply bonus at 0%', () => {
    const r = calculateCommission({
      salePrice: 0.10,
      partner: basePartner,
      leadCreatedAt,
      saleDate,
    })
    expect(r.bonuses).not.toContain('high_verification')
  })

  it('correct amount with verification bonus: $0.10 * 35% = $0.035', () => {
    const r = calculateCommission({
      salePrice: 0.10,
      partner: highVerificationPartner,
      leadCreatedAt,
      saleDate,
    })
    expect(r.amount).toBeCloseTo(0.035, 4)
  })
})

describe('Volume bonus (+5%) — bonus_commission_rate > 0', () => {
  const saleDate = new Date('2026-02-20T12:00:00Z')
  const leadCreatedAt = daysAgo(30, saleDate)

  it('applies bonus when bonus_commission_rate is set', () => {
    const r = calculateCommission({
      salePrice: 0.10,
      partner: volumePartner,
      leadCreatedAt,
      saleDate,
    })
    expect(r.bonuses).toContain('volume')
    expect(r.rate).toBe(0.35) // 30% + 5%
  })

  it('does NOT apply bonus when bonus_commission_rate is 0', () => {
    const r = calculateCommission({
      salePrice: 0.10,
      partner: basePartner,
      leadCreatedAt,
      saleDate,
    })
    expect(r.bonuses).not.toContain('volume')
  })

  it('correct amount with volume bonus: $0.10 * 35% = $0.035', () => {
    const r = calculateCommission({
      salePrice: 0.10,
      partner: volumePartner,
      leadCreatedAt,
      saleDate,
    })
    expect(r.amount).toBeCloseTo(0.035, 4)
  })
})

describe('Commission cap (50%)', () => {
  const saleDate = new Date('2026-02-20T12:00:00Z')
  const freshLeadCreatedAt = daysAgo(1, saleDate) // fresh

  it('caps total commission at 50% with all bonuses', () => {
    const r = calculateCommission({
      salePrice: 0.10,
      partner: premiumPartner, // 30% + 10% fresh + 5% verify + 5% volume = 50%
      leadCreatedAt: freshLeadCreatedAt,
      saleDate,
    })
    expect(r.rate).toBe(0.50)
    expect(r.bonuses).toContain('fresh_sale')
    expect(r.bonuses).toContain('high_verification')
    expect(r.bonuses).toContain('volume')
  })

  it('does not exceed 50% even with a high bonus_commission_rate', () => {
    const overPartner = {
      id: 'partner-over',
      verification_pass_rate: 99,
      bonus_commission_rate: 0.25, // 25% volume bonus
      base_commission_rate: null,
    }
    const r = calculateCommission({
      salePrice: 1.00,
      partner: overPartner,
      leadCreatedAt: freshLeadCreatedAt,
      saleDate,
    })
    expect(r.rate).toBeLessThanOrEqual(0.50)
    expect(r.amount).toBeLessThanOrEqual(0.50)
  })

  it('calculates correct capped amount: $0.20 * 50% = $0.10', () => {
    const r = calculateCommission({
      salePrice: 0.20,
      partner: premiumPartner,
      leadCreatedAt: freshLeadCreatedAt,
      saleDate,
    })
    expect(r.rate).toBe(0.50)
    expect(r.amount).toBeCloseTo(0.10, 4)
  })

  it('amount rounds to 4 decimal places', () => {
    const r = calculateCommission({
      salePrice: 0.0333,
      partner: basePartner,
      leadCreatedAt: daysAgo(30, saleDate),
      saleDate,
    })
    // $0.0333 * 30% = $0.00999 → rounded to 4 decimals: 0.0100
    const decimals = r.amount.toString().split('.')[1]?.length ?? 0
    expect(decimals).toBeLessThanOrEqual(4)
  })
})

describe('Edge cases', () => {
  const saleDate = new Date('2026-02-20T12:00:00Z')

  it('handles $0 lead price (0 leads / fractional)', () => {
    const r = calculateCommission({
      salePrice: 0,
      partner: premiumPartner,
      leadCreatedAt: daysAgo(1, saleDate),
      saleDate,
    })
    expect(r.amount).toBe(0)
  })

  it('handles very small fractional price (sub-cent)', () => {
    const r = calculateCommission({
      salePrice: 0.001,
      partner: basePartner,
      leadCreatedAt: daysAgo(30, saleDate),
      saleDate,
    })
    // $0.001 * 30% = $0.0003
    expect(r.amount).toBeCloseTo(0.0003, 4)
  })

  it('saleDate defaults to now when not provided', () => {
    // If lead was created 100 days ago and we omit saleDate, fresh bonus should NOT apply
    const oldLead = daysAgo(100)
    const r = calculateCommission({
      salePrice: 0.10,
      partner: basePartner,
      leadCreatedAt: oldLead,
      // saleDate omitted — defaults to new Date() inside the function
    })
    expect(r.bonuses).not.toContain('fresh_sale')
    expect(r.rate).toBe(0.30)
  })

  it('returns a CommissionCalculation shape with rate, amount, bonuses', () => {
    const r = calculateCommission({
      salePrice: 0.10,
      partner: basePartner,
      leadCreatedAt: daysAgo(30, saleDate),
      saleDate,
    })
    expect(typeof r.rate).toBe('number')
    expect(typeof r.amount).toBe('number')
    expect(Array.isArray(r.bonuses)).toBe(true)
  })
})

describe('calculatePayableDate', () => {
  it('returns a date 14 days in the future by default', () => {
    const before = new Date()
    const payable = calculatePayableDate()
    const after = new Date()

    const expectedMin = new Date(before)
    expectedMin.setDate(expectedMin.getDate() + 14)
    const expectedMax = new Date(after)
    expectedMax.setDate(expectedMax.getDate() + 14)

    expect(payable.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime() - 1000)
    expect(payable.getTime()).toBeLessThanOrEqual(expectedMax.getTime() + 1000)
  })

  it('returns a date 14 days after the provided saleDate', () => {
    const saleDate = new Date('2026-01-01T00:00:00Z')
    const payable = calculatePayableDate(saleDate)
    const expected = new Date('2026-01-15T00:00:00Z')
    expect(payable.toISOString().slice(0, 10)).toBe(expected.toISOString().slice(0, 10))
  })
})
