/**
 * Campaign Sequence Processor
 * Processes email sequences for active campaigns
 * - Finds leads ready for next email
 * - Composes emails
 * - Queues for human review or auto-sends
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getLeadsReadyForSend,
  updateCampaignLeadOptimalTimes,
} from '@/lib/services/campaign/timezone-scheduling.service'

/**
 * Process campaign sequences
 * Runs hourly to find leads ready for their next email
 */
export const processCampaignSequences = inngest.createFunction(
  {
    id: 'process-campaign-sequences',
    name: 'Process Campaign Sequences',
    retries: 2,
    timeouts: { finish: "5m" },
  },
  { cron: '0 * * * *' }, // Every hour
  async ({ step, logger }) => {
    const now = new Date().toISOString()

    // Step 1: Get all active campaigns
    const activeCampaigns = await step.run('get-active-campaigns', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('email_campaigns')
        .select('id, workspace_id, name, sequence_steps, auto_send_approved, send_window_start, send_window_end, send_timezone, send_days')
        .eq('status', 'active')

      if (error) {
        logger.error(`Failed to fetch active campaigns: ${error.message}`)
        return []
      }

      return data || []
    })

    logger.info(`Found ${activeCampaigns.length} active campaigns`)

    if (activeCampaigns.length === 0) {
      return { processed: 0, campaigns: 0 }
    }

    // Step 2: For each campaign, find leads ready for next email (timezone-aware)
    // Data gathering is separated from event emission to prevent duplicate events on retry
    const campaignReadyLeads = await step.run('gather-ready-leads', async () => {
      const supabase = createAdminClient()
      const campaignData: Array<{
        campaign_id: string
        campaign_name: string
        workspace_id: string
        auto_send: boolean
        timezone_optimized: boolean
        events: Array<{
          campaign_lead_id: string
          campaign_id: string
          lead_id: string
          workspace_id: string
          sequence_step: number
          auto_send: boolean
        }>
      }> = []

      for (const campaign of activeCampaigns) {
        // Check if we're within send window at campaign level
        if (!isWithinSendWindow(campaign)) {
          logger.info(`Campaign ${campaign.name} is outside send window, skipping`)
          continue
        }

        // Use timezone-aware lead selection
        let readyLeads: Array<{ campaignLeadId: string; leadId: string }> = []
        let timezoneOptimized = false

        try {
          const tzLeads = await getLeadsReadyForSend(campaign.id, 50)
          readyLeads = tzLeads.map((l) => ({
            campaignLeadId: l.campaignLeadId,
            leadId: l.leadId,
          }))
          timezoneOptimized = true
        } catch {
          const { data, error } = await supabase
            .from('campaign_leads')
            .select('id, lead_id, current_step')
            .eq('campaign_id', campaign.id)
            .eq('status', 'in_sequence')
            .lte('next_email_scheduled_at', now)
            .lt('current_step', campaign.sequence_steps)
            .limit(50)

          if (error) {
            logger.warn(`Failed to fetch leads for campaign ${campaign.id}: ${error.message}`)
            continue
          }

          readyLeads = (data || []).map((l) => ({
            campaignLeadId: l.id,
            leadId: l.lead_id,
          }))
        }

        if (readyLeads.length === 0) {
          continue
        }

        logger.info(`Campaign ${campaign.name}: ${readyLeads.length} leads ready (timezone_optimized=${timezoneOptimized})`)

        // Get current step for each lead
        const { data: leadSteps } = await supabase
          .from('campaign_leads')
          .select('id, current_step')
          .in('id', readyLeads.map((l) => l.campaignLeadId))

        const stepMap = new Map((leadSteps || []).map((l) => [l.id, l.current_step || 0]))

        // Build event data (no side effects yet)
        const events = readyLeads.map((lead) => ({
          campaign_lead_id: lead.campaignLeadId,
          campaign_id: campaign.id,
          lead_id: lead.leadId,
          workspace_id: campaign.workspace_id,
          sequence_step: (stepMap.get(lead.campaignLeadId) || 0) + 1,
          auto_send: campaign.auto_send_approved,
        }))

        campaignData.push({
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          workspace_id: campaign.workspace_id,
          auto_send: campaign.auto_send_approved,
          timezone_optimized: timezoneOptimized,
          events,
        })
      }

      return campaignData
    })

    // Step 3: Emit compose events per campaign (isolated side effects)
    // Each campaign gets its own step so a failure in one doesn't re-emit events for others
    const results: Array<{
      campaign_id: string
      leads_queued: number
      auto_send: boolean
      timezone_optimized: boolean
    }> = []

    for (const campaign of campaignReadyLeads) {
      await step.run(`queue-compose-${campaign.campaign_id}`, async () => {
        const events = campaign.events.map((e) => ({
          name: 'campaign/compose-email' as const,
          data: e,
        }))

        if (events.length > 0) {
          await inngest.send(events)
        }
      })

      results.push({
        campaign_id: campaign.campaign_id,
        leads_queued: campaign.events.length,
        auto_send: campaign.auto_send,
        timezone_optimized: campaign.timezone_optimized,
      })
    }

    const totalLeads = results.reduce((sum, r) => sum + r.leads_queued, 0)
    logger.info(`Processed ${results.length} campaigns, queued ${totalLeads} emails`)

    return {
      campaigns: results.length,
      processed: totalLeads,
      details: results,
    }
  }
)

