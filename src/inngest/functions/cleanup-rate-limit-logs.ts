/**
 * Rate Limit Logs Cleanup
 *
 * Runs every hour to delete stale rate_limit_logs entries older than 2 hours.
 * Calls the existing cleanup_rate_limit_logs() PostgreSQL function.
 * Prevents unbounded table growth from high-traffic rate limiting.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

export const cleanupRateLimitLogs = inngest.createFunction(
  {
    id: 'cleanup-rate-limit-logs',
    name: 'Cleanup Stale Rate Limit Logs',
    retries: 2,
    timeouts: { finish: '2m' },
  },
  { cron: '0 * * * *' }, // Every hour
  async ({ step }) => {
    const deleted = await step.run('cleanup-logs', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase.rpc('cleanup_rate_limit_logs')

      if (error) {
        safeError('[Rate Limit Cleanup] RPC failed:', error.message)
        throw new Error(`Cleanup RPC failed: ${error.message}`)
      }

      return data as number
    })

    safeLog(`[Rate Limit Cleanup] Deleted ${deleted} stale entries`)
    return { deleted }
  }
)
