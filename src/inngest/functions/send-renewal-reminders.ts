import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendRenewalReminderEmail } from '@/lib/email/service-emails'

/**
 * Send renewal reminder emails
 *
 * Runs daily at 9 AM UTC
 * Finds subscriptions renewing in 7 days
 * Sends reminder email about upcoming renewal
 */
export const sendRenewalReminders = inngest.createFunction(
  {
    id: 'send-renewal-reminders',
    name: 'Send Renewal Reminder Emails',
    retries: 3,
  },
  { cron: '0 9 * * *' }, // Daily at 9 AM UTC
  async ({ step }) => {
    const results = await step.run('find-upcoming-renewals', async () => {
      const supabase = createAdminClient()

      // Find subscriptions renewing in 7 days
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

      const eightDaysFromNow = new Date()
      eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8)

      const { data: subscriptions, error } = await supabase
        .from('service_subscriptions')
        .select(`
          id,
          workspace_id,
          monthly_price,
          current_period_end,
          cancel_at_period_end,
          service_tiers (
            name
          ),
          users!inner (
            email,
            full_name
          )
        `)
        .eq('status', 'active')
        .eq('cancel_at_period_end', false)
        .gte('current_period_end', sevenDaysFromNow.toISOString())
        .lt('current_period_end', eightDaysFromNow.toISOString())

      if (error) {
        console.error('[Inngest] Error fetching upcoming renewals:', error)
        throw error
      }

      return subscriptions || []
    })

    // Send renewal reminder emails
    const emailResults = await step.run('send-renewal-emails', async () => {
      const sent = []
      const failed = []

      for (const subscription of results) {
        try {
          const tier = subscription.service_tiers as any
          const user = Array.isArray(subscription.users) ? subscription.users[0] : subscription.users

          await sendRenewalReminderEmail({
            customerEmail: user.email,
            customerName: user.full_name || user.email.split('@')[0],
            tierName: tier.name,
            amount: subscription.monthly_price,
            renewalDate: subscription.current_period_end,
          })

          sent.push(subscription.id)
        } catch (error: any) {
          console.error(`[Inngest] Failed to send renewal reminder for ${subscription.id}:`, error)
          failed.push({ id: subscription.id, error: error.message })
        }
      }

      return { sent, failed }
    })

    return {
      message: 'Renewal reminders processed',
      total: results.length,
      sent: emailResults.sent.length,
      failed: emailResults.failed.length,
      failures: emailResults.failed,
    }
  }
)
