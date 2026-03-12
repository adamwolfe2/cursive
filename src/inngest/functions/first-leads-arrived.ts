/**
 * First Leads Arrived Notification
 *
 * Triggered when a workspace receives its very first leads.
 * Sends a congratulatory email driving the user to their dashboard.
 *
 * Event: workspace/first-leads-arrived
 * Data:  { workspaceId, userId, userEmail, userName, leadCount, industry, location }
 */

import { inngest } from '@/inngest/client'
import { firstLeadsArrivedEmail } from '@/lib/email/templates/first-leads-arrived'
import { sendEmail } from '@/lib/email/service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

export const firstLeadsArrived = inngest.createFunction(
  {
    id: 'first-leads-arrived',
    name: 'Send First Leads Arrived Email',
    retries: 3,
    timeouts: { finish: '2m' },
  },
  { event: 'workspace/first-leads-arrived' },
  async ({ event, step }) => {
    const { userEmail, userName, leadCount, industry, location } = event.data as {
      workspaceId: string
      userId: string
      userEmail: string
      userName: string
      leadCount: number
      industry?: string | null
      location?: string | null
    }

    safeLog(`[FirstLeadsArrived] Sending email to ${userEmail} — ${leadCount} leads`)

    await step.run('send-first-leads-email', async () => {
      const template = firstLeadsArrivedEmail({
        userName: userName || userEmail.split('@')[0],
        leadCount,
        industry: industry ?? null,
        location: location ?? null,
      })

      const result = await sendEmail({
        to: userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
        tags: [
          { name: 'category', value: 'first-leads' },
          { name: 'workspace', value: event.data.workspaceId },
        ],
      })

      if (!result.success) {
        safeError(`[FirstLeadsArrived] Email failed:`, result.error)
        throw new Error(result.error || 'Failed to send first leads email')
      }

      safeLog(`[FirstLeadsArrived] Email sent: ${result.messageId}`)
      return result
    })
  }
)
