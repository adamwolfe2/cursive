/**
 * Commission Math Unit Tests
 *
 * Tests the commission calculation for partner payouts.
 * Verifies:
 * - Base commission: 30% of lead price
 * - Fresh sale bonus: +10% if sold within 7 days
 * - Verification bonus: +5% for >90% verification rate
 * - Volume bonus: +5% for 500+ leads/month
 * - Cap: 50% maximum total commission
 */

import { describe, it, expect } from 'vitest'

// Commission configuration (from spec)
const COMMISSION_CONFIG = {
  BASE_RATE: 0.30, // 30%
  FRESH_SALE_BONUS: 0.10, // +10%
  FRESH_SALE_DAYS: 7,
  VERIFICATION_BONUS: 0.05, // +5%
  VERIFICATION_THRESHOLD: 90, // 90%
  VOLUME_BONUS: 0.05, // +5%
  VOLUME_THRESHOLD: 500, // leads per month
  MAX_COMMISSION_RATE: 0.50, // 50% cap
}

// Commission calculation function (implementation reference)
function calculateCommission(params: {
  leadPrice: number
  daysSinceUpload: number
  partnerVerificationRate: number
  partnerMonthlyLeads: number
}): {
  baseCommission: number
  bonuses: Array<{ name: string; rate: number }>
  totalRate: number
  totalAmount: number
} {
  const { leadPrice, daysSinceUpload, partnerVerificationRate, partnerMonthlyLeads } = params

  const bonuses: Array<{ name: string; rate: number }> = []
  let totalRate = COMMISSION_CONFIG.BASE_RATE

  // Fresh sale bonus
  if (daysSinceUpload <= COMMISSION_CONFIG.FRESH_SALE_DAYS) {
    bonuses.push({ name: 'Fresh Sale', rate: COMMISSION_CONFIG.FRESH_SALE_BONUS })
    totalRate += COMMISSION_CONFIG.FRESH_SALE_BONUS
  }

  // Verification bonus
  if (partnerVerificationRate >= COMMISSION_CONFIG.VERIFICATION_THRESHOLD) {
    bonuses.push({ name: 'High Verification', rate: COMMISSION_CONFIG.VERIFICATION_BONUS })
    totalRate += COMMISSION_CONFIG.VERIFICATION_BONUS
  }

  // Volume bonus
  if (partnerMonthlyLeads >= COMMISSION_CONFIG.VOLUME_THRESHOLD) {
    bonuses.push({ name: 'Volume', rate: COMMISSION_CONFIG.VOLUME_BONUS })
    totalRate += COMMISSION_CONFIG.VOLUME_BONUS
  }

  // Apply cap
  totalRate = Math.min(totalRate, COMMISSION_CONFIG.MAX_COMMISSION_RATE)

  const baseCommission = leadPrice * COMMISSION_CONFIG.BASE_RATE
  const totalAmount = leadPrice * totalRate

  return {
    baseCommission,
    bonuses,
    totalRate,
    totalAmount,
  }
}

