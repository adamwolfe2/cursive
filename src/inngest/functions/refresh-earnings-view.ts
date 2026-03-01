// Refresh Partner Earnings Materialized View
// Runs hourly to update cached earnings aggregates
// Ensures fast performance for partner dashboards

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

export const refreshEarningsView = inngest.createFunction(
  {
    id: 'refresh-earnings-view',
    name: 'Refresh Partner Earnings Materialized View',
    retries: 2,
  },
  { cron: '0 */4 * * *' }, // Every 4 hours (cost: 4x fewer DB refreshes)
  async ({ step }) => {
    const supabase = createAdminClient()

    // Step 1: Refresh the materialized view
    const refreshResult = await step.run('refresh-view', async () => {
      safeLog('Refreshing partner_earnings_summary materialized view...')

      const { data, error } = await supabase.rpc('refresh_partner_earnings_summary')

      if (error) {
        safeError('Failed to refresh earnings view:', error)
        throw new Error(`Materialized view refresh failed: ${error.message}`)
      }

      const result = data as unknown as {
        rows_affected: number
        duration_ms: number
      }[]

      const stats = result?.[0] || { rows_affected: 0, duration_ms: 0 }

      safeLog('Partner earnings view refreshed', {
        rows: stats.rows_affected,
        duration_ms: stats.duration_ms,
      })

      return stats
    })

    return {
      success: true,
      rows_affected: refreshResult.rows_affected,
      duration_ms: refreshResult.duration_ms,
    }
  }
)
