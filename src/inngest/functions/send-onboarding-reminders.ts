import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { sendOnboardingReminderEmail } from '@/lib/email/service-emails'

/**
 * Send onboarding reminder emails
 *
 * Runs daily at 10 AM UTC
 * Finds subscriptions created 3+ days ago with incomplete onboarding
 * Sends reminder email to complete onboarding
 */
export const sendOnboardingReminders = inngest.createFunction(
  {
    id: 'send-onboarding-reminders',
    name: 'Send Onboarding Reminder Emails',
    retries: 3,
  },
  { cron: '0 10 * * *' }, // Daily at 10 AM UTC
  async ({ step }) => {
    const results = await step.run('find-incomplete-onboarding', async () => {
      const supabase = await createClient()

      // Find subscriptions created 3+ days ago with incomplete onboarding
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      const { data: subscriptions, error } = await supabase
        .from('service_subscriptions')
        .select(`
          id,
          workspace_id,
          onboarding_completed,
          created_at,
          service_tiers (
            name,
            onboarding_required
          ),
          users!inner (
            email,
            full_name
          )
        `)
        .eq('onboarding_completed', false)
        .in('status', ['onboarding', 'active'])
        .lte('created_at', threeDaysAgo.toISOString())

      if (error) {
        console.error('[Inngest] Error fetching incomplete onboarding:', error)
        throw error
      }

      return subscriptions || []
    })

    console.log(`[Inngest] Found ${results.length} subscriptions needing onboarding reminder`)

    // Send reminder emails
    const emailResults = await step.run('send-reminder-emails', async () => {
      const sent = []
      const failed = []

      for (const subscription of results) {
        try {
          const tier = subscription.service_tiers as any
          const user = Array.isArray(subscription.users) ? subscription.users[0] : subscription.users

          // Skip if tier doesn't require onboarding
          if (!tier?.onboarding_required) {
            console.log(`[Inngest] Skipping ${subscription.id} - onboarding not required`)
            continue
          }

          await sendOnboardingReminderEmail({
            customerEmail: user.email,
            customerName: user.full_name || user.email.split('@')[0],
            tierName: tier.name,
          })

          sent.push(subscription.id)
          console.log(`[Inngest] Sent onboarding reminder to ${user.email}`)
        } catch (error: any) {
          console.error(`[Inngest] Failed to send reminder for ${subscription.id}:`, error)
          failed.push({ id: subscription.id, error: error.message })
        }
      }

      return { sent, failed }
    })

    return {
      message: 'Onboarding reminders processed',
      total: results.length,
      sent: emailResults.sent.length,
      failed: emailResults.failed.length,
      failures: emailResults.failed,
    }
  }
)
