/**
 * Webhook Events Cleanup
 *
 * Runs daily at 3:30 AM UTC to delete old webhook_events entries.
 * Keeps the last 30 days for debugging; older events are purged to
 * prevent unbounded table growth from Stripe/EmailBison/AudienceLab webhooks.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

export const cleanupWebhookEvents = inngest.createFunction(
  {
    id: 'cleanup-webhook-events',
    name: 'Cleanup Old Webhook Events',
    retries: 2,
    timeouts: { finish: '2m' },
  },
  { cron: '30 3 * * *' }, // Daily at 3:30 AM UTC
  async ({ step }) => {
    const deleted = await step.run('cleanup-events', async () => {
      const supabase = createAdminClient()
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      // Count before deleting
      const { count: beforeCount } = await supabase
        .from('webhook_events')
        .select('id', { count: 'exact', head: true })
        .lt('created_at', thirtyDaysAgo)

      const { error } = await supabase
        .from('webhook_events')
        .delete()
        .lt('created_at', thirtyDaysAgo)

      if (error) {
        safeError('[Webhook Cleanup] Delete failed:', error)
        throw new Error('Webhook events cleanup failed')
      }

      return beforeCount ?? 0
    })

    safeLog(`[Webhook Cleanup] Deleted ${deleted} events older than 30 days`)
    return { deleted }
  }
)
