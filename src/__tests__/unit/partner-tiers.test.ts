/**
 * Partner Tier Service Unit Tests
 *
 * Tests the tier classification and commission logic in
 * src/lib/services/partner-tier.service.ts.
 *
 * Actual tier thresholds from the source:
 *   Bronze:  0 – 999  leads  →  30% commission
 *   Silver:  1000 – 4999 leads  →  35% commission
 *   Gold:    5000+ leads  →  40% commission
 *
 * NOTE: These thresholds differ from the task description (which listed
 * 0-499 / 500-1999 / 2000+). The tests below validate the ACTUAL code values.
 */

import { describe, it, expect } from 'vitest'
import {
  PARTNER_TIERS,
  getPartnerTier,
  getNextTier,
  getTierProgress,
} from '@/lib/services/partner-tier.service'

// ---------------------------------------------------------------------------
// Tier configuration shape
// ---------------------------------------------------------------------------

describe('PARTNER_TIERS configuration', () => {
  it('defines exactly 3 tiers', () => {
    expect(PARTNER_TIERS).toHaveLength(3)
  })

  it('tier names are Bronze, Silver, Gold in that order', () => {
    expect(PARTNER_TIERS[0].name).toBe('Bronze')
    expect(PARTNER_TIERS[1].name).toBe('Silver')
    expect(PARTNER_TIERS[2].name).toBe('Gold')
  })

  it('Bronze commission rate is 30%', () => {
    const bronze = PARTNER_TIERS.find((t) => t.name === 'Bronze')!
    expect(bronze.commissionRate).toBe(0.30)
  })

  it('Silver commission rate is 35%', () => {
    const silver = PARTNER_TIERS.find((t) => t.name === 'Silver')!
    expect(silver.commissionRate).toBe(0.35)
  })

  it('Gold commission rate is 40%', () => {
    const gold = PARTNER_TIERS.find((t) => t.name === 'Gold')!
    expect(gold.commissionRate).toBe(0.40)
  })

  it('Gold maxLeads is null (unlimited)', () => {
    const gold = PARTNER_TIERS.find((t) => t.name === 'Gold')!
    expect(gold.maxLeads).toBeNull()
  })

  it('commission rates increase from Bronze to Gold', () => {
    const rates = PARTNER_TIERS.map((t) => t.commissionRate)
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i]).toBeGreaterThan(rates[i - 1])
    }
  })
})

// ---------------------------------------------------------------------------
// getPartnerTier — tier classification
// ---------------------------------------------------------------------------

describe('getPartnerTier', () => {
  // Bronze range: 0 – 999
  it('classifies 0 leads as Bronze', () => {
    expect(getPartnerTier(0).name).toBe('Bronze')
  })

  it('classifies 1 lead as Bronze', () => {
    expect(getPartnerTier(1).name).toBe('Bronze')
  })

  it('classifies 499 leads as Bronze', () => {
    expect(getPartnerTier(499).name).toBe('Bronze')
  })

  it('classifies 999 leads as Bronze (maxLeads boundary)', () => {
    expect(getPartnerTier(999).name).toBe('Bronze')
  })

  // Silver range: 1000 – 4999
  it('classifies 1000 leads as Silver (lower boundary)', () => {
    expect(getPartnerTier(1000).name).toBe('Silver')
  })

  it('classifies 1500 leads as Silver', () => {
    expect(getPartnerTier(1500).name).toBe('Silver')
  })

  it('classifies 4999 leads as Silver (upper boundary)', () => {
    expect(getPartnerTier(4999).name).toBe('Silver')
  })

  // Gold range: 5000+
  it('classifies 5000 leads as Gold (lower boundary)', () => {
    expect(getPartnerTier(5000).name).toBe('Gold')
  })

  it('classifies 10000 leads as Gold', () => {
    expect(getPartnerTier(10000).name).toBe('Gold')
  })

  it('classifies 999999 leads as Gold', () => {
    expect(getPartnerTier(999999).name).toBe('Gold')
  })

  // Edge cases
  it('treats negative lead counts as 0 (Bronze)', () => {
    expect(getPartnerTier(-1).name).toBe('Bronze')
  })

  it('returns a tier with the correct commissionRate for Bronze', () => {
    expect(getPartnerTier(0).commissionRate).toBe(0.30)
  })

  it('returns a tier with the correct commissionRate for Silver', () => {
    expect(getPartnerTier(1000).commissionRate).toBe(0.35)
  })

  it('returns a tier with the correct commissionRate for Gold', () => {
    expect(getPartnerTier(5000).commissionRate).toBe(0.40)
  })
})

