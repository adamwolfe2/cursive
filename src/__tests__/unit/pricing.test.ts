/**
 * Pricing Formula Unit Tests
 *
 * Tests the marketplace pricing calculation at boundary values.
 * Verifies:
 * - Base price: $0.05
 * - Intent multiplier: 1x (<34), 1.5x (34-66), 2.5x (67+)
 * - Freshness multiplier: 0.5x (<30), 1x (30-79), 1.5x (80+)
 * - Phone add-on: +$0.03
 * - Verified email: +$0.02 for valid only
 * - Catch-all: NO modifier (per spec)
 */

import { describe, it, expect } from 'vitest'
import { calculateMarketplacePrice } from '@/lib/services/lead-scoring.service'

describe('Marketplace Pricing', () => {
  // ==========================================================================
  // BASE PRICE
  // ==========================================================================
  describe('Base Price', () => {
    it('should use $0.05 as base price', () => {
      const price = calculateMarketplacePrice({
        intentScore: 33, // Cold tier (1x)
        freshnessScore: 50, // Medium (1x)
        hasPhone: false,
        verificationStatus: 'pending',
      })
      // Base $0.05 * 1x intent * 1x freshness = $0.05
      expect(price).toBe(0.05)
    })

    it('should allow custom base price', () => {
      const price = calculateMarketplacePrice({
        intentScore: 33,
        freshnessScore: 50,
        hasPhone: false,
        verificationStatus: 'pending',
        basePrice: 0.10,
      })
      expect(price).toBe(0.10)
    })
  })

  // ==========================================================================
  // INTENT MULTIPLIER BOUNDARIES
  // ==========================================================================
  describe('Intent Score Multiplier Boundaries', () => {
    // Cold tier: score < 34, multiplier = 1x
    it('should apply 1x multiplier for intent score 0 (cold)', () => {
      const price = calculateMarketplacePrice({
        intentScore: 0,
        freshnessScore: 50,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      expect(price).toBe(0.05)
    })

    it('should apply 1x multiplier for intent score 33 (cold boundary)', () => {
      const price = calculateMarketplacePrice({
        intentScore: 33,
        freshnessScore: 50,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      expect(price).toBe(0.05)
    })

    // Warm tier: score 34-66, multiplier = 1.5x
    it('should apply 1.5x multiplier for intent score 34 (warm boundary)', () => {
      const price = calculateMarketplacePrice({
        intentScore: 34,
        freshnessScore: 50,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      // $0.05 * 1.5 = $0.075
      expect(price).toBe(0.075)
    })

    it('should apply 1.5x multiplier for intent score 50 (warm mid)', () => {
      const price = calculateMarketplacePrice({
        intentScore: 50,
        freshnessScore: 50,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      expect(price).toBe(0.075)
    })

    it('should apply 1.5x multiplier for intent score 66 (warm upper boundary)', () => {
      const price = calculateMarketplacePrice({
        intentScore: 66,
        freshnessScore: 50,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      expect(price).toBe(0.075)
    })

    // Hot tier: score >= 67, multiplier = 2.5x
    it('should apply 2.5x multiplier for intent score 67 (hot boundary)', () => {
      const price = calculateMarketplacePrice({
        intentScore: 67,
        freshnessScore: 50,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      // $0.05 * 2.5 = $0.125
      expect(price).toBe(0.125)
    })

    it('should apply 2.5x multiplier for intent score 100 (max)', () => {
      const price = calculateMarketplacePrice({
        intentScore: 100,
        freshnessScore: 50,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      expect(price).toBe(0.125)
    })
  })

  // ==========================================================================
  // FRESHNESS MULTIPLIER BOUNDARIES
  // ==========================================================================
  describe('Freshness Score Multiplier Boundaries', () => {
    // Stale: score < 30, multiplier = 0.5x
    it('should apply 0.5x multiplier for freshness score 0 (stale)', () => {
      const price = calculateMarketplacePrice({
        intentScore: 33, // 1x intent
        freshnessScore: 0,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      // $0.05 * 1 * 0.5 = $0.025
      expect(price).toBe(0.025)
    })

    it('should apply 0.5x multiplier for freshness score 29 (stale boundary)', () => {
      const price = calculateMarketplacePrice({
        intentScore: 33,
        freshnessScore: 29,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      expect(price).toBe(0.025)
    })

    // Medium: score 30-79, multiplier = 1x
    it('should apply 1x multiplier for freshness score 30 (medium boundary)', () => {
      const price = calculateMarketplacePrice({
        intentScore: 33,
        freshnessScore: 30,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      expect(price).toBe(0.05)
    })

    it('should apply 1x multiplier for freshness score 79 (medium upper boundary)', () => {
      const price = calculateMarketplacePrice({
        intentScore: 33,
        freshnessScore: 79,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      expect(price).toBe(0.05)
    })

    // Fresh: score >= 80, multiplier = 1.5x
    it('should apply 1.5x multiplier for freshness score 80 (fresh boundary)', () => {
      const price = calculateMarketplacePrice({
        intentScore: 33,
        freshnessScore: 80,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      // $0.05 * 1 * 1.5 = $0.075
      expect(price).toBe(0.075)
    })

    it('should apply 1.5x multiplier for freshness score 100 (max fresh)', () => {
      const price = calculateMarketplacePrice({
        intentScore: 33,
        freshnessScore: 100,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      expect(price).toBe(0.075)
    })
  })

  // ==========================================================================
  // COMBINED MULTIPLIERS
  // ==========================================================================
  describe('Combined Intent + Freshness Multipliers', () => {
    it('should combine hot intent (2.5x) + fresh (1.5x)', () => {
      const price = calculateMarketplacePrice({
        intentScore: 80, // Hot
        freshnessScore: 90, // Fresh
        hasPhone: false,
        verificationStatus: 'pending',
      })
      // $0.05 * 2.5 * 1.5 = $0.1875
      expect(price).toBe(0.1875)
    })

    it('should combine cold intent (1x) + stale (0.5x)', () => {
      const price = calculateMarketplacePrice({
        intentScore: 20, // Cold
        freshnessScore: 20, // Stale
        hasPhone: false,
        verificationStatus: 'pending',
      })
      // $0.05 * 1 * 0.5 = $0.025
      expect(price).toBe(0.025)
    })

    it('should combine warm intent (1.5x) + fresh (1.5x)', () => {
      const price = calculateMarketplacePrice({
        intentScore: 50, // Warm
        freshnessScore: 85, // Fresh
        hasPhone: false,
        verificationStatus: 'pending',
      })
      // $0.05 * 1.5 * 1.5 = $0.1125
      expect(price).toBe(0.1125)
    })
  })

  // ==========================================================================
  // PHONE ADD-ON
  // ==========================================================================
  describe('Phone Number Add-on', () => {
    it('should add $0.03 for phone number', () => {
      const withPhone = calculateMarketplacePrice({
        intentScore: 33,
        freshnessScore: 50,
        hasPhone: true,
        verificationStatus: 'pending',
      })
      const withoutPhone = calculateMarketplacePrice({
        intentScore: 33,
        freshnessScore: 50,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      expect(withPhone - withoutPhone).toBe(0.03)
    })

    it('should add phone bonus to high-value leads', () => {
      const price = calculateMarketplacePrice({
        intentScore: 80, // 2.5x
        freshnessScore: 90, // 1.5x
        hasPhone: true,
        verificationStatus: 'pending',
      })
      // $0.05 * 2.5 * 1.5 + $0.03 = $0.2175
      expect(price).toBe(0.2175)
    })
  })

  // ==========================================================================
  // VERIFICATION STATUS ADD-ONS
  // ==========================================================================
  describe('Email Verification Add-ons', () => {
    it('should add $0.02 for valid verification', () => {
      const verified = calculateMarketplacePrice({
        intentScore: 33,
        freshnessScore: 50,
        hasPhone: false,
        verificationStatus: 'valid',
      })
      const unverified = calculateMarketplacePrice({
        intentScore: 33,
        freshnessScore: 50,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      expect(verified - unverified).toBeCloseTo(0.02, 4)
    })

    it('should NOT add/subtract for catch_all (per spec)', () => {
      const catchAll = calculateMarketplacePrice({
        intentScore: 33,
        freshnessScore: 50,
        hasPhone: false,
        verificationStatus: 'catch_all',
      })
      const pending = calculateMarketplacePrice({
        intentScore: 33,
        freshnessScore: 50,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      // catch_all should have NO modifier - same as pending
      expect(catchAll).toBe(pending)
    })

    it('should NOT add bonus for invalid', () => {
      const invalid = calculateMarketplacePrice({
        intentScore: 33,
        freshnessScore: 50,
        hasPhone: false,
        verificationStatus: 'invalid',
      })
      const pending = calculateMarketplacePrice({
        intentScore: 33,
        freshnessScore: 50,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      expect(invalid).toBe(pending)
    })

    it('should NOT add bonus for risky', () => {
      const risky = calculateMarketplacePrice({
        intentScore: 33,
        freshnessScore: 50,
        hasPhone: false,
        verificationStatus: 'risky',
      })
      const pending = calculateMarketplacePrice({
        intentScore: 33,
        freshnessScore: 50,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      expect(risky).toBe(pending)
    })
  })

  // ==========================================================================
  // MAXIMUM AND MINIMUM PRICES
  // ==========================================================================
  describe('Price Extremes', () => {
    it('should calculate minimum price (cold + stale + no extras)', () => {
      const minPrice = calculateMarketplacePrice({
        intentScore: 0,
        freshnessScore: 0,
        hasPhone: false,
        verificationStatus: 'pending',
      })
      // $0.05 * 1 * 0.5 = $0.025
      expect(minPrice).toBe(0.025)
    })

    it('should calculate maximum price (hot + fresh + phone + verified)', () => {
      const maxPrice = calculateMarketplacePrice({
        intentScore: 100,
        freshnessScore: 100,
        hasPhone: true,
        verificationStatus: 'valid',
      })
      // $0.05 * 2.5 * 1.5 + $0.03 + $0.02 = $0.2375
      expect(maxPrice).toBe(0.2375)
    })

    it('should round to 4 decimal places', () => {
      const price = calculateMarketplacePrice({
        intentScore: 50,
        freshnessScore: 50,
        hasPhone: true,
        verificationStatus: 'valid',
      })
      // Verify price has max 4 decimal places
      const decimalPlaces = (price.toString().split('.')[1] || '').length
      expect(decimalPlaces).toBeLessThanOrEqual(4)
    })
  })

  // ==========================================================================
  // REAL-WORLD PRICING SCENARIOS
  // ==========================================================================
  describe('Real-World Pricing Scenarios', () => {
    it('should price a hot, fresh lead with phone and verified email', () => {
      // Premium lead scenario
      const price = calculateMarketplacePrice({
        intentScore: 85, // Hot (C-Suite, large company)
        freshnessScore: 95, // Fresh (1 day old)
        hasPhone: true,
        verificationStatus: 'valid',
      })
      // $0.05 * 2.5 * 1.5 + $0.03 + $0.02 = $0.2375
      expect(price).toBe(0.2375)
    })

    it('should price a warm, recent lead with phone', () => {
      // Good quality lead scenario
      const price = calculateMarketplacePrice({
        intentScore: 55, // Warm (Manager level)
        freshnessScore: 60, // Recent (2 weeks old)
        hasPhone: true,
        verificationStatus: 'valid',
      })
      // $0.05 * 1.5 * 1 + $0.03 + $0.02 = $0.125
      expect(price).toBe(0.125)
    })

    it('should price a cold, stale lead without phone', () => {
      // Low quality lead scenario
      const price = calculateMarketplacePrice({
        intentScore: 25, // Cold (IC level, small company)
        freshnessScore: 20, // Stale (60+ days old, but above floor of 15)
        hasPhone: false,
        verificationStatus: 'catch_all',
      })
      // $0.05 * 1 * 0.5 = $0.025
      expect(price).toBe(0.025)
    })

    it('should price a catch-all email lead correctly (no penalty)', () => {
      // Catch-all should not be penalized per spec
      const catchAllPrice = calculateMarketplacePrice({
        intentScore: 50,
        freshnessScore: 50,
        hasPhone: true,
        verificationStatus: 'catch_all',
      })
      const validPrice = calculateMarketplacePrice({
        intentScore: 50,
        freshnessScore: 50,
        hasPhone: true,
        verificationStatus: 'valid',
      })
      // Catch-all should be $0.02 less (no valid bonus)
      expect(catchAllPrice).toBe(validPrice - 0.02)
    })
  })
})
