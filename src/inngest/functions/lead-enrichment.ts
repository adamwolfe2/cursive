// Lead Enrichment
// Enriches leads with contact data from Clay

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { ClayClient } from '@/lib/integrations/clay'
import type { LeadCompanyData } from '@/types'

export const leadEnrichment = inngest.createFunction(
  {
    id: 'lead-enrichment',
    name: 'Lead Enrichment',
    retries: 3,
    timeouts: { finish: "5m" },
  },
  { event: 'lead/enrich' },
  async ({ event, step, logger }) => {
    const { lead_id, workspace_id } = event.data

    // Step 1: Fetch lead from database
    const lead = await step.run('fetch-lead', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead_id)
        .eq('workspace_id', workspace_id)
        .maybeSingle()

      if (error) {
        logger.error('Failed to fetch lead:', error)
        throw new Error(`Failed to fetch lead: ${error.message}`)
      }

      return data
    })

    logger.info(`Enriching lead: ${lead_id} for company ${(lead.company_data as LeadCompanyData | null)?.name}`)

    // Step 2: Enrich with Clay
    const enrichmentResult = await step.run('enrich-with-clay', async () => {
      try {
        const clayClient = new ClayClient()
        const companyData = lead.company_data as LeadCompanyData | null

        if (!companyData?.domain) {
          throw new Error('Company domain not found')
        }

        // Enrich company with contact data
        const result = await clayClient.enrichCompany({
          domain: companyData.domain,
          company_name: companyData.name,
          filters: {
            job_titles: [
              'CEO',
              'CTO',
              'VP',
              'Director',
              'Head of',
              'Manager',
              'Chief',
            ],
            seniority_levels: ['executive', 'director', 'manager'],
          },
          limit: 5, // Get up to 5 contacts per company
        })

        logger.info(
          `Found ${result.contacts.length} contacts for ${companyData.name}`
        )

        return result
      } catch (error: unknown) {
        logger.error('Clay enrichment failed:', error)
        throw error
      }
    })

    // Step 3: Update lead with enriched data
    await step.run('update-lead', async () => {
      const supabase = createAdminClient()

      const updateData: Record<string, unknown> = {
        enrichment_status: 'completed',
        enriched_at: new Date().toISOString(),
      }

      if (enrichmentResult.contacts.length > 0) {
        updateData.contact_data = {
          contacts: enrichmentResult.contacts.map((contact) => ({
            id: contact.id,
            first_name: contact.first_name,
            last_name: contact.last_name,
            full_name: contact.full_name,
            email: contact.email,
            verified_email: contact.verified_email,
            phone: contact.phone,
            title: contact.title,
            seniority: contact.seniority,
            department: contact.department,
            linkedin_url: contact.linkedin_url,
            location: contact.location,
          })),
          primary_contact: enrichmentResult.contacts[0],
          total_contacts: enrichmentResult.contacts.length,
        }
      }

      // Update company info if available
      if (enrichmentResult.company_info) {
        const existingCompanyData = lead.company_data as LeadCompanyData | null
        updateData.company_data = {
          ...existingCompanyData,
          ...enrichmentResult.company_info,
        }
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', lead_id)

      if (error) {
        logger.error('Failed to update lead:', error)
        throw new Error(`Failed to update lead: ${error.message}`)
      }

      logger.info(`Lead ${lead_id} enriched successfully`)

      // Fire-and-forget: log enrichment to enrichment_log
      // Determine which fields were enriched from the contacts result
      const fieldsEnriched: string[] = []
      if (enrichmentResult.contacts.length > 0) {
        const primary = enrichmentResult.contacts[0]
        if (primary.email || primary.verified_email) fieldsEnriched.push('email')
        if (primary.phone) fieldsEnriched.push('phone')
        if (primary.linkedin_url) fieldsEnriched.push('linkedin_url')
        if (primary.title) fieldsEnriched.push('job_title')
      }
      if (enrichmentResult.company_info) {
        const ci = enrichmentResult.company_info as Record<string, unknown>
        if (ci.name) fieldsEnriched.push('company_name')
        if (ci.domain) fieldsEnriched.push('company_domain')
        if (ci.industry) fieldsEnriched.push('company_industry')
        if (ci.employee_count || ci.headcount) fieldsEnriched.push('employee_count')
      }

      void (async () => {
        try {
          const adminLog = createAdminClient()
          await adminLog.from('enrichment_log').insert({
            workspace_id,
            lead_id,
            credits_charged: 1,
            enrichment_source: 'clay',
            fields_enriched: fieldsEnriched.length > 0 ? fieldsEnriched : null,
          })
        } catch {
          // Non-blocking — don't let logging failures disrupt enrichment
        }
      })()
    })

    // Step 4: Trigger delivery
    await step.run('trigger-delivery', async () => {
      // Determine delivery channels based on workspace settings
      const supabase = createAdminClient()
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('id', workspace_id)
        .maybeSingle()

      // Check for active integrations
      const { data: integrations } = await supabase
        .from('integrations')
        .select('type, status')
        .eq('workspace_id', workspace_id)
        .eq('status', 'active')

      const deliveryChannels: ('email' | 'slack' | 'webhook')[] = ['email']

      if (integrations) {
        integrations.forEach((integration: { type: string; status: string }) => {
          if (integration.type === 'slack') deliveryChannels.push('slack')
          if (integration.type === 'webhook') deliveryChannels.push('webhook')
        })
      }

      // Send delivery event
      await inngest.send({
        name: 'lead/deliver',
        data: {
          lead_id,
          workspace_id,
          delivery_channels: deliveryChannels,
        },
      })

      logger.info(
        `Delivery triggered for lead ${lead_id} via: ${deliveryChannels.join(', ')}`
      )
    })

    // Fire outbound webhook: lead.enriched
    await step.run('fire-outbound-webhook-enriched', async () => {
      const supabase = createAdminClient()
      const { data: enrichedLead } = await supabase
        .from('leads')
        .select('id, first_name, last_name, email, phone, company_name, company_industry, enrichment_status, enriched_at')
        .eq('id', lead_id)
        .maybeSingle()

      await inngest.send({
        name: 'outbound-webhook/deliver',
        data: {
          workspace_id,
          event_type: 'lead.enriched',
          payload: {
            event: 'lead.enriched',
            timestamp: new Date().toISOString(),
            lead: enrichedLead ?? { id: lead_id },
          },
        },
      })
    })

    return {
      success: true,
      lead_id,
      contacts_found: enrichmentResult.contacts.length,
    }
  }
)

// Handle enrichment failures
// Listens for a dedicated failure event, NOT the same event as leadEnrichment.
// Previously this listened to 'lead/enrich' which caused every enrichment to
// simultaneously be marked as failed. Now it listens to 'lead/enrich.failed'
// which is sent explicitly when enrichment fails after all retries.
export const leadEnrichmentFailure = inngest.createFunction(
  {
    id: 'lead-enrichment-failure',
    name: 'Lead Enrichment Failure Handler',
    retries: 2,
    timeouts: { finish: "5m" },
  },
  { event: 'lead/enrich.failed' },
  async ({ event, step, logger }) => {
    const { lead_id, workspace_id } = event.data

    await step.run('mark-as-failed', async () => {
      const supabase = createAdminClient()

      await supabase
        .from('leads')
        .update({
          enrichment_status: 'failed',
          enriched_at: new Date().toISOString(),
        })
        .eq('id', lead_id)

      logger.warn(`Lead ${lead_id} marked as enrichment failed`)
    })

    return { success: true, lead_id, status: 'failed' }
  }
)
