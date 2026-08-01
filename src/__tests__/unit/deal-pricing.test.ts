/**
 * Deal Pricing Calculator Unit Tests
 *
 * Tests calculateDealPricing() (sales-quote money math), fmtCurrency, and
 * fmtCurrencyDecimal against the real production module. No reference-model
 * reimplementation — every expected value below was hand-derived from the
 * actual OUTBOUND_TIERS / SERVICE_PACKAGES / BUNDLE_DISCOUNT constants in
 * src/app/admin/deal-calculator/pricing-config.ts.
 */

import { describe, it, expect } from 'vitest'
import { calculateDealPricing, fmtCurrency, fmtCurrencyDecimal } from '@/lib/utils/deal-pricing'
import { createInitialWizardState } from '@/types/onboarding-wizard'
import type { DealState } from '@/types/onboarding-wizard'

// Base deal = the wizard's real default state, so every test starts from a
// known-good, production-shaped object and only overrides what it needs.
function baseDeal(overrides: Partial<DealState> = {}): DealState {
  return {
    ...createInitialWizardState().deal,
    ...overrides,
  }
}

describe('calculateDealPricing', () => {
  // ==========================================================================
  // ZERO / EMPTY INPUTS
  // ==========================================================================
  describe('Zero/Empty Inputs', () => {
    it('returns all-zero pricing for a deal with no tier and no packages', () => {
      const pricing = calculateDealPricing(baseDeal())

      expect(pricing.outboundSetup).toBe(0)
      expect(pricing.packageSetup).toBe(0)
      expect(pricing.totalSetup).toBe(0)
      expect(pricing.outboundMonthly).toBe(0)
      expect(pricing.packageMonthly).toBe(0)
      expect(pricing.discountRate).toBe(0)
      expect(pricing.discountAmount).toBe(0)
      expect(pricing.totalRecurring).toBe(0)
      expect(pricing.infraMonthly).toBe(0)
      expect(pricing.totalMonthlyClientPays).toBe(0)
      expect(pricing.cadenceMultiplier).toBe(1)
      expect(pricing.cadenceLabel).toBe('/month')
      expect(pricing.cadencePayment).toBe(0)
      expect(pricing.annualTotal).toBe(0)
      expect(pricing.firstYearTotal).toBe(0)
      expect(pricing.domains).toBe(0)
      expect(pricing.inboxes).toBe(0)
      expect(pricing.domainUpfront).toBe(0)
    })

    it('handles an unrecognized outboundTierId as no tier selected', () => {
      const pricing = calculateDealPricing(baseDeal({ outboundTierId: 'not-a-real-tier' }))
      expect(pricing.outboundMonthly).toBe(0)
      expect(pricing.outboundSetup).toBe(0)
      expect(pricing.domains).toBe(0)
    })
  })

  // ==========================================================================
  // PRESET TIER (no packages) — sanity baseline for infra + setup math
  // ==========================================================================
  describe('Preset Tier Baseline', () => {
    it('prices a starter tier with default $1/domain, $1/inbox infra costs', () => {
      const pricing = calculateDealPricing(baseDeal({ outboundTierId: 'starter' }))

      expect(pricing.outboundSetup).toBe(500)
      expect(pricing.totalSetup).toBe(500)
      expect(pricing.outboundMonthly).toBe(1000)
      expect(pricing.domains).toBe(3)
      expect(pricing.inboxes).toBe(6)
      // domainCostMonthly = 3*1/12 = 0.25, inboxCostMonthly = 6*1 = 6 -> 6.25
      expect(pricing.infraMonthly).toBe(6.25)
      expect(pricing.totalMonthlyClientPays).toBe(1006.25)
      expect(pricing.annualServiceCost).toBe(12000)
      expect(pricing.annualInfraCost).toBe(75)
      expect(pricing.annualTotal).toBe(12075)
      expect(pricing.firstYearTotal).toBe(12575)
      expect(pricing.domainUpfront).toBe(3)
    })
  })

  // ==========================================================================
  // BUNDLE DISCOUNT STACKING
  // ==========================================================================
  describe('Bundle Discount Stacking', () => {
    it('applies the 10% pixel+outbound discount when super_pixel is bundled with an outbound tier', () => {
      const pricing = calculateDealPricing(
        baseDeal({ outboundTierId: 'starter', selectedPackages: ['super_pixel'] })
      )

      // subtotal = 1000 (outbound) + 500 (pixel) = 1500; 10% off = 150
      expect(pricing.discountRate).toBeCloseTo(0.1, 10)
      expect(pricing.discountAmount).toBe(150)
      expect(pricing.totalRecurring).toBe(1350)
      expect(pricing.totalSetup).toBe(750) // 500 outbound setup + 250 pixel setup
    })

    it('does NOT apply the pixel+outbound discount for pixel alone (no outbound tier)', () => {
      const pricing = calculateDealPricing(baseDeal({ selectedPackages: ['super_pixel'] }))
      expect(pricing.discountRate).toBe(0)
      expect(pricing.discountAmount).toBe(0)
      expect(pricing.totalRecurring).toBe(500)
    })

    it('does NOT apply the pixel+outbound discount for an outbound tier alone (no pixel)', () => {
      const pricing = calculateDealPricing(
        baseDeal({ outboundTierId: 'starter', selectedPackages: ['audience'] })
      )
      expect(pricing.discountRate).toBe(0)
      expect(pricing.discountAmount).toBe(0)
    })

    it('applies the 5% three-plus-services discount when 3+ packages are selected, no outbound tier', () => {
      const pricing = calculateDealPricing(
        baseDeal({ selectedPackages: ['audience', 'enrichment', 'paid_ads'] })
      )

      // subtotal = 750 + 500 + 500 = 1750; 5% off = round(87.5) = 88
      expect(pricing.discountRate).toBeCloseTo(0.05, 10)
      expect(pricing.discountAmount).toBe(88)
      expect(pricing.totalRecurring).toBe(1662)
      expect(pricing.totalSetup).toBe(250) // only paid_ads has a setup fee
    })

    it('stacks pixel+outbound (10%) and 3+ services (5%) into a 15% combined discount', () => {
      const pricing = calculateDealPricing(
        baseDeal({
          outboundTierId: 'starter',
          selectedPackages: ['super_pixel', 'audience', 'enrichment'],
        })
      )

      // subtotal = 1000 + 500 + 750 + 500 = 2750; 15% off = round(412.5) = 413
      expect(pricing.discountRate).toBeCloseTo(0.15, 10)
      expect(pricing.discountAmount).toBe(413)
      expect(pricing.totalRecurring).toBe(2337)
      expect(pricing.totalSetup).toBe(750) // 500 outbound + 250 pixel + 0 + 0
    })

    // SUSPECTED BUG: discountAmount is computed with Math.round(subtotal * rate)
    // which rounds to the nearest WHOLE DOLLAR, while every other money value
    // in this same module (calculateInfraCost, domain cost rounding, etc.)
    // preserves cents via Math.round(x * 100) / 100. For a $87.50 discount
    // this silently becomes $88 instead of $87.50 — a real (if small) money
    // discrepancy on quotes with non-round-dollar subtotals.
    it.todo(
      'discountAmount should preserve cents like every other money field in this module (currently rounds to whole dollars — see comment above calculateDealPricing discountAmount line)'
    )

    // SUSPECTED BUG: OUTBOUND_TIERS (pricing-config.ts) has no entry with
    // id 'custom', yet 'custom' is a real, UI-reachable outboundTierId
    // (set by DealConfigStep.tsx from PricingConfigurator). For any
    // custom-tier deal, `selectedTier` is therefore always null, so
    // `hasOutbound = !!selectedTier` is always false — meaning the 10%
    // pixel+outbound bundle discount can NEVER apply to a custom-tier deal
    // that also has super_pixel selected, even though it clearly qualifies.
    it.todo(
      'pixel+outbound bundle discount should apply for a custom-tier deal (outboundTierId="custom") with super_pixel selected — currently hasOutbound is always false for custom tier since selectedTier lookup always misses'
    )
  })

  // ==========================================================================
  // CUSTOM TIER VS PRESET TIER INFRA COST
  // ==========================================================================
  describe('Custom Tier vs Preset Tier Infra Cost', () => {
    it('uses customTierDomains/customTierInboxes (not preset tier defaults) when outboundTierId is "custom"', () => {
      const pricing = calculateDealPricing(
        baseDeal({
          outboundTierId: 'custom',
          customTierDomains: 8,
          customTierInboxes: 20,
          domainCostPer: 2,
          inboxCostPer: 3,
        })
      )

      expect(pricing.domains).toBe(8)
      expect(pricing.inboxes).toBe(20)
      // domainCostMonthly = 8*2/12 = 1.3333 -> 1.33, inboxCostMonthly = 20*3 = 60
      expect(pricing.infraMonthly).toBe(61.33)
      expect(pricing.annualInfraCost).toBe(736) // exact: 16 + 720
      expect(pricing.domainUpfront).toBe(16)
      // custom tier has no matching OUTBOUND_TIERS entry -> base service price is 0
      expect(pricing.outboundMonthly).toBe(0)
      expect(pricing.outboundSetup).toBe(0)
    })

    it('falls back to 0 domains/inboxes for a custom tier with no customTierDomains/Inboxes set', () => {
      const pricing = calculateDealPricing(baseDeal({ outboundTierId: 'custom' }))
      expect(pricing.domains).toBe(0)
      expect(pricing.inboxes).toBe(0)
      expect(pricing.infraMonthly).toBe(0)
    })

    it('uses preset tier domains/inboxes for a known tier id', () => {
      const pricing = calculateDealPricing(baseDeal({ outboundTierId: 'scale' }))
      expect(pricing.domains).toBe(10)
      expect(pricing.inboxes).toBe(30)
    })

    it('useCustomInfra overrides both preset tier AND custom-tier fields', () => {
      const pricing = calculateDealPricing(
        baseDeal({
          outboundTierId: 'starter', // preset tier would give domains:3, inboxes:6
          useCustomInfra: true,
          customDomains: 10,
          customInboxes: 25,
        })
      )
      expect(pricing.domains).toBe(10)
      expect(pricing.inboxes).toBe(25)
    })

    it('uses actual vendor costs (domainAnnualCost/inboxMonthlyCost) over per-unit estimates when provided', () => {
      const pricing = calculateDealPricing(
        baseDeal({
          outboundTierId: 'starter',
          domainAnnualCost: 401.81,
          inboxMonthlyCost: 336,
        })
      )
      expect(pricing.domainCostMonthly).toBe(33.48) // round(401.81/12 * 100)/100
      expect(pricing.domainCostAnnual).toBe(401.81)
      expect(pricing.inboxCostMonthly).toBe(336)
      expect(pricing.infraMonthly).toBe(369.48)
    })
  })

  // ==========================================================================
  // EXPLICIT PRICE OVERRIDES TAKE PRECEDENCE
  // ==========================================================================
  describe('Explicit Price Overrides', () => {
    it('setupFeeOverride replaces the computed outbound+package setup total', () => {
      const pricing = calculateDealPricing(baseDeal({ outboundTierId: 'starter', setupFeeOverride: 999 }))
      expect(pricing.outboundSetup).toBe(500) // component fields unaffected
      expect(pricing.totalSetup).toBe(999) // but the total is overridden
    })

    it('recurringOverride replaces totalRecurring and the reported subtotalMonthly', () => {
      const pricing = calculateDealPricing(baseDeal({ outboundTierId: 'starter', recurringOverride: 1234.56 }))
      expect(pricing.totalRecurring).toBe(1234.56)
      expect(pricing.subtotalMonthly).toBe(1234.56)
      expect(pricing.annualServiceCost).toBeCloseTo(14814.72, 5)
    })

    it('per-package price overrides replace a single package monthly price', () => {
      const pricing = calculateDealPricing(
        baseDeal({
          selectedPackages: ['audience'],
          packagePriceOverrides: { audience: 600 },
        })
      )
      expect(pricing.packageMonthly).toBe(600)
      expect(pricing.totalRecurring).toBe(600)
    })

    it('per-package overrides only affect the overridden package, others keep list price', () => {
      const pricing = calculateDealPricing(
        baseDeal({
          selectedPackages: ['audience', 'enrichment'],
          packagePriceOverrides: { audience: 600 },
        })
      )
      // 600 (overridden audience) + 500 (list enrichment) = 1100
      expect(pricing.packageMonthly).toBe(1100)
    })
  })

  // ==========================================================================
  // BILLING CADENCE MULTIPLIERS
  // ==========================================================================
  describe('Billing Cadence', () => {
    it('monthly cadence uses a 1x multiplier', () => {
      const pricing = calculateDealPricing(baseDeal({ outboundTierId: 'starter', billingCadence: 'monthly' }))
      expect(pricing.cadenceMultiplier).toBe(1)
      expect(pricing.cadenceLabel).toBe('/month')
      expect(pricing.cadencePayment).toBe(pricing.totalMonthlyClientPays)
    })

    it('quarterly cadence uses a 3x multiplier', () => {
      const pricing = calculateDealPricing(baseDeal({ outboundTierId: 'starter', billingCadence: 'quarterly' }))
      expect(pricing.cadenceMultiplier).toBe(3)
      expect(pricing.cadenceLabel).toBe('/quarter')
      expect(pricing.cadencePayment).toBe(1006.25 * 3)
    })

    it('annual cadence uses a 12x multiplier', () => {
      const pricing = calculateDealPricing(baseDeal({ outboundTierId: 'starter', billingCadence: 'annual' }))
      expect(pricing.cadenceMultiplier).toBe(12)
      expect(pricing.cadenceLabel).toBe('/year')
      expect(pricing.cadencePayment).toBe(1006.25 * 12)
    })
  })
})

