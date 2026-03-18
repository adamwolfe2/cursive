/**
 * Audit Logs Cleanup
 *
 * Runs daily at 4:00 AM UTC to delete old audit_logs entries.
 * Keeps the last 90 days for compliance and debugging; older entries
 * are purged to prevent unbounded table growth.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

export const cleanupAuditLogs = inngest.createFunction(
  {
    id: 'cleanup-audit-logs',
    name: 'Cleanup Old Audit Logs',
    retries: 2,
    timeouts: { finish: '2m' },
  },
  { cron: '0 4 * * *' }, // Daily at 4:00 AM UTC
  async ({ step }) => {
    const deleted = await step.run('cleanup-audit-logs', async () => {
      const supabase = createAdminClient()
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

      const { count: beforeCount } = await supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .lt('created_at', ninetyDaysAgo)

      const { error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', ninetyDaysAgo)

      if (error) {
        safeError('[Audit Log Cleanup] Delete failed:', error)
        throw new Error('Audit logs cleanup failed')
      }

      return beforeCount ?? 0
    })

    safeLog(`[Audit Log Cleanup] Deleted ${deleted} entries older than 90 days`)
    return { deleted }
  }
)
