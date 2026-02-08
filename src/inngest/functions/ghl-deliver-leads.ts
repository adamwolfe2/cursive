/**
 * GHL Deliver Leads
 *
 * Push purchased leads from Cursive's database into a client's GHL sub-account.
 * Used for done-for-you clients where leads are delivered directly to their CRM.
 *
 * Trigger: ghl-admin/deliver-leads
 * Steps:
 *   1. Fetch lead data from Cursive DB
 *   2. Map leads to GHL contact format
 *   3. Deliver leads in batches (rate limited)
 *   4. Record delivery results
 */

import { inngest } from '../client'
import {
  deliverLeadsToSubAccount,
  mapCursiveLeadToGhlContact,
} from '@/lib/integrations/ghl-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const BATCH_SIZE = 50 // GHL rate limit safe batch size

export const ghlDeliverLeads = inngest.createFunction(
  {
    id: 'ghl-deliver-leads',
    name: 'GHL Deliver Leads',
    retries: 3,
  },
  { event: 'ghl-admin/deliver-leads' },
  async ({ event, step }) => {
    const { client_location_id, workspace_id, lead_ids, batch_id } = event.data

    safeLog(`[GHL Deliver] Starting delivery of ${lead_ids.length} leads to location ${client_location_id}`)

    // Step 1: Fetch lead data from database
    const leads = await step.run('fetch-leads', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('leads')
        .select(
          'id, first_name, last_name, email, phone, company_name, company_industry, company_size, state, seniority_level, intent_score_calculated'
        )
        .in('id', lead_ids)

      if (error) {
        throw new Error(`Failed to fetch leads: ${error.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error('No leads found for the given IDs')
      }

      safeLog(`[GHL Deliver] Fetched ${data.length} leads from database`)
      return data
    })

    // Step 2: Deliver leads in batches
    let totalDelivered = 0
    let totalFailed = 0
    const batches = Math.ceil(leads.length / BATCH_SIZE)

    for (let i = 0; i < batches; i++) {
      const batchLeads = leads.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)

      const batchResult = await step.run(`deliver-batch-${i}`, async () => {
        // Map Cursive leads to GHL contact format
        const ghlContacts = batchLeads.map((lead) => {
          const mapped = mapCursiveLeadToGhlContact(lead)
          return {
            firstName: mapped.firstName,
            lastName: mapped.lastName,
            email: mapped.email || '',
            phone: mapped.phone,
            companyName: mapped.companyName,
            industry: lead.company_industry || undefined,
            state: lead.state || undefined,
            source: 'Cursive Leads',
            tags: mapped.tags,
          }
        })

        const result = await deliverLeadsToSubAccount(
          client_location_id,
          ghlContacts
        )

        safeLog(
          `[GHL Deliver] Batch ${i + 1}/${batches}: ${result.delivered} delivered, ${result.failed} failed`
        )

        return result
      })

      totalDelivered += batchResult.delivered
      totalFailed += batchResult.failed
    }

    // Step 3: Record delivery results
    await step.run('record-results', async () => {
      const supabase = createAdminClient()

      // Log the delivery event
      await supabase.from('audit_logs').insert({
        workspace_id,
        user_id: null,
        action: 'ghl_lead_delivery',
        resource_type: 'integration',
        metadata: {
          location_id: client_location_id,
          total_leads: lead_ids.length,
          delivered: totalDelivered,
          failed: totalFailed,
          batch_id: batch_id || null,
        },
        severity: 'info',
      })

      safeLog(
        `[GHL Deliver] Complete: ${totalDelivered}/${lead_ids.length} delivered, ${totalFailed} failed`
      )
    })

    return {
      success: true,
      totalLeads: lead_ids.length,
      delivered: totalDelivered,
      failed: totalFailed,
      locationId: client_location_id,
    }
  }
)