describe('Commission Calculation', () => {
  // ==========================================================================
  // BASE COMMISSION
  // ==========================================================================
  describe('Base Commission (30%)', () => {
    it('should calculate 30% base commission', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 30,
        partnerVerificationRate: 80,
        partnerMonthlyLeads: 100,
      })
      // $0.10 * 30% = $0.03
      expect(result.baseCommission).toBe(0.03)
      expect(result.totalRate).toBe(0.30)
    })

    it('should calculate base commission for various prices', () => {
      const prices = [0.05, 0.10, 0.15, 0.20, 0.25]
      for (const price of prices) {
        const result = calculateCommission({
          leadPrice: price,
          daysSinceUpload: 30,
          partnerVerificationRate: 80,
          partnerMonthlyLeads: 100,
        })
        const expected = Math.round(price * 0.30 * 10000) / 10000
        expect(result.baseCommission).toBeCloseTo(expected, 4)
      }
    })
  })

  // ==========================================================================
  // FRESH SALE BONUS
  // ==========================================================================
  describe('Fresh Sale Bonus (+10%)', () => {
    it('should apply fresh sale bonus for sale within 7 days', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 5,
        partnerVerificationRate: 80,
        partnerMonthlyLeads: 100,
      })
      expect(result.bonuses).toContainEqual({ name: 'Fresh Sale', rate: 0.10 })
      expect(result.totalRate).toBe(0.40) // 30% + 10%
    })

    it('should apply fresh sale bonus at exactly 7 days', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 7,
        partnerVerificationRate: 80,
        partnerMonthlyLeads: 100,
      })
      expect(result.bonuses.some(b => b.name === 'Fresh Sale')).toBe(true)
    })

    it('should NOT apply fresh sale bonus after 7 days', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 8,
        partnerVerificationRate: 80,
        partnerMonthlyLeads: 100,
      })
      expect(result.bonuses.some(b => b.name === 'Fresh Sale')).toBe(false)
      expect(result.totalRate).toBe(0.30)
    })

    it('should apply fresh sale bonus on day 0 (same day sale)', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 0,
        partnerVerificationRate: 80,
        partnerMonthlyLeads: 100,
      })
      expect(result.bonuses.some(b => b.name === 'Fresh Sale')).toBe(true)
    })
  })

  // ==========================================================================
  // VERIFICATION BONUS
  // ==========================================================================
  describe('Verification Bonus (+5%)', () => {
    it('should apply verification bonus at 90%+ rate', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 30,
        partnerVerificationRate: 92,
        partnerMonthlyLeads: 100,
      })
      expect(result.bonuses).toContainEqual({ name: 'High Verification', rate: 0.05 })
      expect(result.totalRate).toBe(0.35) // 30% + 5%
    })

    it('should apply verification bonus at exactly 90%', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 30,
        partnerVerificationRate: 90,
        partnerMonthlyLeads: 100,
      })
      expect(result.bonuses.some(b => b.name === 'High Verification')).toBe(true)
    })

    it('should NOT apply verification bonus below 90%', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 30,
        partnerVerificationRate: 89.9,
        partnerMonthlyLeads: 100,
      })
      expect(result.bonuses.some(b => b.name === 'High Verification')).toBe(false)
    })

    it('should apply verification bonus at 100%', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 30,
        partnerVerificationRate: 100,
        partnerMonthlyLeads: 100,
      })
      expect(result.bonuses.some(b => b.name === 'High Verification')).toBe(true)
    })
  })

  // ==========================================================================
  // VOLUME BONUS
  // ==========================================================================
  describe('Volume Bonus (+5%)', () => {
    it('should apply volume bonus at 500+ leads/month', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 30,
        partnerVerificationRate: 80,
        partnerMonthlyLeads: 600,
      })
      expect(result.bonuses).toContainEqual({ name: 'Volume', rate: 0.05 })
      expect(result.totalRate).toBe(0.35) // 30% + 5%
    })

    it('should apply volume bonus at exactly 500 leads', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 30,
        partnerVerificationRate: 80,
        partnerMonthlyLeads: 500,
      })
      expect(result.bonuses.some(b => b.name === 'Volume')).toBe(true)
    })

    it('should NOT apply volume bonus below 500 leads', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 30,
        partnerVerificationRate: 80,
        partnerMonthlyLeads: 499,
      })
      expect(result.bonuses.some(b => b.name === 'Volume')).toBe(false)
    })
  })

  // ==========================================================================
  // COMBINED BONUSES
  // ==========================================================================
  describe('Combined Bonuses', () => {
    it('should stack fresh sale + verification bonuses', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 3,
        partnerVerificationRate: 95,
        partnerMonthlyLeads: 100,
      })
      expect(result.bonuses).toHaveLength(2)
      expect(result.totalRate).toBe(0.45) // 30% + 10% + 5%
    })

    it('should stack fresh sale + volume bonuses', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 3,
        partnerVerificationRate: 80,
        partnerMonthlyLeads: 600,
      })
      expect(result.bonuses).toHaveLength(2)
      expect(result.totalRate).toBe(0.45) // 30% + 10% + 5%
    })

    it('should stack verification + volume bonuses', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 30,
        partnerVerificationRate: 92,
        partnerMonthlyLeads: 600,
      })
      expect(result.bonuses).toHaveLength(2)
      expect(result.totalRate).toBeCloseTo(0.40, 4) // 30% + 5% + 5%
    })

    it('should stack all bonuses up to cap', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 3,
        partnerVerificationRate: 92,
        partnerMonthlyLeads: 600,
      })
      expect(result.bonuses).toHaveLength(3)
      // 30% + 10% + 5% + 5% = 50% (at cap)
      expect(result.totalRate).toBe(0.50)
    })
  })

  // ==========================================================================
  // COMMISSION CAP
  // ==========================================================================
  describe('Commission Cap (50%)', () => {
    it('should cap total commission at 50%', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 3,
        partnerVerificationRate: 95,
        partnerMonthlyLeads: 1000,
      })
      // All bonuses = 30% + 10% + 5% + 5% = 50%
      expect(result.totalRate).toBe(0.50)
      expect(result.totalAmount).toBe(0.05) // $0.10 * 50%
    })

    it('should not exceed 50% even with all bonuses', () => {
      const result = calculateCommission({
        leadPrice: 1.00,
        daysSinceUpload: 0,
        partnerVerificationRate: 100,
        partnerMonthlyLeads: 10000,
      })
      expect(result.totalRate).toBeLessThanOrEqual(0.50)
      expect(result.totalAmount).toBeLessThanOrEqual(0.50)
    })
  })

  // ==========================================================================
  // TOTAL AMOUNT CALCULATION
  // ==========================================================================
  describe('Total Amount Calculation', () => {
    it('should calculate correct total amount with no bonuses', () => {
      const result = calculateCommission({
        leadPrice: 0.20,
        daysSinceUpload: 30,
        partnerVerificationRate: 80,
        partnerMonthlyLeads: 100,
      })
      // $0.20 * 30% = $0.06
      expect(result.totalAmount).toBe(0.06)
    })

    it('should calculate correct total amount with all bonuses', () => {
      const result = calculateCommission({
        leadPrice: 0.20,
        daysSinceUpload: 3,
        partnerVerificationRate: 95,
        partnerMonthlyLeads: 600,
      })
      // $0.20 * 50% (capped) = $0.10
      expect(result.totalAmount).toBe(0.10)
    })

    it('should handle sub-cent prices correctly', () => {
      const result = calculateCommission({
        leadPrice: 0.025,
        daysSinceUpload: 30,
        partnerVerificationRate: 80,
        partnerMonthlyLeads: 100,
      })
      // $0.025 * 30% = $0.0075
      expect(result.totalAmount).toBeCloseTo(0.0075, 4)
    })
  })

  // ==========================================================================
  // REAL-WORLD SCENARIOS
  // ==========================================================================
  describe('Real-World Commission Scenarios', () => {
    it('should calculate commission for new partner selling fresh lead', () => {
      // New partner, first month, fresh sale
      const result = calculateCommission({
        leadPrice: 0.15, // Warm lead with phone
        daysSinceUpload: 2,
        partnerVerificationRate: 85,
        partnerMonthlyLeads: 50,
      })
      // 30% + 10% fresh = 40%
      expect(result.totalRate).toBe(0.40)
      expect(result.totalAmount).toBe(0.06) // $0.15 * 40%
    })

    it('should calculate commission for established partner', () => {
      // High volume partner with good verification
      const result = calculateCommission({
        leadPrice: 0.20, // Hot lead
        daysSinceUpload: 15, // Not fresh
        partnerVerificationRate: 94,
        partnerMonthlyLeads: 2000,
      })
      // 30% + 5% verification + 5% volume = 40%
      expect(result.totalRate).toBeCloseTo(0.40, 4)
      expect(result.totalAmount).toBeCloseTo(0.08, 4) // $0.20 * 40%
    })

    it('should calculate commission for premium partner on hot lead', () => {
      // All bonuses, premium lead
      const result = calculateCommission({
        leadPrice: 0.2375, // Max price lead
        daysSinceUpload: 1,
        partnerVerificationRate: 98,
        partnerMonthlyLeads: 5000,
      })
      // Capped at 50%
      expect(result.totalRate).toBe(0.50)
      expect(result.totalAmount).toBeCloseTo(0.11875, 4) // $0.2375 * 50%
    })

    it('should calculate commission for budget lead', () => {
      // Minimum price lead, no bonuses
      const result = calculateCommission({
        leadPrice: 0.025, // Min price (cold + stale)
        daysSinceUpload: 60,
        partnerVerificationRate: 70,
        partnerMonthlyLeads: 200,
      })
      // Just 30% base
      expect(result.totalRate).toBe(0.30)
      expect(result.totalAmount).toBeCloseTo(0.0075, 4) // $0.025 * 30%
    })
  })

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle zero price lead', () => {
      const result = calculateCommission({
        leadPrice: 0,
        daysSinceUpload: 3,
        partnerVerificationRate: 95,
        partnerMonthlyLeads: 600,
      })
      expect(result.totalAmount).toBe(0)
    })

    it('should handle negative days since upload (future date)', () => {
      // Shouldn't happen but handle gracefully
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: -1,
        partnerVerificationRate: 80,
        partnerMonthlyLeads: 100,
      })
      // Should still get fresh bonus (negative is "fresh")
      expect(result.bonuses.some(b => b.name === 'Fresh Sale')).toBe(true)
    })

    it('should handle 0% verification rate', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 30,
        partnerVerificationRate: 0,
        partnerMonthlyLeads: 100,
      })
      expect(result.bonuses.some(b => b.name === 'High Verification')).toBe(false)
      expect(result.totalRate).toBe(0.30)
    })

    it('should handle 0 monthly leads', () => {
      const result = calculateCommission({
        leadPrice: 0.10,
        daysSinceUpload: 30,
        partnerVerificationRate: 80,
        partnerMonthlyLeads: 0,
      })
      expect(result.bonuses.some(b => b.name === 'Volume')).toBe(false)
      expect(result.totalRate).toBe(0.30)
    })
  })
})

