/**
 * Funnel — Weekly Visitor Digest Cron
 *
 * Friday at 14:00 UTC (~9am ET). For every active funnel order with a
 * pixel, computes a last-7d visitor summary (total + top 3 companies +
 * 5 most recent named visitors) and emails it to the buyer.
 *
 * Empty weeks get a softer "let's test the install" variant.
 *
 * Idempotent against accidental re-runs via last_visitor_digest_at — the
 * candidate query only selects orders >6d since last send.
 */

import { inngest } from '@/inngest/client'
import {
  findVisitorDigestCandidates,
  getOrderVisitors,
  getPortalTokenForOrder,
  markVisitorDigestSent,
  portalUrlForToken,
  type FunnelVisitor,
} from '@/lib/funnel/order.service'
import {
  sendFunnelVisitorDigestEmail,
  type DigestCompany,
} from '@/lib/email/templates/funnel-visitor-digest'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

export const funnelVisitorDigest = inngest.createFunction(
  {
    id: 'funnel-visitor-digest',
    name: 'Funnel — Weekly Visitor Digest',
    retries: 1,
  },
  [
    { cron: '0 14 * * 5' }, // Fridays 14:00 UTC
    { event: 'funnel/visitor-digest.run' },
  ],
  async ({ step }) => {
    const candidates = await step.run('find-candidates', async () =>
      findVisitorDigestCandidates(200)
    )

    if (candidates.length === 0) {
      safeLog('[funnel-digest] no candidates')
      return { sent: 0 }
    }

    let sent = 0

    for (const order of candidates) {
      if (!order.pixel_audiencelab_id) continue

      await step.run(`digest-${order.id}`, async () => {
        const tokenRow = await getPortalTokenForOrder(order.id)
        if (!tokenRow) return

        const feed = await getOrderVisitors(order.pixel_audiencelab_id!, {
          limit: 200,
          sinceDays: 7,
        })

        const topCompanies = computeTopCompanies(feed.recent, 3)

        try {
          await sendFunnelVisitorDigestEmail({
            to: order.customer_email,
            customerName: order.customer_name,
            weekTotal: feed.total,
            topCompanies,
            recentVisitors: feed.recent,
            portalUrl: portalUrlForToken(tokenRow.token),
          })
          await markVisitorDigestSent(order.id)
          sent++
        } catch (err) {
          safeError('[funnel-digest] send failed', {
            order_id: order.id,
            err: (err as Error)?.message,
          })
        }
      })
    }

    safeLog('[funnel-digest] done', { sent })
    return { sent }
  }
)

function computeTopCompanies(
  visitors: readonly FunnelVisitor[],
  limit: number
): DigestCompany[] {
  const counts = new Map<string, number>()
  for (const v of visitors) {
    const name = v.company_name ?? v.company_domain
    if (!name) continue
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, visits]) => ({ name, visits }))
}
