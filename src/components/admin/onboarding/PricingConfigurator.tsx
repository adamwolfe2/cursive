'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Check } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PricingTierId = 'starter' | 'growth' | 'scale' | 'custom'
export type AddOnId = 'additional_inboxes' | 'reply_management' | 'autoresearch' | 'priority_support'

export interface PricingConfig {
  setupFee: number | null
  monthlyFee: number | null
  packageName: string
  addOns: AddOnId[]
}

interface PricingConfiguratorProps {
  value: PricingConfig
  onChange: (config: PricingConfig) => void
  className?: string
}

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

interface BaseTier {
  id: PricingTierId
  name: string
  setupFee: number | null
  monthlyFee: number | null
  description: string
  inboxes: string
  campaigns: string
  leadsPerMonth: string
}

const BASE_TIERS: BaseTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    setupFee: 1500,
    monthlyFee: 750,
    description: '1 inbox, 1 campaign, 1,000 leads/mo',
    inboxes: '1 inbox',
    campaigns: '1 campaign',
    leadsPerMonth: '1,000 leads/mo',
  },
  {
    id: 'growth',
    name: 'Growth',
    setupFee: 2500,
    monthlyFee: 1250,
    description: '3 inboxes, 3 campaigns, 5,000 leads/mo',
    inboxes: '3 inboxes',
    campaigns: '3 campaigns',
    leadsPerMonth: '5,000 leads/mo',
  },
  {
    id: 'scale',
    name: 'Scale',
    setupFee: 4000,
    monthlyFee: 2000,
    description: '10 inboxes, unlimited campaigns, 20,000 leads/mo',
    inboxes: '10 inboxes',
    campaigns: 'Unlimited campaigns',
    leadsPerMonth: '20,000 leads/mo',
  },
  {
    id: 'custom',
    name: 'Custom',
    setupFee: null,
    monthlyFee: null,
    description: 'Manual override — enter fees below',
    inboxes: 'Custom',
    campaigns: 'Custom',
    leadsPerMonth: 'Custom',
  },
]

interface AddOn {
  id: AddOnId
  name: string
  monthlyPrice: number
  description: string
}