/**
 * Handle composed email for auto-send
 * If campaign has auto_send_approved, automatically approve follow-up emails
 */
export const handleAutoSendEmail = inngest.createFunction(
  {
    id: 'handle-auto-send-email',
    name: 'Handle Auto-Send Email',
    retries: 3,
    timeouts: { finish: "5m" },
  },
  { event: 'campaign/email-composed' },
  async ({ event, step, logger }) => {
    const { email_send_id, campaign_id, workspace_id, sequence_step, auto_send } = event.data

    // Only auto-send follow-up emails (step 2+), not the first email
    if (!auto_send || sequence_step <= 1) {
      logger.info(`Email ${email_send_id} requires manual review (auto_send=${auto_send}, step=${sequence_step})`)
      return { auto_sent: false, reason: 'manual_review_required' }
    }

    logger.info(`Auto-approving follow-up email ${email_send_id} (step ${sequence_step})`)

    // Step 1: Update email status to approved
    await step.run('approve-email', async () => {
      const supabase = createAdminClient()

      const { error } = await supabase
        .from('email_sends')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', email_send_id)
        .eq('status', 'pending_approval') // Only approve if still pending

      if (error) {
        throw new Error(`Failed to approve email: ${error.message}`)
      }
    })

    // Step 2: Trigger sending
    await step.run('trigger-send', async () => {
      await inngest.send({
        name: 'campaign/email-approved',
        data: {
          email_send_id,
          campaign_lead_id: event.data.campaign_lead_id,
          workspace_id,
        },
      })
    })

    return { auto_sent: true, email_send_id }
  }
)

/**
 * Mark leads as completed when they finish the sequence
 * Runs after each email send to check completion
 */
export const checkSequenceCompletion = inngest.createFunction(
  {
    id: 'check-sequence-completion',
    name: 'Check Sequence Completion',
    retries: 3,
    timeouts: { finish: "5m" },
  },
  { event: 'campaign/email-sent' },
  async ({ event, step, logger }) => {
    const { campaign_lead_id, campaign_id, sequence_step } = event.data

    // Step 1: Check if sequence is complete
    const isComplete = await step.run('check-completion', async () => {
      const supabase = createAdminClient()

      // Get campaign sequence steps
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .select('sequence_steps')
        .eq('id', campaign_id)
        .maybeSingle()

      if (campaignError || !campaign) {
        logger.warn(`Could not fetch campaign ${campaign_id}`)
        return false
      }

      return sequence_step >= campaign.sequence_steps
    })

    if (!isComplete) {
      return { completed: false }
    }

    // Step 2: Mark lead as completed
    await step.run('mark-completed', async () => {
      const supabase = createAdminClient()

      const { error } = await supabase
        .from('campaign_leads')
        .update({
          status: 'completed',
          sequence_completed_at: new Date().toISOString(),
          next_email_scheduled_at: null, // No more emails
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaign_lead_id)

      if (error) {
        logger.warn(`Failed to mark lead as completed: ${error.message}`)
      }
    })

    logger.info(`Lead ${campaign_lead_id} completed sequence for campaign ${campaign_id}`)
    return { completed: true, campaign_lead_id }
  }
)

/**
 * Helper: Check if current time is within campaign send window
 */
function isWithinSendWindow(campaign: {
  send_window_start?: string
  send_window_end?: string
  send_timezone?: string
  send_days?: string[]
}): boolean {
  try {
    const now = new Date()
    const timezone = campaign.send_timezone || 'America/New_York'

    // Get current time in campaign's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'short',
    })

    const parts = formatter.formatToParts(now)
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '12')
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0')
    const weekday = parts.find((p) => p.type === 'weekday')?.value?.toLowerCase().slice(0, 3) || 'mon'

    // Check day
    const sendDays = campaign.send_days || ['mon', 'tue', 'wed', 'thu', 'fri']
    if (!sendDays.includes(weekday)) {
      return false
    }

    // Parse window times
    const startTime = campaign.send_window_start || '09:00'
    const endTime = campaign.send_window_end || '17:00'

    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)

    const currentMinutes = hour * 60 + minute
    const startMinutes = startHour * 60 + (startMin || 0)
    const endMinutes = endHour * 60 + (endMin || 0)

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  } catch {
    // If timezone handling fails, assume within window
    return true
  }
}
