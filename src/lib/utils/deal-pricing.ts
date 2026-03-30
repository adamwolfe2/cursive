// Deal Pricing Calculator — Pure function
// Extracted from DealCalculator for reuse in wizard + standalone calculator

import {
  OUTBOUND_TIERS,
  SERVICE_PACKAGES,
  BUNDLE_DISCOUNT,
  calculateInfraCost,
} from '@/app/admin/deal-calculator/pricing-config'
import type { DealState, DealPricing } from '@/types/onboarding-wizard'

export function calculateDealPricing(deal: DealState): DealPricing {
  const selectedTier = OUTBOUND_TIERS.find((t) => t.id === deal.outboundTierId) ?? null
  const selectedPkgs = SERVICE_PACKAGES.filter((p) => deal.selectedPackages.includes(p.id))

  // Infrastructure — custom tier spec takes priority, then manual override, then tier defaults
  const isCustomTier = deal.outboundTierId === 'custom'
  const domains = deal.useCustomInfra
    ? deal.customDomains
    : isCustomTier
    ? (deal.customTierDomains ?? 0)
    : (selectedTier?.domains ?? 0)
  const inboxes = deal.useCustomInfra
    ? deal.customInboxes
    : isCustomTier
    ? (deal.customTierInboxes ?? 0)
    : (selectedTier?.inboxes ?? 0)
  const infraCalc = calculateInfraCost(domains, inboxes, deal.domainCostPer, deal.inboxCostPer)
  // When actual vendor costs are entered, use them instead of per-unit estimates
  const hasDomainCost = deal.domainAnnualCost !== null && deal.domainAnnualCost !== undefined
  const hasInboxCost = deal.inboxMonthlyCost !== null && deal.inboxMonthlyCost !== undefined
  if (hasDomainCost || hasInboxCost) {
    const domainMonthly = hasDomainCost ? Math.round((deal.domainAnnualCost! / 12) * 100) / 100 : infraCalc.domainCostMonthly
    const inboxMonthly = hasInboxCost ? deal.inboxMonthlyCost! : infraCalc.inboxCostMonthly
    infraCalc.domainCostMonthly = domainMonthly
    infraCalc.inboxCostMonthly = inboxMonthly
    infraCalc.totalMonthly = Math.round((domainMonthly + inboxMonthly) * 100) / 100
    infraCalc.totalAnnual = Math.round(infraCalc.totalMonthly * 12 * 100) / 100
  }

  // Setup fees
  const outboundSetup = selectedTier?.setupFee ?? 0
  const packageSetup = selectedPkgs.reduce((sum, p) => sum + p.setupFee, 0)
  const totalSetup = deal.setupFeeOverride ?? (outboundSetup + packageSetup)

  // Recurring — respect per-package price overrides
  const outboundMonthly = selectedTier?.monthlyPrice ?? 0
  const packageMonthly = selectedPkgs.reduce((sum, p) => {
    const override = deal.packagePriceOverrides?.[p.id]
    return sum + (override !== undefined ? override : p.monthlyPrice)
  }, 0)
  let subtotalMonthly = outboundMonthly + packageMonthly

  // Bundle discount
  const hasPixel = deal.selectedPackages.includes('super_pixel')
  const hasOutbound = !!selectedTier
  let discountRate = 0
  if (hasPixel && hasOutbound) {
    discountRate += BUNDLE_DISCOUNT.pixel_plus_outbound
  }
  if (deal.selectedPackages.length >= 3) {
    discountRate += BUNDLE_DISCOUNT.three_plus_services
  }
  const discountAmount = Math.round(subtotalMonthly * discountRate)
  subtotalMonthly = subtotalMonthly - discountAmount

  const totalRecurring = deal.recurringOverride ?? subtotalMonthly
  const infraMonthly = infraCalc.totalMonthly
  const totalMonthlyClientPays = totalRecurring + infraMonthly

  // Cadence
  const cadenceMultiplier = deal.billingCadence === 'quarterly' ? 3 : deal.billingCadence === 'annual' ? 12 : 1
  const cadenceLabel = deal.billingCadence === 'quarterly' ? '/quarter' : deal.billingCadence === 'annual' ? '/year' : '/month'
  const cadencePayment = totalMonthlyClientPays * cadenceMultiplier

  // Annual
  const annualServiceCost = totalRecurring * 12
  const annualInfraCost = infraCalc.totalAnnual
  const annualTotal = annualServiceCost + annualInfraCost
  const firstYearTotal = totalSetup + annualTotal
  const domainUpfront = domains * deal.domainCostPer

  return {
    outboundSetup,
    packageSetup,
    totalSetup,
    outboundMonthly,
    packageMonthly,
    discountRate,
    discountAmount,
    subtotalMonthly: deal.recurringOverride ?? subtotalMonthly,
    totalRecurring,
    infraMonthly,
    totalMonthlyClientPays,
    cadenceMultiplier,
    cadenceLabel,
    cadencePayment,
    annualServiceCost,
    annualInfraCost,
    annualTotal,
    firstYearTotal,
    domainUpfront,
    domains,
    inboxes,
    domainCostMonthly: infraCalc.domainCostMonthly,
    domainCostAnnual: deal.domainAnnualCost ?? Math.round(infraCalc.domainCostMonthly * 12 * 100) / 100,
    inboxCostMonthly: infraCalc.inboxCostMonthly,
  }
}

// Format helpers
export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export function fmtCurrencyDecimal(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}
