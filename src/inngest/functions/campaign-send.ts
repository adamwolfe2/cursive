// Campaign Email Send Functions
// Handles sending approved emails via EmailBison

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { EmailBisonClient } from '@/lib/services/emailbison'
import { isEmailSuppressed } from '@/lib/services/campaign/suppression.service'
import { checkSendLimits, incrementSendCount } from '@/lib/services/campaign/send-limits.service'

// Mock flag for development when API keys aren't available
const USE_MOCKS = !process.env.EMAILBISON_API_KEY

// Create EmailBison client (only if API key available)
function getEmailBisonClient(): EmailBisonClient | null {
  const apiKey = process.env.EMAILBISON_API_KEY
  if (!apiKey) return null

  return new EmailBisonClient({
    apiKey,
    baseUrl: process.env.EMAILBISON_API_URL,
  })
}

// Send a single approved email
export const sendApprovedEmail = inngest.createFunction(
  {
    id: 'campaign-send-email',
    name: 'Send Approved Email',
    retries: 3,
    throttle: {
      limit: 30,
      period: '1m',
    },
  },
  { event: 'campaign/send-email' },
  async ({ event, step, logger }) => {
    const { email_send_id, campaign_lead_id, workspace_id } = event.data

    // Step 1: Fetch email send record
    const emailSend = await step.run('fetch-email-send', async () => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('email_sends')
        .select(`
          *,
          campaign:email_campaigns!campaign_id(
            id,
            name,
            sequence_settings
          )
        `)
        .eq('id', email_send_id)
        .single()

      if (error) {
        throw new Error(`Failed to fetch email send: ${error.message}`)
      }

      if (data.status !== 'approved') {
        throw new Error(`Email ${email_send_id} is not approved (status: ${data.status})`)
      }

      return data
    })

    logger.info(`Sending email ${email_send_id} to ${emailSend.recipient_email}`)

    // Step 2: Check suppression list
    const suppressionCheck = await step.run('check-suppression', async () => {
      return await isEmailSuppressed(emailSend.recipient_email, workspace_id)
    })

    if (suppressionCheck.isSuppressed) {
      logger.info(`Email ${emailSend.recipient_email} is suppressed (${suppressionCheck.reason}), skipping send`)

      // Update email status to indicate suppression
      await step.run('mark-suppressed', async () => {
        const supabase = await createClient()
        await supabase
          .from('email_sends')
          .update({
            status: 'suppressed',
            send_metadata: {
              suppression_reason: suppressionCheck.reason,
              suppressed_at: suppressionCheck.suppressedAt,
            },
          })
          .eq('id', email_send_id)
      })

      return {
        success: false,
        email_send_id,
        reason: 'suppressed',
        suppression_reason: suppressionCheck.reason,
      }
    }

    // Step 3: Check daily send limits
    const limitsCheck = await step.run('check-send-limits', async () => {
      return await checkSendLimits(emailSend.campaign_id, workspace_id)
    })

    if (!limitsCheck.canSend) {
      logger.info(`Send limit reached (${limitsCheck.limitType}), deferring email ${email_send_id}`)

      // Update email status to indicate rate limit
      await step.run('mark-rate-limited', async () => {
        const supabase = await createClient()
        await supabase
          .from('email_sends')
          .update({
            status: 'rate_limited',
            send_metadata: {
              limit_type: limitsCheck.limitType,
              campaign_limit: limitsCheck.campaignLimit,
              campaign_sent: limitsCheck.campaignSent,
              workspace_limit: limitsCheck.workspaceLimit,
              workspace_sent: limitsCheck.workspaceSent,
              limited_at: new Date().toISOString(),
            },
          })
          .eq('id', email_send_id)
      })

      return {
        success: false,
        email_send_id,
        reason: 'rate_limited',
        limit_type: limitsCheck.limitType,
        campaign_remaining: limitsCheck.campaignRemaining,
        workspace_remaining: limitsCheck.workspaceRemaining,
      }
    }

    // Step 5: Send via EmailBison or mock
    const sendResult = await step.run('send-email', async () => {
      if (USE_MOCKS) {
        logger.info('[MOCK] Simulating email send')
        return {
          success: true,
          message_id: `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          sent_at: new Date().toISOString(),
        }
      }

      const client = getEmailBisonClient()
      if (!client) {
        throw new Error('EmailBison client not available')
      }

      const accountId = process.env.EMAILBISON_DEFAULT_ACCOUNT_ID
        ? parseInt(process.env.EMAILBISON_DEFAULT_ACCOUNT_ID)
        : undefined

      return await client.sendEmail({
        to_email: emailSend.recipient_email,
        to_name: emailSend.recipient_name || undefined,
        subject: emailSend.subject,
        body_html: emailSend.body_html,
        body_text: emailSend.body_text || undefined,
        account_id: accountId,
        tracking_id: email_send_id,
      })
    })

    // Step 6: Increment send counts
    await step.run('increment-send-count', async () => {
      const success = await incrementSendCount(emailSend.campaign_id, workspace_id)
      if (!success) {
        logger.warn(`Failed to increment send count for campaign ${emailSend.campaign_id}`)
      }
    })

    // Step 7: Update email_sends record
    await step.run('update-email-record', async () => {
      const supabase = await createClient()

      const { error } = await supabase
        .from('email_sends')
        .update({
          status: 'sent',
          sent_at: sendResult.sent_at,
          emailbison_message_id: sendResult.message_id,
          send_metadata: {
            sent_via: USE_MOCKS ? 'mock' : 'emailbison',
            sent_at: sendResult.sent_at,
          },
        })
        .eq('id', email_send_id)

      if (error) {
        throw new Error(`Failed to update email send record: ${error.message}`)
      }

      logger.info(`Email ${email_send_id} marked as sent`)
    })

    // Step 8: Update campaign_lead record
    await step.run('update-campaign-lead', async () => {
      const supabase = await createClient()

      // Get current campaign lead
      const { data: campaignLead, error: fetchError } = await supabase
        .from('campaign_leads')
        .select('current_step')
        .eq('id', campaign_lead_id)
        .single()

      if (fetchError) {
        logger.warn(`Failed to fetch campaign lead: ${fetchError.message}`)
        return
      }

      // Update with new step and last sent time
      const { error: updateError } = await supabase
        .from('campaign_leads')
        .update({
          last_email_sent_at: sendResult.sent_at,
          current_step: (campaignLead.current_step || 0) + 1,
          status: 'in_sequence',
        })
        .eq('id', campaign_lead_id)

      if (updateError) {
        throw new Error(`Failed to update campaign lead: ${updateError.message}`)
      }

      logger.info(`Campaign lead ${campaign_lead_id} updated to step ${(campaignLead.current_step || 0) + 1}`)
    })

    // Step 9: Emit email-sent event for sequence completion tracking
    const currentStep = emailSend.step_number || emailSend.sequence_step || 1
    await step.run('emit-sent-event', async () => {
      await inngest.send({
        name: 'campaign/email-sent',
        data: {
          email_send_id,
          campaign_lead_id,
          campaign_id: emailSend.campaign_id,
          workspace_id,
          sequence_step: currentStep,
        },
      })
    })

    return {
      success: true,
      email_send_id,
      message_id: sendResult.message_id,
      sent_at: sendResult.sent_at,
      sequence_step: currentStep,
    }
  }
)

// Batch send approved emails for a campaign
export const batchSendApprovedEmails = inngest.createFunction(
  {
    id: 'campaign-batch-send',
    name: 'Batch Send Approved Emails',
    retries: 2,
  },
  { event: 'campaign/batch-send' },
  async ({ event, step, logger }) => {
    const { campaign_id, workspace_id, limit = 50 } = event.data

    // Fetch approved emails ready to send
    const approvedEmails = await step.run('fetch-approved-emails', async () => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('email_sends')
        .select('id, lead_id')
        .eq('campaign_id', campaign_id)
        .eq('status', 'approved')
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) {
        throw new Error(`Failed to fetch approved emails: ${error.message}`)
      }

      return data || []
    })

    logger.info(`Found ${approvedEmails.length} approved emails to send`)

    if (approvedEmails.length === 0) {
      return { success: true, campaign_id, emails_queued: 0 }
    }

    // Get campaign_lead_id for each email
    const emailsWithLeads = await step.run('get-campaign-leads', async () => {
      const supabase = await createClient()

      const leadIds = [...new Set(approvedEmails.map(e => e.lead_id))]

      const { data, error } = await supabase
        .from('campaign_leads')
        .select('id, lead_id')
        .eq('campaign_id', campaign_id)
        .in('lead_id', leadIds)

      if (error) {
        throw new Error(`Failed to fetch campaign leads: ${error.message}`)
      }

      const leadToCampaignLead = new Map(
        (data || []).map(cl => [cl.lead_id, cl.id])
      )

      return approvedEmails.map(e => ({
        email_send_id: e.id,
        campaign_lead_id: leadToCampaignLead.get(e.lead_id),
      }))
    })

    // Send individual events for each email
    await step.run('queue-send-events', async () => {
      const events = emailsWithLeads
        .filter(e => e.campaign_lead_id)
        .map((e) => ({
          name: 'campaign/send-email' as const,
          data: {
            email_send_id: e.email_send_id,
            campaign_lead_id: e.campaign_lead_id,
            workspace_id,
          },
        }))

      if (events.length > 0) {
        await inngest.send(events)
      }
    })

    return {
      success: true,
      campaign_id,
      emails_queued: emailsWithLeads.filter(e => e.campaign_lead_id).length,
    }
  }
)

// Handler for when an email is approved - triggers send immediately or schedules
export const onEmailApproved = inngest.createFunction(
  {
    id: 'campaign-email-approved',
    name: 'Handle Email Approval',
    retries: 2,
  },
  { event: 'campaign/email-approved' },
  async ({ event, step, logger }) => {
    const { email_send_id, campaign_lead_id, workspace_id } = event.data

    // Fetch email to check campaign settings
    const { campaign, emailSend } = await step.run('fetch-context', async () => {
      const supabase = await createClient()

      const { data: email, error: emailError } = await supabase
        .from('email_sends')
        .select(`
          *,
          campaign:email_campaigns!campaign_id(
            id,
            sequence_settings,
            status
          )
        `)
        .eq('id', email_send_id)
        .single()

      if (emailError) {
        throw new Error(`Failed to fetch email: ${emailError.message}`)
      }

      return { campaign: email.campaign, emailSend: email }
    })

    // Check if campaign is active
    if (campaign.status !== 'active') {
      logger.info(`Campaign ${campaign.id} is not active, email will be sent when activated`)
      return { success: true, status: 'waiting_for_activation' }
    }

    // Check send schedule in campaign settings
    const settings = campaign.sequence_settings as {
      send_immediately?: boolean
      send_window?: { start_hour: number; end_hour: number; timezone: string }
    } | null

    if (settings?.send_immediately !== false) {
      // Send immediately
      await step.run('trigger-send', async () => {
        await inngest.send({
          name: 'campaign/send-email',
          data: {
            email_send_id,
            campaign_lead_id,
            workspace_id,
          },
        })
      })

      return { success: true, status: 'queued_for_send' }
    }

    // Check if within send window
    const window = settings?.send_window
    if (window) {
      const now = new Date()
      // Simple hour check - would need proper timezone handling in production
      const currentHour = now.getHours()

      if (currentHour >= window.start_hour && currentHour < window.end_hour) {
        await step.run('trigger-send-in-window', async () => {
          await inngest.send({
            name: 'campaign/send-email',
            data: {
              email_send_id,
              campaign_lead_id,
              workspace_id,
            },
          })
        })

        return { success: true, status: 'queued_for_send' }
      }

      logger.info(`Outside send window (${window.start_hour}-${window.end_hour}), email will be sent later`)
      return { success: true, status: 'waiting_for_window' }
    }

    // Default: queue for send
    await step.run('trigger-send-default', async () => {
      await inngest.send({
        name: 'campaign/send-email',
        data: {
          email_send_id,
          campaign_lead_id,
          workspace_id,
        },
      })
    })

    return { success: true, status: 'queued_for_send' }
  }
)
