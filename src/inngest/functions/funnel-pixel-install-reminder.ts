/**
 * Funnel — Pixel Install Reminder Cron
 *
 * Daily at 16:00 UTC (~noon ET). Finds funnel orders where:
 *   - pixel was provisioned >24h ago
 *   - no audiencelab_event has ever fired for the pixel
 *   - we haven't already sent a reminder
 *   - subscription is still active
 *
 * Sends a single "did the snippet land?" email + marks
 * pixel_install_reminded_at so we never re-send. Buyer can still
 * use "Test my install" anytime from the portal.
 */

import { inngest } from '@/inngest/client'
import {
  findPixelInstallReminderCandidates,
  getPortalTokenForOrder,
  markPixelInstallReminded,
  portalUrlForToken,
} from '@/lib/funnel/order.service'
import { sendFunnelPixelInstallReminderEmail } from '@/lib/email/templates/funnel-pixel-install-reminder'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

export const funnelPixelInstallReminder = inngest.createFunction(
  {
    id: 'funnel-pixel-install-reminder',
    name: 'Funnel — Pixel Install Reminder',
    retries: 1,
  },
  [
    { cron: '0 16 * * *' },
    { event: 'funnel/pixel-install-reminder.run' },
  ],
  async ({ step }) => {
    const candidates = await step.run('find-candidates', async () =>
      findPixelInstallReminderCandidates(50)
    )

    if (candidates.length === 0) {
      safeLog('[funnel-install-reminder] no candidates')
      return { sent: 0, skipped: 0 }
    }

    let sent = 0
    let skipped = 0

    for (const order of candidates) {
      await step.run(`send-${order.id}`, async () => {
        if (!order.pixel_snippet || !order.pixel_audiencelab_id) {
          skipped++
          return
        }
        const tokenRow = await getPortalTokenForOrder(order.id)
        if (!tokenRow) {
          skipped++
          return
        }

        try {
          await sendFunnelPixelInstallReminderEmail({
            to: order.customer_email,
            customerName: order.customer_name,
            domain: order.pixel_domain,
            snippet: order.pixel_snippet,
            portalUrl: portalUrlForToken(tokenRow.token),
            testPixelUrl: `${portalUrlForToken(tokenRow.token)}#test-pixel`,
          })
          await markPixelInstallReminded(order.id)
          sent++
        } catch (err) {
          safeError('[funnel-install-reminder] send failed', {
            order_id: order.id,
            err: (err as Error)?.message,
          })
          skipped++
        }
      })
    }

    safeLog('[funnel-install-reminder] done', { sent, skipped })
    return { sent, skipped }
  }
)
