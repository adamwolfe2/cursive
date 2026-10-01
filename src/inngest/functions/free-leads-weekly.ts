/**
 * Free leads — weekly delivery. Mondays 14:00 UTC (~9-10am ET).
 * Each active weekly-leads order bound to a free-leads workspace gets 25 new people for the
 * profile it approved. Idempotent per order and ISO week (see src/lib/free-leads/weekly.ts),
 * so a retried step or a manual re-run buys nothing twice. Failures alert sales.
 */
import { inngest } from '@/inngest/client'
import { notifySales } from '@/lib/free-leads/notify'
import { deliverWeekly, isoWeek, weeklyCandidates } from '@/lib/free-leads/weekly'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

export const freeLeadsWeekly = inngest.createFunction(
  { id: 'free-leads-weekly', name: 'Free leads — weekly delivery', retries: 1, concurrency: { limit: 1 } },
  [{ cron: '0 14 * * 1' }, { event: 'free-leads/weekly.run' }],
  async ({ step }) => {
    const week = isoWeek(new Date())
    const orders = await step.run('find-orders', () => weeklyCandidates(createAdminClient()))
    let delivered = 0
    for (const order of orders) {
      const res = await step.run(`deliver-${order.id}-${week}`, async () => {
        try {
          return await deliverWeekly(order, week, createAdminClient())
        } catch (err) {
          safeError('[free-leads-weekly] delivery failed', { order_id: order.id, week, err })
          await notifySales(`Weekly leads failed for order ${order.id} (${week}). Nothing was retried; check the logs.`)
          return { status: 'failed' as const }
        }
      })
      if (res.status === 'delivered') delivered += 1
    }
    safeLog('[free-leads-weekly] run complete', { week, orders: orders.length, delivered })
    return { week, orders: orders.length, delivered }
  }
)
