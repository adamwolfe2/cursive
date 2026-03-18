/**
 * Failed Operations Cleanup
 *
 * Runs daily at 4:30 AM UTC to delete resolved failed_operations entries
 * older than 30 days. Unresolved entries are kept indefinitely for investigation.
 * Prevents unbounded dead letter queue growth.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

export const cleanupFailedOperations = inngest.createFunction(
  {
    id: 'cleanup-failed-operations',
    name: 'Cleanup Resolved Failed Operations',
    retries: 2,
    timeouts: { finish: '2m' },
  },
  { cron: '30 4 * * *' }, // Daily at 4:30 AM UTC
  async ({ step }) => {
    const deleted = await step.run('cleanup-failed-ops', async () => {
      const supabase = createAdminClient()
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      // Only delete resolved entries — unresolved stay for investigation
      const { count: beforeCount } = await supabase
        .from('failed_operations')
        .select('id', { count: 'exact', head: true })
        .not('resolved_at', 'is', null)
        .lt('created_at', thirtyDaysAgo)

      const { error } = await supabase
        .from('failed_operations')
        .delete()
        .not('resolved_at', 'is', null)
        .lt('created_at', thirtyDaysAgo)

      if (error) {
        safeError('[Failed Ops Cleanup] Delete failed:', error)
        throw new Error('Failed operations cleanup failed')
      }

      return beforeCount ?? 0
    })

    safeLog(`[Failed Ops Cleanup] Deleted ${deleted} resolved entries older than 30 days`)
    return { deleted }
  }
)
