/**
 * Reset User Lead Caps
 *
 * Calls the DB functions that zero out user_targeting lead counters:
 *   - Daily:   reset_user_daily_caps()   — every day at midnight UTC
 *   - Weekly:  reset_user_weekly_caps()  — every Monday at midnight UTC
 *   - Monthly: reset_user_monthly_caps() — 1st of each month at midnight UTC
 *
 * Without these resets, users hit their cap once and never receive leads again.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'

export const resetUserDailyLeadCaps = inngest.createFunction(
  {
    id: 'reset-user-daily-lead-caps',
    name: 'Reset User Daily Lead Caps',
    retries: 3,
    timeouts: { finish: '2m' },
  },
  { cron: '0 0 * * *' }, // Midnight UTC daily
  async ({ logger }) => {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('reset_user_daily_caps')

    if (error) {
      logger.error(`reset_user_daily_caps failed: ${error.message}`)
      throw error
    }

    const count = typeof data === 'number' ? data : 0
    logger.info(`Reset daily lead caps for ${count} user(s)`)
    return { reset_count: count }
  }
)

export const resetUserWeeklyLeadCaps = inngest.createFunction(
  {
    id: 'reset-user-weekly-lead-caps',
    name: 'Reset User Weekly Lead Caps',
    retries: 3,
    timeouts: { finish: '2m' },
  },
  { cron: '0 0 * * 1' }, // Midnight UTC every Monday
  async ({ logger }) => {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('reset_user_weekly_caps')

    if (error) {
      logger.error(`reset_user_weekly_caps failed: ${error.message}`)
      throw error
    }

    const count = typeof data === 'number' ? data : 0
    logger.info(`Reset weekly lead caps for ${count} user(s)`)
    return { reset_count: count }
  }
)

export const resetUserMonthlyLeadCaps = inngest.createFunction(
  {
    id: 'reset-user-monthly-lead-caps',
    name: 'Reset User Monthly Lead Caps',
    retries: 3,
    timeouts: { finish: '2m' },
  },
  { cron: '0 0 1 * *' }, // Midnight UTC on the 1st of each month
  async ({ logger }) => {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('reset_user_monthly_caps')

    if (error) {
      logger.error(`reset_user_monthly_caps failed: ${error.message}`)
      throw error
    }

    const count = typeof data === 'number' ? data : 0
    logger.info(`Reset monthly lead caps for ${count} user(s)`)
    return { reset_count: count }
  }
)
