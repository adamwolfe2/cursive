'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { inngest } from '@/inngest/client'
import type { ParsedIntakeData } from '@/types/onboarding-templates'

/**
 * Create a new onboarding client from internally parsed data.
 * Sets intake_source = 'internal_intake' and onboarding_complete = true,
 * then fires the Inngest pipeline.
 */
export async function createClientFromIntake(
  data: ParsedIntakeData
): Promise<{ success: boolean; clientId?: string; error?: string }> {
  try {
    // Validate required fields
    if (!data.company_name?.trim()) {
      return { success: false, error: 'Company name is required' }
    }
    if (!data.company_website?.trim()) {
      return { success: false, error: 'Company website is required' }
    }
    if (!data.industry?.trim()) {
      return { success: false, error: 'Industry is required' }
    }
    if (!data.primary_contact_name?.trim()) {
      return { success: false, error: 'Primary contact name is required' }
    }
    if (!data.primary_contact_email?.trim()) {
      return { success: false, error: 'Primary contact email is required' }
    }
    if (!data.packages_selected || data.packages_selected.length === 0) {
      return { success: false, error: 'At least one package must be selected' }
    }

    const supabase = createAdminClient()

    const { data: client, error: insertError } = await supabase
      .from('onboarding_clients')
      .insert({
        status: 'onboarding',
        intake_source: 'internal_intake',
        onboarding_complete: true,
        // Company basics
        company_name: data.company_name.trim(),
        company_website: data.company_website.trim(),
        industry: data.industry.trim(),
        primary_contact_name: data.primary_contact_name.trim(),
        primary_contact_email: data.primary_contact_email.trim(),
        primary_contact_phone: data.primary_contact_phone?.trim() || null,
        billing_contact_name: data.billing_contact_name?.trim() || null,
        billing_contact_email: data.billing_contact_email?.trim() || null,
        team_members: data.team_members?.trim() || null,
        communication_channel: data.communication_channel?.trim() || 'Email',
        // Packages
        packages_selected: data.packages_selected,
        // Commercial
        setup_fee: data.setup_fee ?? null,
        recurring_fee: data.recurring_fee ?? null,
        billing_cadence: data.billing_cadence || null,
        outbound_tier: data.outbound_tier || null,
        payment_method: data.payment_method || null,
        // ICP
        icp_description: data.icp_description || null,
        target_industries: data.target_industries ?? [],
        sub_industries: data.sub_industries ?? [],
        target_company_sizes: data.target_company_sizes ?? [],
        target_titles: data.target_titles ?? [],
        target_geography: data.target_geography ?? [],
        specific_regions: data.specific_regions || null,
        must_have_traits: data.must_have_traits || null,
        exclusion_criteria: data.exclusion_criteria || null,
        pain_points: data.pain_points || null,
        intent_keywords: data.intent_keywords ?? [],
        competitor_names: data.competitor_names ?? [],
        best_customers: data.best_customers || null,
        sample_accounts: data.sample_accounts || null,
        // Email setup
        sending_volume: data.sending_volume || null,
        lead_volume: data.lead_volume || null,
        start_timeline: data.start_timeline || null,
        sender_names: data.sender_names || null,
        domain_variations: data.domain_variations || null,
        domain_provider: data.domain_provider || null,
        copy_tone: data.copy_tone || null,
        primary_cta: data.primary_cta || null,
        calendar_link: data.calendar_link || null,
        reply_routing_email: data.reply_routing_email || null,
        // Pixel setup
        pixel_urls: data.pixel_urls || null,
        uses_gtm: data.uses_gtm || null,
        pixel_installer: data.pixel_installer || null,
        monthly_traffic: data.monthly_traffic || null,
        audience_refresh: data.audience_refresh || null,
        // Data delivery
        data_use_cases: data.data_use_cases ?? [],
        primary_crm: data.primary_crm || null,
        data_format: data.data_format || null,
        audience_count: data.audience_count || null,
        // Legal defaults for internal intake (admin-created, no client sign-off needed yet)
        sow_signed: false,
        payment_confirmed: false,
        data_usage_ack: false,
        privacy_ack: false,
        billing_terms_ack: false,
        copy_approval: false,
        sender_identity_approval: false,
      })
      .select('id')
      .single()

    if (insertError) {
      return { success: false, error: `Failed to create client: ${insertError.message}` }
    }

    const clientId = client.id

    // Fire Inngest pipeline
    try {
      await inngest.send({
        name: 'onboarding/intake-complete',
        data: {
          client_id: clientId,
          company_name: data.company_name,
          packages: data.packages_selected,
          contact_email: data.primary_contact_email,
        },
      })
    } catch (inngestError) {
      // Fallback: direct API call
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          (process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000')
        await fetch(`${baseUrl}/api/automations/intake`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-automation-secret': process.env.AUTOMATION_SECRET || '',
          },
          body: JSON.stringify({ client_id: clientId }),
        })
      } catch {
        // Non-fatal: client record saved, automation can be retried manually
      }
    }

    revalidatePath('/admin/onboarding')
    return { success: true, clientId }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