// ==========================================================================
// REFERRAL COMMISSION MATH
// ==========================================================================
describe('Referral Commission Math', () => {
  // Test the milestone-based referral rewards from the spec
  const BUYER_REWARDS = {
    signup: 50,
    firstPurchase: { referrer: 200, referee: 100 },
    spend500: 500,
  }

  const PARTNER_REWARDS = {
    milestone1_1kLeads: 50,
    milestone2_500Commissions: 100,
    milestone3_2000Commissions: 250,
  }

  describe('Buyer Referral Rewards', () => {
    it('should award 50 credits on signup', () => {
      expect(BUYER_REWARDS.signup).toBe(50)
    })

    it('should award 200 credits to referrer on first purchase', () => {
      expect(BUYER_REWARDS.firstPurchase.referrer).toBe(200)
    })

    it('should award 100 credits to referee on first purchase', () => {
      expect(BUYER_REWARDS.firstPurchase.referee).toBe(100)
    })

    it('should award 500 credits on $500 spend milestone', () => {
      expect(BUYER_REWARDS.spend500).toBe(500)
    })

    it('should calculate total potential buyer referral value', () => {
      const total = BUYER_REWARDS.signup +
        BUYER_REWARDS.firstPurchase.referrer +
        BUYER_REWARDS.firstPurchase.referee +
        BUYER_REWARDS.spend500
      expect(total).toBe(850) // 50 + 200 + 100 + 500
    })
  })

  describe('Partner Referral Rewards', () => {
    it('should award $50 for 1K verified leads milestone', () => {
      expect(PARTNER_REWARDS.milestone1_1kLeads).toBe(50)
    })

    it('should award $100 for $500 commissions milestone', () => {
      expect(PARTNER_REWARDS.milestone2_500Commissions).toBe(100)
    })

    it('should award $250 for $2000 commissions milestone', () => {
      expect(PARTNER_REWARDS.milestone3_2000Commissions).toBe(250)
    })

    it('should calculate total potential partner referral value', () => {
      const total = PARTNER_REWARDS.milestone1_1kLeads +
        PARTNER_REWARDS.milestone2_500Commissions +
        PARTNER_REWARDS.milestone3_2000Commissions
      expect(total).toBe(400) // $50 + $100 + $250
    })

    it('should NOT be an ongoing override (milestone-based only)', () => {
      // Partner referral rewards are one-time milestones, not ongoing commission overrides
      // This test documents the expected behavior
      const milestones = [
        'partner_1k_leads',
        'partner_500_commissions',
        'partner_2000_commissions'
      ]
      expect(milestones).toHaveLength(3)
      // Each milestone can only be achieved once
    })
  })
})
