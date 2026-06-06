/**
 * Funnel — First Visitor "Aha" (#3)
 *
 * Every 15 minutes. Finds funnel orders whose pixel has fired at least one
 * event but who haven't yet been told about it, fetches the most recent
 * identified visitor, and emails the buyer their "🎉 first visitor" moment —
 * the strongest retention pull we have. Marks first_visitor_notified_at so it
 * only ever sends once.
 *
 * If an event has fired but no visitor is identified yet (raw event without a
 * person), we skip WITHOUT marking, so the aha still fires on the first real
 * identified person on a later run.
 */

import { inngest } from '@/inngest/client'
import {
  findFirstVisitorCandidates,
  getOrderVisitors,
  getPortalTokenForOrder,
  markFirstVisitorNotified,
  type FunnelVisitor,
} from '@/lib/funnel/order.service'
import { sendFunnelFirstVisitorEmail } from '@/lib/email/templates/funnel-first-visitor'
import { APP_URL } from '@/lib/config/urls'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

/** Best human label for an identified visitor. */
export function visitorHeadline(v: FunnelVisitor): string | null {
  const who = v.full_name
  const where = v.company_name
  if (v.job_title && where) return `${v.job_title} at ${where}`
  if (who && where) return `${who} at ${where}`
  return who || where || null
}

export const funnelFirstVisitor = inngest.createFunction(
  {
    id: 'funnel-first-visitor',
    name: 'Funnel — First Visitor Aha',
    retries: 1,
  },
  [{ cron: '*/15 * * * *' }, { event: 'funnel/first-visitor.run' }],
  async ({ step }) => {
    const candidates = await step.run('find-candidates', async () =>
      findFirstVisitorCandidates(100)
    )

    if (candidates.length === 0) {
      return { sent: 0, skipped: 0 }
    }

    let sent = 0
    let skipped = 0

    for (const order of candidates) {
      await step.run(`notify-${order.id}`, async () => {
        if (!order.pixel_audiencelab_id) {
          skipped++
          return
        }

        const feed = await getOrderVisitors(order.pixel_audiencelab_id, {
          limit: 1,
        })
        const visitor = feed.recent[0]
        const headline = visitor ? visitorHeadline(visitor) : null

        // Event fired but no identified person yet — wait for a real one.
        if (!headline) {
          skipped++
          return
        }

        const tokenRow = await getPortalTokenForOrder(order.id)
        if (!tokenRow) {
          skipped++
          return
        }

        try {
          await sendFunnelFirstVisitorEmail({
            to: order.customer_email,
            customerName: order.customer_name,
            visitorHeadline: headline,
            companyName: visitor?.company_name ?? null,
            dashboardUrl: `${APP_URL}/api/funnel/${tokenRow.token}/dashboard-login`,
          })
          await markFirstVisitorNotified(order.id)
          sent++
        } catch (err) {
          safeError('[funnel-first-visitor] send failed', {
            order_id: order.id,
            err: (err as Error)?.message,
          })
          skipped++
        }
      })
    }

    safeLog('[funnel-first-visitor] done', { sent, skipped })
    return { sent, skipped }
  }
)