// ============================================================================
// CURRENCY FORMATTERS
// ============================================================================
describe('fmtCurrency', () => {
  it('formats whole dollars with thousands separators and no cents', () => {
    expect(fmtCurrency(1000)).toBe('$1,000')
  })

  it('rounds a fractional value to the nearest whole dollar', () => {
    expect(fmtCurrency(1006.25)).toBe('$1,006')
  })

  it('formats zero', () => {
    expect(fmtCurrency(0)).toBe('$0')
  })

  it('formats negative values', () => {
    expect(fmtCurrency(-500)).toBe('-$500')
  })
})

describe('fmtCurrencyDecimal', () => {
  it('formats with exactly two decimal places', () => {
    expect(fmtCurrencyDecimal(1006.25)).toBe('$1,006.25')
  })

  it('rounds cents up on the third decimal (half-up-ish rounding)', () => {
    expect(fmtCurrencyDecimal(1234.567)).toBe('$1,234.57')
  })

  it('pads a single decimal digit to two', () => {
    expect(fmtCurrencyDecimal(1234.5)).toBe('$1,234.50')
  })

  it('formats zero with two decimal places', () => {
    expect(fmtCurrencyDecimal(0)).toBe('$0.00')
  })

  it('rounds a sub-cent value up to the nearest cent', () => {
    expect(fmtCurrencyDecimal(0.005)).toBe('$0.01')
  })
})