const ADD_ONS: AddOn[] = [
  {
    id: 'additional_inboxes',
    name: 'Additional Inboxes (+5)',
    monthlyPrice: 200,
    description: 'Expand sending with 5 more inboxes',
  },
  {
    id: 'reply_management',
    name: 'Reply Management (AI SDR)',
    monthlyPrice: 300,
    description: 'AI-powered inbox management and reply handling',
  },
  {
    id: 'autoresearch',
    name: 'Autoresearch Loop',
    monthlyPrice: 500,
    description: 'Continuous lead research and enrichment pipeline',
  },
  {
    id: 'priority_support',
    name: 'Priority Support',
    monthlyPrice: 150,
    description: 'Dedicated Slack channel and 4-hour response SLA',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtUSD(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}

function computeAddOnTotal(addOns: AddOnId[]): number {
  return addOns.reduce((sum, id) => {
    const addon = ADD_ONS.find((a) => a.id === id)
    return sum + (addon?.monthlyPrice ?? 0)
  }, 0)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PricingConfigurator({ value, onChange, className }: PricingConfiguratorProps) {
  // Determine which tier is currently selected based on value
  const deriveTierId = (cfg: PricingConfig): PricingTierId => {
    if (!cfg.packageName) return 'starter'
    const match = BASE_TIERS.find((t) => t.id === cfg.packageName)
    return match ? (match.id as PricingTierId) : 'custom'
  }

  const [selectedTierId, setSelectedTierId] = useState<PricingTierId>(() => deriveTierId(value))
  // Custom override inputs (only used when tier === 'custom')
  const [customSetup, setCustomSetup] = useState<string>(value.setupFee?.toString() ?? '')
  const [customMonthly, setCustomMonthly] = useState<string>(value.monthlyFee?.toString() ?? '')

  const selectedTier = BASE_TIERS.find((t) => t.id === selectedTierId)!
  const addOnMonthly = computeAddOnTotal(value.addOns)
  const baseMonthly = selectedTierId === 'custom' ? (Number(customMonthly) || 0) : (selectedTier.monthlyFee ?? 0)
  const baseSetup = selectedTierId === 'custom' ? (Number(customSetup) || 0) : (selectedTier.setupFee ?? 0)
  const totalMonthly = baseMonthly + addOnMonthly

  // Emit change upward whenever computed values change
  const emit = useCallback(
    (tierId: PricingTierId, addOns: AddOnId[], setupOverride?: string, monthlyOverride?: string) => {
      const tier = BASE_TIERS.find((t) => t.id === tierId)!
      const setupFee = tierId === 'custom'
        ? (setupOverride !== undefined ? (Number(setupOverride) || null) : (Number(customSetup) || null))
        : tier.setupFee
      const monthlyFee = tierId === 'custom'
        ? (monthlyOverride !== undefined ? (Number(monthlyOverride) || null) : (Number(customMonthly) || null))
        : tier.monthlyFee

      const addOnTotal = computeAddOnTotal(addOns)
      onChange({
        setupFee,
        monthlyFee: monthlyFee !== null ? monthlyFee + addOnTotal : addOnTotal || null,
        packageName: tierId,
        addOns,
      })
    },
    [onChange, customSetup, customMonthly]
  )

  const handleTierSelect = useCallback(
    (tierId: PricingTierId) => {
      setSelectedTierId(tierId)
      emit(tierId, value.addOns)
    },
    [emit, value.addOns]
  )

  const handleAddOnToggle = useCallback(
    (addonId: AddOnId) => {
      const updated = value.addOns.includes(addonId)
        ? value.addOns.filter((id) => id !== addonId)
        : [...value.addOns, addonId]
      emit(selectedTierId, updated)
    },
    [emit, selectedTierId, value.addOns]
  )

  const handleCustomSetup = useCallback(
    (raw: string) => {
      setCustomSetup(raw)
      emit(selectedTierId, value.addOns, raw, undefined)
    },
    [emit, selectedTierId, value.addOns]
  )

  const handleCustomMonthly = useCallback(
    (raw: string) => {
      setCustomMonthly(raw)
      emit(selectedTierId, value.addOns, undefined, raw)
    },
    [emit, selectedTierId, value.addOns]
  )

  // Sync local tier state if parent value changes externally
  useEffect(() => {
    const id = deriveTierId(value)
    if (id !== selectedTierId) {
      setSelectedTierId(id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.packageName])

  return (
    <div className={className}>
      {/* Base tier selection */}
      <div className="space-y-2 mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Base Tier</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BASE_TIERS.map((tier) => {
            const isSelected = selectedTierId === tier.id
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => handleTierSelect(tier.id as PricingTierId)}
                className={`text-left rounded-lg border p-4 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-4 w-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <span className="flex items-center justify-center h-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-white block" />
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{tier.name}</span>
                  </div>
                  {tier.setupFee !== null && tier.monthlyFee !== null ? (
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-gray-900">{fmtUSD(tier.monthlyFee)}/mo</p>
                      <p className="text-[10px] text-gray-400">{fmtUSD(tier.setupFee)} setup</p>
                    </div>
                  ) : (
                    <Badge variant="outline" size="sm">Manual</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 ml-6">
                  <span className="text-[11px] text-gray-400">{tier.inboxes}</span>
                  <span className="text-[11px] text-gray-400">{tier.campaigns}</span>
                  <span className="text-[11px] text-gray-400">{tier.leadsPerMonth}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Custom override inputs */}
        {selectedTierId === 'custom' && (
          <div className="grid grid-cols-2 gap-3 mt-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/60 p-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Setup Fee</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  type="number"
                  min={0}
                  value={customSetup}
                  onChange={(e) => handleCustomSetup(e.target.value)}
                  placeholder="e.g. 3000"
                  className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Fee</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  type="number"
                  min={0}
                  value={customMonthly}
                  onChange={(e) => handleCustomMonthly(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add-ons */}
      <div className="space-y-2 mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add-ons</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ADD_ONS.map((addon) => {
            const isChecked = value.addOns.includes(addon.id)
            return (
              <label
                key={addon.id}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                  isChecked
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleAddOnToggle(addon.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900">{addon.name}</span>
                    <span className="text-xs font-semibold text-gray-700 flex-shrink-0">
                      +{fmtUSD(addon.monthlyPrice)}/mo
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{addon.description}</p>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Summary panel */}
      <Card padding="sm" className="bg-gray-50 border-gray-200">
        <CardHeader className="px-4 pt-3 pb-0">
          <CardTitle className="flex items-center gap-2 text-sm text-gray-800">
            <DollarSign className="h-4 w-4 text-blue-600" />
            Pricing Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {selectedTier.name} base
              </span>
              <span className="font-medium text-gray-900">
                {baseSetup > 0 ? `${fmtUSD(baseSetup)} setup` : 'No setup fee'}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Base monthly</span>
              <span className="font-medium text-gray-900">
                {baseMonthly > 0 ? `${fmtUSD(baseMonthly)}/mo` : '—'}
              </span>
            </div>

            {value.addOns.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-gray-200">
                {value.addOns.map((id) => {
                  const addon = ADD_ONS.find((a) => a.id === id)
                  if (!addon) return null
                  return (
                    <div key={id} className="flex justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-blue-500" />
                        {addon.name}
                      </span>
                      <span>+{fmtUSD(addon.monthlyPrice)}/mo</span>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="border-t border-gray-300 pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-gray-700">Setup Fee</span>
                <span className="text-gray-900">
                  {baseSetup > 0 ? fmtUSD(baseSetup) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span className="text-gray-900">Monthly Total</span>
                <span className="text-blue-700">
                  {totalMonthly > 0 ? `${fmtUSD(totalMonthly)}/mo` : '—'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
