// Onboarding Slack Notifications
// Sends structured Slack notifications for new client submissions and copy review

import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { PACKAGES } from '@/types/onboarding'
import type {
  OnboardingClient,
  EnrichedICPBrief,
  DraftSequences,
  PackageSlug,
} from '@/types/onboarding'

function formatPackageList(packages: PackageSlug[]): string {
  return packages
    .map((slug) => {
      const pkg = PACKAGES[slug]
      return pkg ? pkg.label : slug
    })
    .join(', ')
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return 'N/A'
  return `$${amount.toLocaleString()}`
}

function truncate(text: string | null, maxLength: number): string {
  if (!text) return 'N/A'
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Send a Slack alert when a new client submits the onboarding form.
 * Includes company info, packages, ICP summary, and commercial details.
 */
export async function sendNewClientSlackAlert(
  client: OnboardingClient,
  icpBrief?: EnrichedICPBrief
): Promise<void> {
  const metadata: Record<string, string | number | boolean> = {
    company: client.company_name,
    website: client.company_website,
    industry: client.industry,
    contact: `${client.primary_contact_name} (${client.primary_contact_email})`,
    packages: formatPackageList(client.packages_selected),
    setup_fee: formatCurrency(client.setup_fee),
    recurring_fee: formatCurrency(client.recurring_fee),
    billing_cadence: client.billing_cadence || 'N/A',
    communication: client.communication_channel,
  }

  if (client.referral_source) {
    metadata.referral = client.referral_source
    if (client.referral_detail) {
      metadata.referral_detail = client.referral_detail
    }
  }

  if (client.outbound_tier) {
    metadata.outbound_tier = client.outbound_tier
  }

  if (icpBrief) {
    metadata.icp_summary = truncate(icpBrief.ideal_buyer_profile, 300)
    metadata.target_verticals = icpBrief.primary_verticals.join(', ')
    metadata.persona_count = icpBrief.buyer_personas.length
    metadata.estimated_audience = icpBrief.audience_labs_search_strategy.estimated_audience_size
  } else if (client.icp_description) {
    metadata.icp_description = truncate(client.icp_description, 300)
  }

  await sendSlackAlert({
    type: 'new_dfy_client',
    severity: 'info',
    message: `New client onboarded: ${client.company_name}`,
    metadata,
  })
}

/**
 * Send a Slack alert when email sequences are ready for review.
 * Includes a summary of each sequence and email count.
 */
export async function sendCopyReviewSlackAlert(
  client: OnboardingClient,
  sequences: DraftSequences
): Promise<void> {
  const sequenceSummaries = sequences.sequences.map((seq) => {
    const emailSummary = seq.emails
      .map((e) => `  Step ${e.step}: "${e.subject_line}" (${e.purpose})`)
      .join('\n')
    return `*${seq.sequence_name}* — ${seq.strategy}\n${emailSummary}`
  })

  const metadata: Record<string, string | number> = {
    company: client.company_name,
    contact: `${client.primary_contact_name} (${client.primary_contact_email})`,
    sequence_count: sequences.sequences.length,
    total_emails: sequences.sequences.reduce((sum, s) => sum + s.emails.length, 0),
    copy_tone: client.copy_tone || 'Default',
    primary_cta: client.primary_cta || 'Book a call',
    sequences_overview: sequenceSummaries.join('\n\n'),
  }

  await sendSlackAlert({
    type: 'new_dfy_client',
    severity: 'info',
    message: `Email sequences ready for review: ${client.company_name}`,
    metadata,
  })
}
