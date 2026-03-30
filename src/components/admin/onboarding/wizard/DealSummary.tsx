'use client'

import { useMemo, useState, useCallback } from 'react'
import { DollarSign, Copy, Check, ChevronDown, Globe, Inbox } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { DealState, DealPricing } from '@/types/onboarding-wizard'
import { calculateDealPricing, fmtCurrency, fmtCurrencyDecimal } from '@/lib/utils/deal-pricing'
import { OUTBOUND_TIERS, SERVICE_PACKAGES } from '@/app/admin/deal-calculator/pricing-config'

interface DealSummaryProps {
  deal: DealState
  compact?: boolean
}

export default function DealSummary({ deal, compact = false }: DealSummaryProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(!compact)

  const pricing = useMemo(() => calculateDealPricing(deal), [deal])
  const selectedTier = OUTBOUND_TIERS.find((t) => t.id === deal.outboundTierId)
  const isCustomTier = deal.outboundTierId === 'custom'
  const selectedPkgs = SERVICE_PACKAGES.filter((p) => deal.selectedPackages.includes(p.id))

  // hasServices: true when any tier/package/override is configured
  const hasServices =
    !!selectedTier ||
    isCustomTier ||
    selectedPkgs.length > 0 ||
    !!deal.setupFeeOverride ||
    !!deal.recurringOverride

  const summaryText = useMemo(() => {
    const lines: string[] = ['CURSIVE AI — Deal Summary']
    if (deal.clientName) lines.push(`Client: ${deal.clientName}`)
    lines.push('')
    if (selectedTier) lines.push(`Outbound: ${selectedTier.name} — ${fmtCurrency(selectedTier.monthlyPrice)}/mo`)
    for (const pkg of selectedPkgs) lines.push(`${pkg.name} — ${fmtCurrency(pkg.monthlyPrice)}/mo`)
    lines.push('')
    lines.push(`Setup: ${fmtCurrency(pricing.totalSetup)}`)
    lines.push(`Monthly: ${fmtCurrency(pricing.totalRecurring)}/mo + ${fmtCurrencyDecimal(pricing.infraMonthly)}/mo infra`)
    lines.push(`Total Monthly: ${fmtCurrency(pricing.totalMonthlyClientPays)}/mo`)
    lines.push(`Annual: ${fmtCurrency(pricing.annualTotal)}/yr`)
    lines.push(`First Year: ${fmtCurrency(pricing.firstYearTotal)}`)
    return lines.join('\n')
  }, [deal, selectedTier, selectedPkgs, pricing])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(summaryText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [summaryText])

  if (!hasServices) {
    return (
      <Card padding="sm">
        <div className="px-4 py-3 text-center text-xs text-gray-400">
          Select packages in Step 1 to see pricing
        </div>
      </Card>
    )
  }

  return (
    <Card padding="sm">
      <div className="px-4 py-3">
        {/* Header */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-bold text-gray-900">
              {pricing.totalMonthlyClientPays > 0
                ? `${fmtCurrency(pricing.totalMonthlyClientPays)}/mo`
                : deal.recurringOverride
                ? `${fmtCurrency(deal.recurringOverride)}/mo`
                : 'Custom deal'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleCopy() }}
              className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-blue-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {deal.clientName && (
              <p className="text-xs text-gray-500">{deal.clientName}</p>
            )}

            {/* Services */}
            <div className="space-y-1">
              {selectedTier && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Outbound: {selectedTier.name}</span>
                  <span className="font-medium">{fmtCurrency(selectedTier.monthlyPrice)}/mo</span>
                </div>
              )}
              {isCustomTier && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Custom Package</span>
                  <span className="font-medium">
                    {deal.recurringOverride ? `${fmtCurrency(deal.recurringOverride)}/mo` : '—'}
                  </span>
                </div>
              )}
              {isCustomTier && (deal.customTierDomains || deal.customTierInboxes) && (
                <div className="text-[10px] text-gray-400 ml-1">
                  {[
                    deal.customTierDomains && `${deal.customTierDomains} domains`,
                    deal.customTierInboxes && `${deal.customTierInboxes} inboxes`,
                    deal.customTierEmailsPerMonth && `${deal.customTierEmailsPerMonth.toLocaleString()} emails/mo`,
                  ].filter(Boolean).join(' · ')}
                </div>
              )}
              {selectedPkgs.map((pkg) => {
                const overridePrice = deal.packagePriceOverrides?.[pkg.id]
                const displayPrice = overridePrice !== undefined ? overridePrice : pkg.monthlyPrice
                return (
                  <div key={pkg.id} className="flex justify-between text-xs">
                    <span className="text-gray-600">
                      {pkg.name}
                      {overridePrice !== undefined && <span className="ml-1 text-blue-500 text-[10px]">custom</span>}
                    </span>
                    <span className="font-medium">{displayPrice > 0 ? `${fmtCurrency(displayPrice)}/mo` : 'Incl.'}</span>
                  </div>
                )
              })}
            </div>

            {pricing.discountAmount > 0 && (
              <div className="flex justify-between text-xs text-blue-700">
                <span>Bundle ({Math.round(pricing.discountRate * 100)}%)</span>
                <span>-{fmtCurrency(pricing.discountAmount)}/mo</span>
              </div>
            )}

            <div className="border-t border-gray-100 pt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Setup</span>
                <span className="font-medium">{fmtCurrency(pricing.totalSetup)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Service</span>
                <span className="font-medium">{fmtCurrency(pricing.totalRecurring)}/mo</span>
              </div>
              <div className="space-y-0.5">
                {pricing.domainCostAnnual > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Globe className="h-3 w-3" /> {pricing.domains} domains
                    </span>
                    <span className="text-blue-700">{fmtCurrencyDecimal(pricing.domainCostAnnual)}/yr</span>
                  </div>
                )}
                {pricing.inboxCostMonthly > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Inbox className="h-3 w-3" /> {pricing.inboxes} inboxes
                    </span>
                    <span className="text-blue-700">{fmtCurrencyDecimal(pricing.inboxCostMonthly)}/mo</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-500">Infra total</span>
                  <span className="text-blue-700">{fmtCurrencyDecimal(pricing.infraMonthly)}/mo</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Annual</span>
                <span>{fmtCurrency(pricing.annualTotal)}/yr</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">First Year</span>
                <span className="font-semibold">{fmtCurrency(pricing.firstYearTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
