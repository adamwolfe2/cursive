// CRM Sync Service
// Syncs onboarding client data to external CRM systems
// Designed as a pluggable adapter — currently supports webhook and REST API modes

import type { OnboardingClient, EnrichedICPBrief, PackageSlug } from '@/types/onboarding'
import { PACKAGES } from '@/types/onboarding'

interface CRMPayload {
  source: 'cursive_onboarding'
  submitted_at: string
  company: {
    name: string
    website: string
    industry: string
  }
  contact: {
    name: string
    email: string
    phone: string
  }
  billing_contact: {
    name: string | null
    email: string | null
  }
  packages: Array<{ slug: PackageSlug; label: string }>
  commercial: {
    setup_fee: number | null
    recurring_fee: number | null
    billing_cadence: string | null
    outbound_tier: string | null
    payment_method: string | null
  }
  icp_summary: string | null
  enriched_brief: EnrichedICPBrief | null
  communication_channel: string
  referral_source: string | null
}

function buildPayload(
  client: OnboardingClient,
  icpBrief?: EnrichedICPBrief
): CRMPayload {
  return {
    source: 'cursive_onboarding',
    submitted_at: client.created_at,
    company: {
      name: client.company_name,
      website: client.company_website,
      industry: client.industry,
    },
    contact: {
      name: client.primary_contact_name,
      email: client.primary_contact_email,
      phone: client.primary_contact_phone,
    },
    billing_contact: {
      name: client.billing_contact_name,
      email: client.billing_contact_email,
    },
    packages: client.packages_selected.map((slug) => ({
      slug,
      label: PACKAGES[slug]?.label ?? slug,
    })),
    commercial: {
      setup_fee: client.setup_fee,
      recurring_fee: client.recurring_fee,
      billing_cadence: client.billing_cadence,
      outbound_tier: client.outbound_tier,
      payment_method: client.payment_method,
    },
    icp_summary: client.icp_description,
    enriched_brief: icpBrief ?? client.enriched_icp_brief,
    communication_channel: client.communication_channel,
    referral_source: client.referral_source,
  }
}

/**
 * Sync a client record to the configured CRM.
 *
 * Modes:
 * 1. CRM_WEBHOOK_URL — POST payload to a webhook endpoint (e.g., Zapier, Make, n8n)
 * 2. CRM_API_URL — POST to a REST API with optional CRM_API_KEY auth header
 * 3. Fallback — log payload and return a placeholder ID for later wiring
 *
 * Returns the CRM record ID (or placeholder).
 */
export async function syncClientToCRM(
  client: OnboardingClient,
  icpBrief?: EnrichedICPBrief
): Promise<string> {
  const payload = buildPayload(client, icpBrief)

  // Mode 1: Webhook
  const webhookUrl = process.env.CRM_WEBHOOK_URL
  if (webhookUrl) {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown error')
      throw new Error(`CRM webhook returned ${response.status}: ${errorText}`)
    }

    // Try to extract a record ID from the response
    const result = await response.json().catch(() => ({}))
    return result.id || result.record_id || `webhook-${Date.now()}`
  }

  // Mode 2: REST API
  const apiUrl = process.env.CRM_API_URL
  if (apiUrl) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const apiKey = process.env.CRM_API_KEY
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown error')
      throw new Error(`CRM API returned ${response.status}: ${errorText}`)
    }

    const result = await response.json().catch(() => ({}))
    return result.id || result.record_id || `api-${Date.now()}`
  }

  // Mode 3: Fallback — no CRM configured
  console.warn(
    '[CRM Sync] No CRM_WEBHOOK_URL or CRM_API_URL configured. Payload logged for manual sync:',
    JSON.stringify({
      client_id: client.id,
      company: client.company_name,
      contact: client.primary_contact_email,
      packages: client.packages_selected,
    })
  )

  return `placeholder-${client.id}`
}
