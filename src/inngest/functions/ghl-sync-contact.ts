/**
 * GHL Sync Contact
 *
 * Sync a lead from Cursive's database to the CLIENT's own GHL account
 * (via their OAuth connection stored in crm_connections table).
 *
 * This is SEPARATE from ghl-onboard-customer.ts which syncs to Cursive's GHL.
 *
 * Trigger: ghl/sync-contact (single lead)
 * Trigger: ghl/bulk-sync (batch of leads)
 */

import { inngest } from '../client'
import {
  syncContactToGhl,
  getGhlConnection,
  createGhlOpportunity,
} from '@/lib/services/integrations/gohighlevel.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

/**
 * Sync a single lead to the client's GHL account
 */
export const ghlSyncContact = inngest.createFunction(
  {
    id: 'ghl-sync-contact',
    name: 'GHL Sync Contact to Client Account',
    retries: 3,
  },
  { event: 'ghl/sync-contact' },
  async ({ event, step }) => {
    const { workspace_id, lead_id } = event.data

    // Step 1: Check if workspace has GHL connection
    const connection = await step.run('check-connection', async () => {
      const conn = await getGhlConnection(workspace_id)
      if (!conn) {
        safeLog(`[GHL Sync] No GHL connection for workspace ${workspace_id}, skipping`)
        return null
      }
      return { id: conn.id, locationId: conn.locationId }
    })

    if (!connection) {
      return { success: false, reason: 'no_connection' }
    }

    // Step 2: Fetch lead from database
    const lead = await step.run('fetch-lead', async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('leads')
        .select('first_name, last_name, email, phone, company_name, company_industry, state, seniority_level, intent_score_calculated')
        .eq('id', lead_id)
        .maybeSingle()

      if (error || !data) {
        throw new Error(`Lead not found: ${lead_id}`)
      }
      return data
    })

    // Step 3: Sync to client's GHL
    const result = await step.run('sync-to-ghl', async () => {
      const syncResult = await syncContactToGhl(workspace_id, {
        firstName: lead.first_name,
        lastName: lead.last_name,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        companyName: lead.company_name || undefined,
        source: 'Cursive Leads',
        tags: [
          'cursive-lead',
          ...(lead.company_industry ? [`industry-${lead.company_industry.toLowerCase().replace(/\s+/g, '-')}`] : []),
          ...(lead.intent_score_calculated && lead.intent_score_calculated >= 70 ? ['high-intent'] : []),
        ],
      })

      if (!syncResult.success) {
        safeError(`[GHL Sync] Failed to sync lead ${lead_id}: ${syncResult.error}`)
      }

      return syncResult
    })

    return {
      success: result.success,
      leadId: lead_id,
      ghlContactId: result.contactId,
    }
  }
)

/**
 * Bulk sync leads to the client's GHL account
 */
export const ghlBulkSync = inngest.createFunction(
  {
    id: 'ghl-bulk-sync',
    name: 'GHL Bulk Sync to Client Account',
    retries: 2,
  },
  { event: 'ghl/bulk-sync' },
  async ({ event, step }) => {
    const { workspace_id, lead_ids, create_opportunities, pipeline_id, stage_id } = event.data

    // Step 1: Verify GHL connection exists
    const connection = await step.run('check-connection', async () => {
      const conn = await getGhlConnection(workspace_id)
      if (!conn) return null
      return { id: conn.id, locationId: conn.locationId }
    })

    if (!connection) {
      return { success: false, reason: 'no_connection', synced: 0, failed: 0 }
    }

    // Step 2: Fetch all leads
    const leads = await step.run('fetch-leads', async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, email, phone, company_name, company_industry, state, seniority_level, intent_score_calculated')
        .in('id', lead_ids)

      if (error) throw new Error(`Failed to fetch leads: ${error.message}`)
      return data || []
    })

    // Step 3: Sync each lead (with rate limiting via fan-out events)
    let synced = 0
    let failed = 0

    for (const lead of leads) {
      const result = await step.run(`sync-lead-${lead.id}`, async () => {
        const syncResult = await syncContactToGhl(workspace_id, {
          firstName: lead.first_name,
          lastName: lead.last_name,
          email: lead.email || undefined,
          phone: lead.phone || undefined,
          companyName: lead.company_name || undefined,
          source: 'Cursive Leads',
          tags: ['cursive-lead', 'bulk-sync'],
        })

        // Create opportunity if requested and contact was created
        if (syncResult.success && syncResult.contactId && create_opportunities && pipeline_id && stage_id) {
          await createGhlOpportunity(workspace_id, {
            name: `${lead.first_name} ${lead.last_name} - Cursive Lead`,
            pipelineId: pipeline_id,
            stageId: stage_id,
            status: 'open',
            contactId: syncResult.contactId,
          })
        }

        return syncResult.success
      })

      if (result) {
        synced++
      } else {
        failed++
      }

      // Rate limit: 200ms between API calls
      if (leads.indexOf(lead) < leads.length - 1) {
        await step.sleep(`rate-limit-${lead.id}`, '200ms')
      }
    }

    safeLog(`[GHL Bulk Sync] Completed: ${synced}/${leads.length} synced, ${failed} failed`)

    return {
      success: true,
      totalLeads: leads.length,
      synced,
      failed,
    }
  }
)
