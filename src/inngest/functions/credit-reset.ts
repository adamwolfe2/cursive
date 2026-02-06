// Daily Credit Reset
// Resets daily_credits_used for all users at midnight

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'

export const creditReset = inngest.createFunction(
  {
    id: 'credit-reset',
    name: 'Daily Credit Reset',
    retries: 3,
    timeout: 300000, // 5 minutes
  },
  { cron: '0 0 * * *' }, // Every day at midnight
  async ({ step, logger }) => {
    // Reset all users' daily credits
    const result = await step.run('reset-daily-credits', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('users')
        .update({ daily_credits_used: 0 })
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select('id')

      if (error) {
        logger.error('Failed to reset credits:', error)
        throw new Error(`Failed to reset credits: ${error.message}`)
      }

      logger.info(`Reset daily credits for ${data.length} users`)

      return { users_updated: data.length }
    })

    return {
      success: true,
      ...result,
    }
  }
)
