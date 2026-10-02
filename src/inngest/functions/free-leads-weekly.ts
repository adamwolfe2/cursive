/**
 * Free leads — weekly delivery, Inngest path. The production trigger is the Vercel cron at
 * /api/cron/free-leads-weekly (Mondays 14:00 UTC); this function stays for manual re-runs
 * (event free-leads/weekly.run) and as a second trigger when Inngest is synced. Both call the same
 * service in src/lib/free-leads/weekly.ts, and the unique (order_id, week) lock in
 * free_lead_weekly_deliveries makes an overlapping cron + Inngest run buy nothing twice.
 */
import { inngest } from '@/inngest/client'
import { isoWeek, processOrderWeek, reportOutcome, sendWeeklyNote, weeklyCandidates } from '@/lib/free-leads/weekly'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog } from '@/lib/utils/log-sanitizer'

export const freeLeadsWeekly = inngest.createFunction(
  { id: 'free-leads-weekly', name: 'Free leads — weekly delivery', retries: 1, concurrency: { limit: 1 } },
  [{ cron: '0 14 * * 1' }, { event: 'free-leads/weekly.run' }],
  async ({ step }) => {
    // Memoized, so a replay that crosses midnight Sunday UTC keeps the same week (and step ids).
    const week = await step.run('week', () => isoWeek(new Date()))
    const orders = await step.run('find-orders', () => weeklyCandidates(createAdminClient()))
    let delivered = 0

    for (const order of orders) {
      const res = await step.run(`deliver-${order.id}-${week}`, () => processOrderWeek(order, week, createAdminClient()))
      await reportOutcome(order, week, res)
      if (res.status !== 'delivered') continue
      delivered += 1
      await step.run(`email-${order.id}-${week}`, () => sendWeeklyNote(order, res, createAdminClient()))
    }

    safeLog('[free-leads-weekly] run complete', { week, orders: orders.length, delivered })
    return { week, orders: orders.length, delivered }
  }
)
