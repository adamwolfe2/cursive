'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Mail, Package, Globe, Calculator, ChevronDown, ChevronRight, Inbox, Users } from 'lucide-react'
import type { DealState } from '@/types/onboarding-wizard'
import { calculateDealPricing, fmtCurrency, fmtCurrencyDecimal } from '@/lib/utils/deal-pricing'
import { OUTBOUND_TIERS, SERVICE_PACKAGES } from '@/app/admin/deal-calculator/pricing-config'
import PricingConfigurator from '@/components/admin/onboarding/PricingConfigurator'
import type { PricingConfig, AddOnId } from '@/components/admin/onboarding/PricingConfigurator'

interface DealConfigStepProps {
  deal: DealState
  onUpdate: <K extends keyof DealState>(key: K, value: DealState[K]) => void
}

export default function DealConfigStep({ deal, onUpdate }: DealConfigStepProps) {
  const [showInfra, setShowInfra] = useState(false)

  // Local string state for infra inputs so the user can freely clear/type
  // without the controlled number snapping back to 0
  const [domainsText, setDomainsText] = useState(String(deal.customDomains))
  const [inboxesText, setInboxesText] = useState(String(deal.customInboxes))
  const [infraCostText, setInfraCostText] = useState(
    deal.infraMonthlyOverride !== null ? String(deal.infraMonthlyOverride) : ''
  )

  // Sync if deal state changes externally (draft resume, tier selection, etc.)
  useEffect(() => { setDomainsText(String(deal.customDomains)) }, [deal.customDomains])
  useEffect(() => { setInboxesText(String(deal.customInboxes)) }, [deal.customInboxes])
  useEffect(() => {
    setInfraCostText(deal.infraMonthlyOverride !== null ? String(deal.infraMonthlyOverride) : '')
  }, [deal.infraMonthlyOverride])

  const pricing = useMemo(() => calculateDealPricing(deal), [deal])

  const togglePackage = useCallback((pkgId: string) => {
    const current = deal.selectedPackages
    const updated = current.includes(pkgId)
      ? current.filter((id) => id !== pkgId)
      : [...current, pkgId]
    onUpdate('selectedPackages', updated)
  }, [deal.selectedPackages, onUpdate])

  const toggleIcpSegment = useCallback((segment: string) => {
    const current = deal.selectedIcpSegments ?? []
    const updated = current.includes(segment)
      ? current.filter((s) => s !== segment)
      : [...current, segment]
    onUpdate('selectedIcpSegments', updated)
  }, [deal.selectedIcpSegments, onUpdate])

  const ICP_SEGMENTS = [
    'Decision Makers at SMBs',
    'SaaS VP+ Leaders',
    'Local Service Businesses',
    'E-commerce Brands',
    'Professional Services',
    'Manufacturing & Industrial',
  ]

  return (
    <div className="space-y-5">
      {/* Client name */}
      <Card padding="sm">
        <div className="px-5 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Client / Company Name</label>
          <input
            type="text"
            value={deal.clientName}
            onChange={(e) => onUpdate('clientName', e.target.value)}
            placeholder="e.g. AcmeTech"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
          />
        </div>
      </Card>

      {/* Outbound tiers */}
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
                onClick={() => onUpdate('outboundTierId', deal.outboundTierId === tier.id ? null : tier.id)}
                className={`text-left rounded-lg border p-4 transition-all ${
                  deal.outboundTierId === tier.id
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">{tier.name}</span>
                  <span className="text-sm font-bold text-gray-900">{fmtCurrency(tier.monthlyPrice)}/mo</span>
                </div>
                <p className="text-xs text-gray-500">{tier.description}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                  <span>{tier.domains} domains</span>
                  <span>{tier.inboxes} inboxes</span>
                  <span>{tier.emailsPerMonth.toLocaleString()} emails/mo</span>
                </div>
                {tier.setupFee > 0 && (
                  <p className="text-[11px] text-gray-400 mt-1">Setup: {fmtCurrency(tier.setupFee)}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Service packages */}
      <Card padding="sm">
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-900">Service Packages</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SERVICE_PACKAGES.map((pkg) => {
              const isChecked = deal.selectedPackages.includes(pkg.id)
              const overridePrice = deal.packagePriceOverrides?.[pkg.id]
              const displayPrice = overridePrice !== undefined ? overridePrice : pkg.monthlyPrice
              return (
                <div
                  key={pkg.id}
                  className={`rounded-lg border p-3 transition-all ${
                    isChecked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePackage(pkg.id)}
                      className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{pkg.name}</span>
                        <span className="text-xs font-semibold text-gray-700">
                          {displayPrice > 0 ? `${fmtCurrency(displayPrice)}/mo` : 'Included'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{pkg.description}</p>
                    </div>
                  </label>
                  {isChecked && (
                    <div className="mt-2 ml-7 flex items-center gap-2">
                      <label className="text-[11px] text-gray-500 whitespace-nowrap">Override price:</label>
                      <div className="relative w-28">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                        <input
                          type="number"
                          min={0}
                          placeholder={pkg.monthlyPrice.toString()}
                          value={overridePrice !== undefined ? overridePrice : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? undefined : Number(e.target.value)
                            const updated = { ...(deal.packagePriceOverrides ?? {}) }
                            if (val === undefined) {
                              delete updated[pkg.id]
                            } else {
                              updated[pkg.id] = val
                            }
                            onUpdate('packagePriceOverrides', updated)
                          }}
                          className="w-full rounded border border-gray-300 pl-5 pr-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                        />
                      </div>
                      <span className="text-[11px] text-gray-400">/mo</span>
                      {overridePrice !== undefined && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...(deal.packagePriceOverrides ?? {}) }
                            delete updated[pkg.id]
                            onUpdate('packagePriceOverrides', updated)
                          }}
                          className="text-[11px] text-gray-400 hover:text-red-500 underline"
                        >
                          reset
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* ICP Audience Segments (multi-select) */}
      <Card padding="sm">
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-900">ICP Audience Segments</h2>
            <span className="text-xs text-gray-400 ml-1">(select all that apply)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ICP_SEGMENTS.map((segment) => {
              const selected = (deal.selectedIcpSegments ?? []).includes(segment)
              return (
                <button
                  key={segment}
                  type="button"
                  onClick={() => toggleIcpSegment(segment)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    selected
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {selected && <span className="mr-1">&#10003;</span>}
                  {segment}
                </button>
              )
            })}
          </div>
          {(deal.selectedIcpSegments ?? []).length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              {(deal.selectedIcpSegments ?? []).length} segment{(deal.selectedIcpSegments ?? []).length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      </Card>

      {/* Infrastructure */}
      <Card padding="sm">
        <div className="px-5 py-4">
          <button type="button" onClick={() => setShowInfra(!showInfra)} className="flex items-center gap-2 w-full text-left">
            <Globe className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-900 flex-1">Infrastructure (At-Cost)</h2>
            {showInfra ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
          </button>
          {!showInfra && (deal.customDomains > 0 || deal.customInboxes > 0 || deal.infraMonthlyOverride !== null) && (
            <p className="text-xs text-gray-500 mt-2">
              {deal.customDomains} domains + {deal.customInboxes} inboxes
              {deal.infraMonthlyOverride !== null ? ` = ${fmtCurrencyDecimal(deal.infraMonthlyOverride)}/mo` : ' — cost TBD'}
            </p>
          )}
          {showInfra && (
            <div className="mt-4 space-y-4">
              {/* Domain + inbox counts — used as contract variables */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Domains</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={domainsText}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '')
                      setDomainsText(v)
                      if (v !== '') {
                        onUpdate('customDomains', Number(v))
                        onUpdate('useCustomInfra', true)
                      }
                    }}
                    onBlur={() => {
                      const n = domainsText === '' ? 0 : Number(domainsText)
                      setDomainsText(String(n))
                      onUpdate('customDomains', n)
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Inboxes</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={inboxesText}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '')
                      setInboxesText(v)
                      if (v !== '') {
                        onUpdate('customInboxes', Number(v))
                        onUpdate('useCustomInfra', true)
                      }
                    }}
                    onBlur={() => {
                      const n = inboxesText === '' ? 0 : Number(inboxesText)
                      setInboxesText(String(n))
                      onUpdate('customInboxes', n)
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Actual monthly cost — enter the real number from your vendor cart */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Total infra cost ($/mo)
                  <span className="ml-1 font-normal text-gray-400">— domains annual ÷ 12, plus inboxes monthly</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 369.48"
                    value={infraCostText}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, '')
                      setInfraCostText(v)
                      const n = parseFloat(v)
                      onUpdate('infraMonthlyOverride', v === '' ? null : (isNaN(n) ? null : n))
                    }}
                    onBlur={() => {
                      const n = parseFloat(infraCostText)
                      if (infraCostText === '' || isNaN(n)) {
                        setInfraCostText('')
                        onUpdate('infraMonthlyOverride', null)
                      } else {
                        setInfraCostText(n.toFixed(2))
                        onUpdate('infraMonthlyOverride', n)
                      }
                    }}
                    className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm"
                  />
                </div>
                {deal.infraMonthlyOverride === null && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    Not set — enter your vendor total. E.g. for Olander: ($401.81/yr ÷ 12) + $336/mo = $369.48/mo
                  </p>
                )}
              </div>

              {/* Summary */}
              {(deal.customDomains > 0 || deal.customInboxes > 0 || deal.infraMonthlyOverride !== null) && (
                <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>{deal.customDomains} domains + {deal.customInboxes} inboxes</span>
                    <span className="text-gray-500 text-xs">contract variables</span>
                  </div>
                  <div className="flex justify-between font-semibold text-blue-800 border-t border-blue-200 mt-2 pt-2">
                    <span>Total</span>
                    <span>{deal.infraMonthlyOverride !== null ? fmtCurrencyDecimal(deal.infraMonthlyOverride) : '—'}/mo</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Pricing configurator */}
      <Card padding="sm">
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-900">Pricing Package</h2>
          </div>
          <PricingConfigurator
            value={{
              setupFee: deal.setupFeeOverride,
              monthlyFee: deal.recurringOverride,
              packageName: deal.outboundTierId ?? '',
              addOns: (deal.selectedPackages.filter((p) =>
                ['additional_inboxes', 'reply_management', 'autoresearch', 'priority_support'].includes(p)
              ) as AddOnId[]),
              customDomains: deal.customTierDomains,
              customInboxes: deal.customTierInboxes,
              customEmailsPerMonth: deal.customTierEmailsPerMonth,
            }}
            onChange={(config: PricingConfig) => {
              onUpdate('setupFeeOverride', config.setupFee)
              onUpdate('recurringOverride', config.monthlyFee)
              onUpdate('outboundTierId', config.packageName || null)
              // Persist custom tier infra spec
              onUpdate('customTierDomains', config.customDomains ?? null)
              onUpdate('customTierInboxes', config.customInboxes ?? null)
              onUpdate('customTierEmailsPerMonth', config.customEmailsPerMonth ?? null)
              // Merge add-ons into selectedPackages (preserve non-addon packages)
              const nonAddonPackages = deal.selectedPackages.filter(
                (p) => !['additional_inboxes', 'reply_management', 'autoresearch', 'priority_support'].includes(p)
              )
              onUpdate('selectedPackages', [...nonAddonPackages, ...config.addOns])
            }}
          />
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Billing Cadence</label>
              <select
                value={deal.billingCadence}
                onChange={(e) => onUpdate('billingCadence', e.target.value as DealState['billingCadence'])}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Deal Notes</label>
              <textarea
                value={deal.notes}
                onChange={(e) => onUpdate('notes', e.target.value)}
                rows={1}
                placeholder="Special terms, discounts..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-y"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
