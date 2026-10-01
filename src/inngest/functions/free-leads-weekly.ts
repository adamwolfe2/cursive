/**
 * Free leads — weekly delivery. Mondays 14:00 UTC (~9-10am ET).
 * Each weekly-leads order bound to a free-leads workspace gets 25 new people for the profile it
 * approved. Idempotent per order and ISO week (src/lib/free-leads/weekly.ts), so a retried step or
 * a manual re-run buys nothing twice. Anything short of a full delivery alerts sales; one order's
 * failure never stops the others.
 */
import { inngest } from '@/inngest/client'
import { sendFreeLeadsWeeklyEmail } from '@/lib/email/templates/free-leads-weekly'
import { FREE_LEAD_COUNT } from '@/lib/free-leads/contract'
import { notifySales } from '@/lib/free-leads/notify'
import { deliverWeekly, isoWeek, weeklyCandidates, workspaceOwnerEmail, type WeeklyOrder } from '@/lib/free-leads/weekly'
import { getStripeClient } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

/** A 'paused' order cancelled at period end is still owed leads until Stripe ends the subscription. */
async function stillPaidUp(order: WeeklyOrder): Promise<boolean> {
  if (order.subscription_state === 'active') return true
  if (!order.stripe_subscription_id) return false
  const sub = await getStripeClient().subscriptions.retrieve(order.stripe_subscription_id)
  return sub.status === 'active' || sub.status === 'trialing'
}

export const freeLeadsWeekly = inngest.createFunction(
  { id: 'free-leads-weekly', name: 'Free leads — weekly delivery', retries: 1, concurrency: { limit: 1 } },
  [{ cron: '0 14 * * 1' }, { event: 'free-leads/weekly.run' }],
  async ({ step }) => {
    // Memoized, so a replay that crosses midnight Sunday UTC keeps the same week (and step ids).
    const week = await step.run('week', () => isoWeek(new Date()))
    const orders = await step.run('find-orders', () => weeklyCandidates(createAdminClient()))
    let delivered = 0

    for (const order of orders) {
      const res = await step.run(`deliver-${order.id}-${week}`, async () => {
        try {
          if (!(await stillPaidUp(order))) return { status: 'skipped' as const, reason: 'subscription ended' }
          return await deliverWeekly(order, week, createAdminClient())
        } catch (err) {
          safeError('[free-leads-weekly] delivery failed', { order_id: order.id, week, err })
          await notifySales(`Weekly leads failed for order ${order.id} (${week}). Not retried; check the logs.`)
          return { status: 'failed' as const }
        }
      })

      if (res.status === 'already' && res.stuck) {
        await notifySales(`Weekly leads for order ${order.id} (${week}) started but never finished. Credits may be spent; check the delivery row.`)
      }
      if (res.status === 'skipped' && res.reason !== 'subscription ended') {
        await notifySales(`Weekly leads skipped for order ${order.id} (${week}): ${res.reason}.`)
      }
      if (res.status !== 'delivered') continue
      delivered += 1
      if (res.leads < FREE_LEAD_COUNT) {
        await notifySales(`Weekly leads short for order ${order.id} (${week}): ${res.leads} of ${FREE_LEAD_COUNT}. The market may be running dry; widen the profile.`)
      }
      if (res.leads === 0) continue

      await step.run(`email-${order.id}-${week}`, async () => {
        try {
          const to = await workspaceOwnerEmail(createAdminClient(), order.workspace_id)
          if (!to) return safeLog('[free-leads-weekly] no owner email; skipped note', { order_id: order.id })
          await sendFreeLeadsWeeklyEmail({ to, domain: res.domain, count: res.leads, top: res.top })
        } catch (err) {
          // The leads are delivered; a missing note must not stop the other orders.
          safeError('[free-leads-weekly] weekly email failed', { order_id: order.id, err })
        }
      })
    }

    safeLog('[free-leads-weekly] run complete', { week, orders: orders.length, delivered })
    return { week, orders: orders.length, delivered }
  }
)
