'use client'

import { useCallback, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Mail, Package, Globe, Calculator, ChevronDown, ChevronRight, Inbox } from 'lucide-react'
import type { DealState } from '@/types/onboarding-wizard'
import { calculateDealPricing, fmtCurrency, fmtCurrencyDecimal } from '@/lib/utils/deal-pricing'
import { OUTBOUND_TIERS, SERVICE_PACKAGES, INFRA_COSTS } from '@/app/admin/deal-calculator/pricing-config'
import PricingConfigurator from '@/components/admin/onboarding/PricingConfigurator'
import type { PricingConfig, AddOnId } from '@/components/admin/onboarding/PricingConfigurator'

interface DealConfigStepProps {
  deal: DealState
  onUpdate: <K extends keyof DealState>(key: K, value: DealState[K]) => void
}

export default function DealConfigStep({ deal, onUpdate }: DealConfigStepProps) {
  const [showInfra, setShowInfra] = useState(false)

  const pricing = useMemo(() => calculateDealPricing(deal), [deal])

  const togglePackage = useCallback((pkgId: string) => {
    const current = deal.selectedPackages
    const updated = current.includes(pkgId)
      ? current.filter((id) => id !== pkgId)
      : [...current, pkgId]
    onUpdate('selectedPackages', updated)
  }, [deal.selectedPackages, onUpdate])

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
                      {pkg.monthlyPrice > 0 ? `${fmtCurrency(pkg.monthlyPrice)}/mo` : 'Included'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{pkg.description}</p>
                </div>
              </label>
            ))}
          </div>
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
          {!showInfra && pricing.infraMonthly > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {pricing.domains} domains + {pricing.inboxes} inboxes = {fmtCurrencyDecimal(pricing.infraMonthly)}/mo
            </p>
          )}
          {showInfra && (
            <div className="mt-4 space-y-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={deal.useCustomInfra} onChange={(e) => onUpdate('useCustomInfra', e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                <span className="text-sm text-gray-700">Custom domain/inbox count</span>
              </label>
              {deal.useCustomInfra && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Domains</label>
                    <input type="number" min={0} value={deal.customDomains} onChange={(e) => onUpdate('customDomains', Math.max(0, Number(e.target.value)))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Inboxes</label>
                    <input type="number" min={0} value={deal.customInboxes} onChange={(e) => onUpdate('customInboxes', Math.max(0, Number(e.target.value)))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Domain: {fmtCurrencyDecimal(deal.domainCostPer)}/yr</label>
                  <input type="range" min={INFRA_COSTS.domain.min} max={INFRA_COSTS.domain.max} step={0.5} value={deal.domainCostPer} onChange={(e) => onUpdate('domainCostPer', Number(e.target.value))} className="w-full accent-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Inbox: {fmtCurrencyDecimal(deal.inboxCostPer)}/mo</label>
                  <input type="range" min={INFRA_COSTS.inbox.min} max={INFRA_COSTS.inbox.max} step={0.25} value={deal.inboxCostPer} onChange={(e) => onUpdate('inboxCostPer', Number(e.target.value))} className="w-full accent-blue-600" />
                </div>
              </div>
              <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>{pricing.domains} domains</span>
                  <span>{fmtCurrencyDecimal(pricing.domainCostMonthly)}/mo</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>{pricing.inboxes} inboxes</span>
                  <span>{fmtCurrencyDecimal(pricing.inboxCostMonthly)}/mo</span>
                </div>
                <div className="flex justify-between font-semibold text-blue-800 border-t border-blue-200 mt-2 pt-2">
                  <span>Total</span>
                  <span>{fmtCurrencyDecimal(pricing.infraMonthly)}/mo</span>
                </div>
              </div>
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
            }}
            onChange={(config: PricingConfig) => {
              onUpdate('setupFeeOverride', config.setupFee)
              onUpdate('recurringOverride', config.monthlyFee)
              // Store the selected tier in outboundTierId for downstream mapping
              onUpdate('outboundTierId', config.packageName || null)
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