// ---------------------------------------------------------------------------
// Commission calculation
// ---------------------------------------------------------------------------

describe('Commission calculation using commissionRate', () => {
  it('$100 sale at Bronze (30%) yields $30 commission', () => {
    const tier = getPartnerTier(0)
    const commission = 100 * tier.commissionRate
    expect(commission).toBe(30)
  })

  it('$100 sale at Silver (35%) yields $35 commission', () => {
    const tier = getPartnerTier(1000)
    const commission = 100 * tier.commissionRate
    expect(commission).toBe(35)
  })

  it('$100 sale at Gold (40%) yields $40 commission', () => {
    const tier = getPartnerTier(5000)
    const commission = 100 * tier.commissionRate
    expect(commission).toBe(40)
  })

  it('$500 sale at Bronze (30%) yields $150 commission', () => {
    const tier = getPartnerTier(250)
    const commission = 500 * tier.commissionRate
    expect(commission).toBe(150)
  })

  it('$1000 sale at Gold (40%) yields $400 commission', () => {
    const tier = getPartnerTier(9999)
    const commission = 1000 * tier.commissionRate
    expect(commission).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// getNextTier
// ---------------------------------------------------------------------------

describe('getNextTier', () => {
  it('returns Silver as next tier when at Bronze', () => {
    const next = getNextTier(0)
    expect(next?.name).toBe('Silver')
  })

  it('returns Gold as next tier when at Silver', () => {
    const next = getNextTier(1000)
    expect(next?.name).toBe('Gold')
  })

  it('returns null when already at Gold (no tier above)', () => {
    const next = getNextTier(5000)
    expect(next).toBeNull()
  })

  it('returns null for very large lead counts (still Gold)', () => {
    const next = getNextTier(1_000_000)
    expect(next).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getTierProgress
// ---------------------------------------------------------------------------

describe('getTierProgress', () => {
  it('returns 100% progress and 0 leadsToNextTier for Gold tier', () => {
    const progress = getTierProgress(5000)
    expect(progress.progress).toBe(100)
    expect(progress.leadsToNextTier).toBe(0)
    expect(progress.nextTier).toBeNull()
  })

  it('returns the correct leadsToNextTier for Bronze at 0 leads', () => {
    const progress = getTierProgress(0)
    expect(progress.currentTier.name).toBe('Bronze')
    expect(progress.nextTier?.name).toBe('Silver')
    expect(progress.leadsToNextTier).toBe(1000) // 1000 - 0
  })

  it('returns the correct leadsToNextTier for Bronze at 500 leads', () => {
    const progress = getTierProgress(500)
    expect(progress.leadsToNextTier).toBe(500) // 1000 - 500
  })

  it('returns progress percentage between 0 and 100 (inclusive)', () => {
    const points = [0, 100, 500, 999, 1000, 2500, 4999, 5000]
    for (const leads of points) {
      const { progress } = getTierProgress(leads)
      expect(progress).toBeGreaterThanOrEqual(0)
      expect(progress).toBeLessThanOrEqual(100)
    }
  })

  it('currentTier matches getPartnerTier result', () => {
    const leads = 1500
    const { currentTier } = getTierProgress(leads)
    expect(currentTier.name).toBe(getPartnerTier(leads).name)
  })
})
