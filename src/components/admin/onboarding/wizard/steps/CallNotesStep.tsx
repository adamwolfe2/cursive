'use client'

import { useCallback } from 'react'
import ContextInput from '@/components/admin/onboarding/intake/ContextInput'
import TemplatePicker from '@/components/admin/onboarding/intake/TemplatePicker'
import type { OnboardingTemplate, ContextFormat, TemplateData, ParsedIntakeData } from '@/types/onboarding-templates'
import type { DealState } from '@/types/onboarding-wizard'
import { OUTBOUND_TIERS } from '@/app/admin/deal-calculator/pricing-config'
import { calculateDealPricing } from '@/lib/utils/deal-pricing'

interface CallNotesStepProps {
  deal: DealState
  templates: OnboardingTemplate[]
  selectedTemplateId: string | null
  isParsing: boolean
  onTemplateSelect: (data: TemplateData | null, id: string | null) => void
  onParse: (rawContext: string, format: ContextFormat) => void
  onParsed: (data: ParsedIntakeData) => void
  onParseError: (error: string) => void
  onSkip: () => void
}

/**
 * Merge deal config into parsed intake data.
 * Deal values take precedence for commercial fields.
 */
function mergeDealIntoParsed(deal: DealState, parsed: ParsedIntakeData): ParsedIntakeData {
  const pricing = calculateDealPricing(deal)
  const tier = OUTBOUND_TIERS.find((t) => t.id === deal.outboundTierId)

  return {
    ...parsed,
    // Company name from deal if not AI-parsed
    company_name: parsed.company_name || deal.clientName || null,
    // Packages — union of deal + AI-parsed
    packages_selected: Array.from(new Set([
      ...deal.selectedPackages,
      ...(parsed.packages_selected || []),
      ...(deal.outboundTierId ? ['outbound'] : []),
    ])) as ParsedIntakeData['packages_selected'],
    // Commercial — deal overrides AI
    setup_fee: pricing.totalSetup,
    recurring_fee: pricing.totalRecurring,
    billing_cadence: deal.billingCadence || parsed.billing_cadence,
    outbound_tier: tier?.name || parsed.outbound_tier,
    // Sending volume from tier
    sending_volume: tier ? `Up to ${tier.emailsPerMonth.toLocaleString()} emails/mo` : parsed.sending_volume,
    domain_variations: tier ? `${tier.domains} sending domains` : parsed.domain_variations,
  }
}

export default function CallNotesStep({
  deal,
  templates,
  selectedTemplateId,
  isParsing,
  onTemplateSelect,
  onParse,
  onParsed,
  onParseError,
  onSkip,
}: CallNotesStepProps) {
  const handleTemplateSelect = useCallback(
    (data: TemplateData | null) => {
      const template = data
        ? templates.find((t) => JSON.stringify(t.template_data) === JSON.stringify(data))
        : null
      onTemplateSelect(data, template?.id ?? null)
    },
    [templates, onTemplateSelect]
  )

  const handleParse = useCallback(
    async (rawContext: string, format: ContextFormat) => {
      onParse(rawContext, format)

      try {
        const response = await fetch('/api/onboarding/parse-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            raw_context: rawContext,
            context_format: format,
          }),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(err.error || `HTTP ${response.status}`)
        }

        const result = await response.json()
        // Merge deal config into parsed data
        const merged = mergeDealIntoParsed(deal, result.data)
        onParsed(merged)
      } catch (error) {
        onParseError(error instanceof Error ? error.message : 'Failed to parse context')
      }
    },
    [deal, onParse, onParsed, onParseError]
  )

  return (
    <div className="space-y-4">
      <TemplatePicker
        templates={templates}
        onSelect={handleTemplateSelect}
        selectedId={selectedTemplateId}
      />

      <ContextInput onParse={handleParse} isParsing={isParsing} />

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Skip — I will fill in fields manually
        </button>
      </div>
    </div>
  )
}
