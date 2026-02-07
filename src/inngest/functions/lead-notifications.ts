/**
 * Lead Notification Inngest Function
 * Cursive Platform
 *
 * Sends notifications to configured Slack and Zapier webhooks
 * when a new lead is created or identified.
 *
 * Triggered by the 'lead/created' event.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyNewLead } from '@/lib/services/lead-notifications.service'
import type { LeadNotification } from '@/lib/services/lead-notifications.service'

function getSupabaseAdmin() {
  return createAdminClient()
}

export const sendLeadNotifications = inngest.createFunction(
  {
    id: 'send-lead-notifications',
    retries: 2,
    timeouts: { finish: '30s' },
  },
  { event: 'lead/created' },
  async ({ event, step }) => {
    const { lead_id, workspace_id } = event.data

    // Fetch lead data from the database
    const lead = await step.run('get-lead-data', async () => {
      const supabase = getSupabaseAdmin()

      const { data, error } = await supabase
        .from('leads')
        .select(
          'id, email, first_name, last_name, company_name, contact_title, job_title, phone, city, state, linkedin_url, intent_score, lead_score, status, source, created_at'
        )
        .eq('id', lead_id)
        .single()

      if (error) {
        console.log(
          `[Lead Notifications] Lead not found (${lead_id}), skipping notifications: ${error.message}`
        )
        return null
      }

      return data
    })

    // Skip if lead not found (may have been deleted)
    if (!lead) {
      return { skipped: true, reason: 'Lead not found' }
    }

    // Build the notification payload
    const notification: LeadNotification = {
      lead_id: lead.id,
      email: lead.email || undefined,
      first_name: lead.first_name || undefined,
      last_name: lead.last_name || undefined,
      company_name: lead.company_name || undefined,
      title: lead.contact_title || lead.job_title || undefined,
      phone: lead.phone || undefined,
      city: lead.city || undefined,
      state: lead.state || undefined,
      linkedin_url: lead.linkedin_url || undefined,
      intent_score: lead.intent_score ?? lead.lead_score ?? undefined,
      status: lead.status || undefined,
      source: lead.source || undefined,
      created_at: lead.created_at || undefined,
    }

    // Send notifications to all configured channels
    const result = await step.run('notify-channels', async () => {
      return await notifyNewLead(workspace_id, notification)
    })

    return {
      success: true,
      lead_id,
      workspace_id,
      notifications: result,
    }
  }
)
