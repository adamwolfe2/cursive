'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Copy, Check, ChevronDown, ChevronRight, DollarSign, Mail, Globe, Inbox, Package, Calculator } from 'lucide-react'
import {
  OUTBOUND_TIERS,
  SERVICE_PACKAGES,
  INFRA_COSTS,
  BUNDLE_DISCOUNT,
  calculateInfraCost,
  type OutboundTier,
} from './pricing-config'

// ---------------------------------------------------------------------------
// Deal state
// ---------------------------------------------------------------------------

interface DealState {
  clientName: string
  outboundTierId: string | null
  selectedPackages: string[]
  customDomains: number
  customInboxes: number
  useCustomInfra: boolean
  domainCostPer: number
  inboxCostPer: number
  setupFeeOverride: number | null
  recurringOverride: number | null
  billingCadence: 'monthly' | 'quarterly' | 'annual'
  notes: string
}

const INITIAL_STATE: DealState = {
  clientName: '',
  outboundTierId: null,
  selectedPackages: [],
  customDomains: 0,
  customInboxes: 0,
  useCustomInfra: false,
  domainCostPer: INFRA_COSTS.domain.default,
  inboxCostPer: INFRA_COSTS.inbox.default,
  setupFeeOverride: null,
  recurringOverride: null,
  billingCadence: 'monthly',
  notes: '',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

function fmtDecimal(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DealCalculator() {
  const [deal, setDeal] = useState<DealState>(INITIAL_STATE)
  const [copied, setCopied] = useState(false)
  const [showInfraDetails, setShowInfraDetails] = useState(false)

  const update = useCallback(
    <K extends keyof DealState>(key: K, value: DealState[K]) => {
      setDeal((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const togglePackage = useCallback((pkgId: string) => {
    setDeal((prev) => ({
      ...prev,
      selectedPackages: prev.selectedPackages.includes(pkgId)
        ? prev.selectedPackages.filter((id) => id !== pkgId)
        : [...prev.selectedPackages, pkgId],
    }))
  }, [])

  // ---------------------------------------------------------------------------
  // Calculations
  // ---------------------------------------------------------------------------

  const selectedTier = useMemo(
    () => OUTBOUND_TIERS.find((t) => t.id === deal.outboundTierId) ?? null,
    [deal.outboundTierId]
  )

  const infraCalc = useMemo(() => {
    const domains = deal.useCustomInfra
      ? deal.customDomains
      : (selectedTier?.domains ?? 0)
    const inboxes = deal.useCustomInfra
      ? deal.customInboxes
      : (selectedTier?.inboxes ?? 0)
    return calculateInfraCost(domains, inboxes, deal.domainCostPer, deal.inboxCostPer)
  }, [deal.useCustomInfra, deal.customDomains, deal.customInboxes, deal.domainCostPer, deal.inboxCostPer, selectedTier])

  const selectedPkgs = useMemo(
    () => SERVICE_PACKAGES.filter((p) => deal.selectedPackages.includes(p.id)),
    [deal.selectedPackages]
  )

  const pricing = useMemo(() => {
    // Setup fees
    const outboundSetup = selectedTier?.setupFee ?? 0
    const packageSetup = selectedPkgs.reduce((sum, p) => sum + p.setupFee, 0)
    const totalSetup = deal.setupFeeOverride ?? (outboundSetup + packageSetup)

    // Recurring
    const outboundMonthly = selectedTier?.monthlyPrice ?? 0
    const packageMonthly = selectedPkgs.reduce((sum, p) => sum + p.monthlyPrice, 0)
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

    // Infrastructure (at-cost passthrough)
    const infraMonthly = infraCalc.totalMonthly

    // Total monthly client pays
    const totalMonthlyClientPays = totalRecurring + infraMonthly

    // Cadence multiplier
    const cadenceMultiplier = deal.billingCadence === 'quarterly' ? 3 : deal.billingCadence === 'annual' ? 12 : 1
    const cadenceLabel = deal.billingCadence === 'quarterly' ? '/quarter' : deal.billingCadence === 'annual' ? '/year' : '/month'
    const cadencePayment = totalMonthlyClientPays * cadenceMultiplier

    // Annual totals
    const annualServiceCost = totalRecurring * 12
    const annualInfraCost = infraCalc.totalAnnual
    const annualTotal = annualServiceCost + annualInfraCost
    const firstYearTotal = totalSetup + annualTotal

    // Domain cost upfront (annual)
    const domains = deal.useCustomInfra ? deal.customDomains : (selectedTier?.domains ?? 0)
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
      inboxes: deal.useCustomInfra ? deal.customInboxes : (selectedTier?.inboxes ?? 0),
    }
  }, [selectedTier, selectedPkgs, deal, infraCalc])

  // ---------------------------------------------------------------------------
  // Copy deal summary
  // ---------------------------------------------------------------------------

  const dealSummary = useMemo(() => {
    const lines: string[] = []
    lines.push(`CURSIVE AI — Deal Summary`)
    if (deal.clientName) lines.push(`Client: ${deal.clientName}`)
    lines.push(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`)
    lines.push('')

    lines.push('SERVICES:')
    if (selectedTier) {
      lines.push(`  Outbound: ${selectedTier.name} Tier — ${selectedTier.description}`)
    }
    for (const pkg of selectedPkgs) {
      lines.push(`  ${pkg.name} — ${pkg.description}`)
    }
    lines.push('')

    lines.push('PRICING:')
    lines.push(`  One-Time Setup Fee: ${fmt(pricing.totalSetup)}`)
    lines.push(`  Monthly Service Fee: ${fmt(pricing.totalRecurring)}`)
    if (pricing.discountAmount > 0) {
      lines.push(`    (includes ${Math.round(pricing.discountRate * 100)}% bundle discount: -${fmt(pricing.discountAmount)}/mo)`)
    }
    lines.push('')

    lines.push('INFRASTRUCTURE (at-cost):')
    lines.push(`  ${pricing.domains} sending domains x ${fmtDecimal(deal.domainCostPer)}/yr = ${fmtDecimal(pricing.domainUpfront)}/yr (${fmtDecimal(infraCalc.domainCostMonthly)}/mo)`)
    lines.push(`  ${pricing.inboxes} email inboxes x ${fmtDecimal(deal.inboxCostPer)}/mo = ${fmtDecimal(infraCalc.inboxCostMonthly)}/mo`)
    lines.push(`  Total Infrastructure: ${fmtDecimal(infraCalc.totalMonthly)}/mo`)
    lines.push('')

    lines.push('TOTAL:')
    lines.push(`  Monthly Total: ${fmt(pricing.totalMonthlyClientPays)}/mo`)
    if (deal.billingCadence !== 'monthly') {
      lines.push(`  ${deal.billingCadence.charAt(0).toUpperCase() + deal.billingCadence.slice(1)} Payment: ${fmt(pricing.cadencePayment)}${pricing.cadenceLabel}`)
    }
    lines.push(`  Annual Total: ${fmt(pricing.annualTotal)}/yr`)
    lines.push(`  First Year (with setup): ${fmt(pricing.firstYearTotal)}`)

    if (deal.notes) {
      lines.push('')
      lines.push(`NOTES: ${deal.notes}`)
    }

    return lines.join('\n')
  }, [deal, selectedTier, selectedPkgs, pricing, infraCalc])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(dealSummary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [dealSummary])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Configuration (2 cols on lg) */}
      <div className="lg:col-span-2 space-y-5">

        {/* Client name */}
        <Card padding="sm">
          <div className="px-5 py-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Client / Company Name</label>
            <input
              type="text"
              value={deal.clientName}
              onChange={(e) => update('clientName', e.target.value)}
              placeholder="e.g. AcmeTech"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>
        </Card>

        {/* Outbound tier selection */}
        <Card padding="sm">
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">Outbound Email Tier</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OUTBOUND_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => update('outboundTierId', deal.outboundTierId === tier.id ? null : tier.id)}
                  className={`text-left rounded-lg border p-4 transition-all ${
                    deal.outboundTierId === tier.id
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500/20'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900">{tier.name}</span>
                    <span className="text-sm font-bold text-gray-900">{fmt(tier.monthlyPrice)}/mo</span>
                  </div>
                  <p className="text-xs text-gray-500">{tier.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                    <span>{tier.domains} domains</span>
                    <span>{tier.inboxes} inboxes</span>
                    <span>{tier.emailsPerMonth.toLocaleString()} emails/mo</span>
                  </div>
                  {tier.setupFee > 0 && (
                    <p className="text-[11px] text-gray-400 mt-1">Setup: {fmt(tier.setupFee)}</p>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Select a tier to include outbound email. Leave unselected for data-only or pixel-only deals.
            </p>
          </div>
        </Card>

        {/* Add-on packages */}
        <Card padding="sm">
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">Service Packages</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SERVICE_PACKAGES.map((pkg) => (
                <label
                  key={pkg.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                    deal.selectedPackages.includes(pkg.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={deal.selectedPackages.includes(pkg.id)}
                    onChange={() => togglePackage(pkg.id)}
                    className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{pkg.name}</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {pkg.monthlyPrice > 0 ? `${fmt(pkg.monthlyPrice)}/mo` : 'Included'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{pkg.description}</p>
                    {pkg.setupFee > 0 && (
                      <p className="text-[11px] text-gray-400 mt-0.5">Setup: {fmt(pkg.setupFee)}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </Card>

        {/* Infrastructure costs */}
        <Card padding="sm">
          <div className="px-5 py-4">
            <button
              type="button"
              onClick={() => setShowInfraDetails(!showInfraDetails)}
              className="flex items-center gap-2 w-full text-left"
            >
              <Globe className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900 flex-1">Infrastructure Costs (At-Cost)</h2>
              {showInfraDetails ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </button>

            {showInfraDetails && (
              <div className="mt-4 space-y-4">
                {/* Custom infra toggle */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={deal.useCustomInfra}
                    onChange={(e) => update('useCustomInfra', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Custom domain/inbox count (override tier defaults)</span>
                </label>

                {deal.useCustomInfra && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Domains</label>
                      <input
                        type="number"
                        min={0}
                        value={deal.customDomains}
                        onChange={(e) => update('customDomains', Math.max(0, Number(e.target.value)))}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Inboxes</label>
                      <input
                        type="number"
                        min={0}
                        value={deal.customInboxes}
                        onChange={(e) => update('customInboxes', Math.max(0, Number(e.target.value)))}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Per-unit cost sliders */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Domain cost: {fmtDecimal(deal.domainCostPer)}/yr
                    </label>
                    <input
                      type="range"
                      min={INFRA_COSTS.domain.min}
                      max={INFRA_COSTS.domain.max}
                      step={0.5}
                      value={deal.domainCostPer}
                      onChange={(e) => update('domainCostPer', Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                      <span>{fmtDecimal(INFRA_COSTS.domain.min)}</span>
                      <span>{fmtDecimal(INFRA_COSTS.domain.max)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Inbox cost: {fmtDecimal(deal.inboxCostPer)}/mo
                    </label>
                    <input
                      type="range"
                      min={INFRA_COSTS.inbox.min}
                      max={INFRA_COSTS.inbox.max}
                      step={0.25}
                      value={deal.inboxCostPer}
                      onChange={(e) => update('inboxCostPer', Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                      <span>{fmtDecimal(INFRA_COSTS.inbox.min)}</span>
                      <span>{fmtDecimal(INFRA_COSTS.inbox.max)}</span>
                    </div>
                  </div>
                </div>

                {/* Infra summary */}
                <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>{pricing.domains} domains x {fmtDecimal(deal.domainCostPer)}/yr</span>
                    <span>{fmtDecimal(infraCalc.domainCostMonthly)}/mo</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>{pricing.inboxes} inboxes x {fmtDecimal(deal.inboxCostPer)}/mo</span>
                    <span>{fmtDecimal(infraCalc.inboxCostMonthly)}/mo</span>
                  </div>
                  <div className="flex justify-between font-semibold text-blue-800 border-t border-blue-200 mt-2 pt-2">
                    <span>Total Infrastructure</span>
                    <span>{fmtDecimal(infraCalc.totalMonthly)}/mo</span>
                  </div>
                  <p className="text-[11px] text-blue-600 mt-1">
                    Domain upfront: {fmtDecimal(pricing.domainUpfront)}/yr (billed annually at-cost)
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Overrides & billing */}
        <Card padding="sm">
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">Billing & Overrides</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Billing Cadence</label>
                <select
                  value={deal.billingCadence}
                  onChange={(e) => update('billingCadence', e.target.value as DealState['billingCadence'])}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Setup Fee Override
                  <span className="text-gray-400 ml-1">(default: {fmt(pricing.outboundSetup + pricing.packageSetup)})</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                  <input
                    type="number"
                    value={deal.setupFeeOverride ?? ''}
                    onChange={(e) => update('setupFeeOverride', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Auto"
                    className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Monthly Override
                  <span className="text-gray-400 ml-1">(excl. infra)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                  <input
                    type="number"
                    value={deal.recurringOverride ?? ''}
                    onChange={(e) => update('recurringOverride', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Auto"
                    className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Deal Notes</label>
              <textarea
                value={deal.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={2}
                placeholder="Special terms, discounts, or context..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-y"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Right: Live pricing summary (sticky) */}
      <div className="lg:col-span-1">
        <div className="sticky top-6 space-y-4">

          {/* Summary card */}
          <Card padding="sm">
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <h2 className="text-base font-bold text-gray-900">Deal Summary</h2>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-blue-600" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              {deal.clientName && (
                <p className="text-sm text-gray-600 mb-3">{deal.clientName}</p>
              )}

              {/* Selected services */}
              <div className="space-y-1.5 mb-4">
                {selectedTier && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Outbound: {selectedTier.name}</span>
                    <span className="font-medium text-gray-900">{fmt(selectedTier.monthlyPrice)}/mo</span>
                  </div>
                )}
                {selectedPkgs.map((pkg) => (
                  <div key={pkg.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{pkg.name}</span>
                    <span className="font-medium text-gray-900">
                      {pkg.monthlyPrice > 0 ? `${fmt(pkg.monthlyPrice)}/mo` : 'Included'}
                    </span>
                  </div>
                ))}
                {!selectedTier && selectedPkgs.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No services selected</p>
                )}
              </div>

              {/* Discount */}
              {pricing.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-blue-700 mb-2">
                  <span>Bundle Discount ({Math.round(pricing.discountRate * 100)}%)</span>
                  <span>-{fmt(pricing.discountAmount)}/mo</span>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-gray-200 my-3" />

              {/* Setup fee */}
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">One-Time Setup</span>
                <span className="font-semibold text-gray-900">{fmt(pricing.totalSetup)}</span>
              </div>

              {/* Monthly service */}
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Monthly Service</span>
                <span className="font-semibold text-gray-900">{fmt(pricing.totalRecurring)}/mo</span>
              </div>

              {/* Infrastructure */}
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Infrastructure (at-cost)</span>
                <span className="font-medium text-blue-700">{fmtDecimal(infraCalc.totalMonthly)}/mo</span>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-3" />

              {/* Total monthly */}
              <div className="flex justify-between text-base mb-1">
                <span className="font-bold text-gray-900">Total Monthly</span>
                <span className="font-bold text-blue-700">{fmt(pricing.totalMonthlyClientPays)}/mo</span>
              </div>

              {/* Cadence payment */}
              {deal.billingCadence !== 'monthly' && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">
                    {deal.billingCadence === 'quarterly' ? 'Quarterly Payment' : 'Annual Payment'}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {fmt(pricing.cadencePayment)}{pricing.cadenceLabel}
                  </span>
                </div>
              )}

              {/* Annual + first year */}
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Annual Total</span>
                <span className="text-gray-900">{fmt(pricing.annualTotal)}/yr</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">First Year (w/ setup)</span>
                <span className="font-semibold text-gray-900">{fmt(pricing.firstYearTotal)}</span>
              </div>
            </div>
          </Card>

          {/* Infrastructure quick ref */}
          <Card padding="sm">
            <div className="px-5 py-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Infrastructure</h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-md bg-gray-50 p-2">
                  <Globe className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{pricing.domains}</p>
                  <p className="text-[10px] text-gray-500">Domains</p>
                </div>
                <div className="rounded-md bg-gray-50 p-2">
                  <Inbox className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{pricing.inboxes}</p>
                  <p className="text-[10px] text-gray-500">Inboxes</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick actions */}
          <Card padding="sm">
            <div className="px-5 py-3 space-y-2">
              <button
                type="button"
                onClick={handleCopy}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied to Clipboard' : 'Copy Deal Summary'}
              </button>
              <p className="text-[10px] text-gray-400 text-center">
                Future: Generate SOW, send Mercury invoice, create Rabbit Sign contract
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
