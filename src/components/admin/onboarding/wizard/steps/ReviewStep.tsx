'use client'

import { useMemo } from 'react'
import ParsedPreview from '@/components/admin/onboarding/intake/ParsedPreview'
import type { ParsedIntakeData } from '@/types/onboarding-templates'
import type { DealState } from '@/types/onboarding-wizard'
import { calculateDealPricing } from '@/lib/utils/deal-pricing'
import { OUTBOUND_TIERS } from '@/app/admin/deal-calculator/pricing-config'

interface ReviewStepProps {
  deal: DealState
  parsedData: ParsedIntakeData | null
  onChange: (data: ParsedIntakeData) => void
}

/**
 * Initialize parsedData from deal config when no AI parsing was done.
 */
function initFromDeal(deal: DealState): ParsedIntakeData {
  const pricing = calculateDealPricing(deal)
  const tier = OUTBOUND_TIERS.find((t) => t.id === deal.outboundTierId)
  const isCustomTier = deal.outboundTierId === 'custom'

  const emailsPerMonth = isCustomTier
    ? deal.customTierEmailsPerMonth
    : tier?.emailsPerMonth ?? null
  const sendingVolume = emailsPerMonth
    ? `Up to ${emailsPerMonth.toLocaleString()} emails/mo`
    : null
  const outboundTierLabel = isCustomTier ? 'Custom' : (tier?.name || null)

  const missingCritical: string[] = []
  if (!deal.clientName) missingCritical.push('primary_contact_name', 'company_name')

  return {
    company_name: deal.clientName || null,
    company_website: null,
    industry: null,
    primary_contact_name: null,
    primary_contact_email: null,
    primary_contact_phone: null,
    billing_contact_name: null,
    billing_contact_email: null,
    team_members: null,
    communication_channel: null,
    packages_selected: [
      ...deal.selectedPackages,
      ...(deal.outboundTierId ? ['outbound'] : []),
    ] as ParsedIntakeData['packages_selected'],
    packages_reasoning: '',
    setup_fee: pricing.totalSetup,
    recurring_fee: pricing.totalRecurring,
    billing_cadence: deal.billingCadence,
    outbound_tier: outboundTierLabel,
    payment_method: null,
    icp_description: null,
    target_industries: [],
    sub_industries: [],
    target_company_sizes: [],
    target_titles: [],
    target_geography: [],
    specific_regions: null,
    must_have_traits: null,
    exclusion_criteria: null,
    pain_points: null,
    intent_keywords: [],
    competitor_names: [],
    best_customers: null,
    sample_accounts: null,
    sending_volume: sendingVolume,
    lead_volume: null,
    start_timeline: null,
    sender_names: null,
    domain_variations: pricing.domains > 0 ? `${pricing.domains} sending domains` : null,
    domain_provider: null,
    copy_tone: null,
    primary_cta: null,
    calendar_link: null,
    reply_routing_email: null,
    pixel_urls: null,
    uses_gtm: null,
    pixel_installer: null,
    monthly_traffic: null,
    audience_refresh: null,
    data_use_cases: [],
    primary_crm: null,
    data_format: null,
    audience_count: null,
    confidence_score: 0,
    fields_inferred: [],
    missing_critical_fields: missingCritical,
    additional_context: null,
  }
}

/**
 * Always overlay current deal pricing on top of any existing parsedData.
 * Prevents stale commercial figures if the user edits Step 1 after visiting Step 3.
 */
function overlayDealPricing(base: ParsedIntakeData, deal: DealState): ParsedIntakeData {
  const pricing = calculateDealPricing(deal)
  const tier = OUTBOUND_TIERS.find((t) => t.id === deal.outboundTierId)
  const isCustomTier = deal.outboundTierId === 'custom'
  const outboundTierLabel = isCustomTier ? 'Custom' : (tier?.name || base.outbound_tier)

  return {
    ...base,
    setup_fee: pricing.totalSetup,
    recurring_fee: pricing.totalRecurring,
    billing_cadence: deal.billingCadence,
    outbound_tier: outboundTierLabel,
    domain_variations: pricing.domains > 0 ? `${pricing.domains} sending domains` : base.domain_variations,
  }
}

export default function ReviewStep({ deal, parsedData, onChange }: ReviewStepProps) {
  const data = useMemo(
    () => overlayDealPricing(parsedData ?? initFromDeal(deal), deal),
    [parsedData, deal]
  )

  // Dummy submit handler — actual creation happens in Step 5
  const noop = () => {}

  return (
    <ParsedPreview
      data={data}
      onChange={onChange}
      onSubmit={noop}
      isSubmitting={false}
    />
  )
}
