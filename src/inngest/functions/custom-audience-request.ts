// Custom Audience Request Handler
// Processes custom audience requests with confirmation email, 24h follow-up, and Slack reminders

import { inngest } from '../client'
import { safeError } from '@/lib/utils/log-sanitizer'

export const handleCustomAudienceRequest = inngest.createFunction(
  { id: 'handle-custom-audience-request', retries: 2 },
  { event: 'marketplace/custom-audience-requested' },
  async ({ event, step, logger }) => {
    const { request_id, workspace_id, user_id, user_email, industry, volume } = event.data

    // Step 1: Send confirmation email to user
    await step.run('send-confirmation-email', async () => {
      logger.info(`[Custom Audience] Confirmation email queued for ${user_email}`)
      // TODO: send confirmation email via Resend
      // "We received your custom audience request for {industry} leads"
      // "Expect a 25-lead sample within 48 hours"
    })

    // Step 2: Wait 24 hours, then check if internal team has responded
    await step.sleep('wait-24h', '24h')

    const responded = await step.run('check-response', async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()

      const { data: request } = await supabase
        .from('custom_audience_requests')
        .select('status')
        .eq('id', request_id)
        .single()

      return request?.status !== 'pending'
    })

    if (!responded) {
      // Send reminder to sales team
      await step.run('send-reminder', async () => {
        logger.info(`[Custom Audience] 24h reminder: Request ${request_id} not yet actioned`)

        // Send Slack reminder
        const slackUrl = process.env.SLACK_SALES_WEBHOOK_URL
        if (slackUrl) {
          try {
            await fetch(slackUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: `Reminder: Custom audience request ${request_id} from ${user_email} has not been actioned in 24 hours. Industry: ${industry}, Volume: ${volume}.`,
              }),
            })
          } catch (e) {
            safeError('[Custom Audience] Failed to send Slack reminder:', e)
          }
        }
      })
    }

    return { request_id, responded }
  }
)
