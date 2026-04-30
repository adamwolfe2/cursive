// Fulfillment Checklist Generator
// Generates package-specific checklists for client fulfillment tracking

import type { ChecklistItem, PackageSlug } from '@/types/onboarding'

function item(label: string, category: ChecklistItem['category']): ChecklistItem {
  return {
    id: crypto.randomUUID(),
    label,
    completed: false,
    completed_at: null,
    category,
  }
}

// ---------------------------------------------------------------------------
// Pixel checklist items (9 items)
// ---------------------------------------------------------------------------

function getPixelItems(): ChecklistItem[] {
  return [
    item('Confirm pixel URLs with client', 'pixel'),
    item('Generate pixel snippet for client domain(s)', 'pixel'),
    item('Send pixel installation instructions to developer', 'pixel'),
    item('Verify GTM container access (if applicable)', 'pixel'),
    item('Confirm pixel is firing correctly on all pages', 'pixel'),
    item('Set up conversion event tracking', 'pixel'),
    item('Configure audience delivery destinations', 'pixel'),
    item('Validate initial visitor data is flowing', 'pixel'),
    item('Schedule audience refresh cadence', 'pixel'),
  ]
}

// ---------------------------------------------------------------------------
// Audience checklist items (9 items)
// ---------------------------------------------------------------------------

function getAudienceItems(): ChecklistItem[] {
  return [
    item('Review and validate ICP brief', 'audience'),
    item('Build initial audience segment in Audience Labs', 'audience'),
    item('Apply company size and geography filters', 'audience'),
    item('Apply title and seniority filters', 'audience'),
    item('Run suppression list against audience', 'audience'),
    item('Enrich audience contacts with verified emails', 'audience'),
    item('QA audience sample (50 contacts) for accuracy', 'audience'),
    item('Export audience in requested format', 'audience'),
    item('Deliver audience to client via agreed channel', 'audience'),
  ]
}

// ---------------------------------------------------------------------------
// Outbound checklist items (18 items)
// ---------------------------------------------------------------------------

function getOutboundItems(): ChecklistItem[] {
  return [
    item('Purchase and configure sending domains', 'outbound'),
    item('Set up DNS records (SPF, DKIM, DMARC)', 'outbound'),
    item('Warm up sending domains (14-day ramp)', 'outbound'),
    item('Create sender mailbox accounts', 'outbound'),
    item('Configure reply routing to client inbox', 'outbound'),
    item('Build ICP-matched lead list', 'outbound'),
    item('Verify and enrich lead emails', 'outbound'),
    item('Run suppression against DNC list', 'outbound'),
    item('Draft email sequence copy (3-4 steps)', 'outbound'),
    item('Submit copy for client approval', 'outbound'),
    item('Revise copy based on client feedback', 'outbound'),
    item('Configure sequence in sending platform', 'outbound'),
    item('Set up A/B test variants', 'outbound'),
    item('Schedule initial send batch', 'outbound'),
    item('Monitor deliverability first 48 hours', 'outbound'),
    item('Review open and reply rates after first week', 'outbound'),
    item('Optimize subject lines based on performance', 'outbound'),
    item('Send first performance report to client', 'outbound'),
  ]
}

// ---------------------------------------------------------------------------
// Affiliate checklist items (5 items)
// ---------------------------------------------------------------------------

function getAffiliateItems(): ChecklistItem[] {
  return [
    item('Generate unique affiliate referral link', 'affiliate'),
    item('Set up commission tracking in billing system', 'affiliate'),
    item('Send affiliate welcome kit and brand assets', 'affiliate'),
    item('Configure payout schedule and method', 'affiliate'),
    item('Schedule first affiliate check-in call', 'affiliate'),
  ]
}

// ---------------------------------------------------------------------------
// Paid Ads checklist items (6 items)
// ---------------------------------------------------------------------------

function getPaidAdsItems(): ChecklistItem[] {
  return [
    item('Collect ad platform credentials and access', 'paid_ads'),
    item('Connect audience sync to Facebook Ads Manager', 'paid_ads'),
    item('Connect audience sync to Google Ads', 'paid_ads'),
    item('Connect audience sync to LinkedIn Campaign Manager', 'paid_ads'),
    item('Push initial audience segment to ad platforms', 'paid_ads'),
    item('Verify matched audience sizes across platforms', 'paid_ads'),
  ]
}

// ---------------------------------------------------------------------------
// Package-to-checklist mapping
// ---------------------------------------------------------------------------

const PACKAGE_CHECKLIST_MAP: Record<string, () => ChecklistItem[]> = {
  super_pixel: getPixelItems,
  audience: getAudienceItems,
  outbound: getOutboundItems,
  affiliate: getAffiliateItems,
  paid_ads: getPaidAdsItems,
  // Bundle includes pixel + outbound + audience
  bundle: () => [...getPixelItems(), ...getAudienceItems(), ...getOutboundItems()],
  // Enrichment uses audience workflow
  enrichment: getAudienceItems,
  // Data delivery uses audience workflow
  data_delivery: getAudienceItems,
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a fulfillment checklist based on the client's selected packages.
 * Deduplicates items when multiple packages share the same category.
 */
export function generateChecklist(packages: PackageSlug[]): ChecklistItem[] {
  const seenLabels = new Set<string>()
  const items: ChecklistItem[] = []

  for (const pkg of packages) {
    const generator = PACKAGE_CHECKLIST_MAP[pkg]
    if (!generator) continue

    for (const checklistItem of generator()) {
      // Deduplicate by label + category to avoid repeats when bundle overlaps
      const key = `${checklistItem.category}:${checklistItem.label}`
      if (!seenLabels.has(key)) {
        seenLabels.add(key)
        items.push(checklistItem)
      }
    }
  }

  return items
}
