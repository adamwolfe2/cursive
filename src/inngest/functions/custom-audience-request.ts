// Custom Audience Request Handler
// Processes custom audience requests with confirmation email, 24h follow-up, and Slack reminders

import { inngest } from '../client'
import { safeError } from '@/lib/utils/log-sanitizer'
import { sendCustomAudienceConfirmationEmail } from '@/lib/email/service'

export const handleCustomAudienceRequest = inngest.createFunction(
  { id: 'handle-custom-audience-request', retries: 2 },
  { event: 'marketplace/custom-audience-requested' },
  async ({ event, step, logger }) => {
    const { request_id, workspace_id, user_id, user_email, industry, volume } = event.data

    // Step 1: Send confirmation email to user
    await step.run('send-confirmation-email', async () => {
      logger.info(`[Custom Audience] Sending confirmation email to ${user_email}`)

      // Look up user's display name
      let userName = user_email.split('@')[0]
      if (user_id) {
        try {
          const { createAdminClient } = await import('@/lib/supabase/admin')
          const supabase = createAdminClient()
          const { data: userData } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', user_id)
            .maybeSingle()
          if (userData?.first_name) {
            userName = [userData.first_name, userData.last_name].filter(Boolean).join(' ')
          }
        } catch {
          // fallback to email prefix if lookup fails
        }
      }

      const result = await sendCustomAudienceConfirmationEmail(
        user_email,
        userName,
        industry,
        volume
      )
      if (!result.success) {
        safeError('[Custom Audience] Failed to send confirmation email:', result.error)
      }
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
