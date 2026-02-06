/**
 * Monitor Operations Health
 * Cron job that checks email/webhook failure rates and sends alerts
 */

import { inngest } from '@/inngest/client'
import { getFailureStats, getUnresolvedCount } from '@/lib/monitoring/failed-operations'
import { sendBatchFailureAlert, sendDLQThresholdAlert } from '@/lib/monitoring/alerts'
import { safeLog } from '@/lib/utils/log-sanitizer'

/**
 * Monitor operations health every hour
 * Checks failure rates and sends alerts if thresholds exceeded
 */
export const monitorOperationsHealth = inngest.createFunction(
  {
    id: 'monitor-operations-health',
    name: 'Monitor Operations Health',
    retries: 2,
    timeout: 300000, // 5 minutes
  },
  { cron: '0 * * * *' }, // Every hour
  async ({ step }) => {
    safeLog('[Health Monitor] Starting health check')

    // Get failure statistics for last hour
    const stats = await step.run('get-failure-stats', async () => {
      return await getFailureStats('1h')
    })

    // Check email failure rate
    await step.run('check-email-failures', async () => {
      // In production, you'd track total email attempts
      // For now, estimate based on failure count
      const totalEmails = Math.max(stats.emailFailures * 10, 100)

      if (stats.emailFailures > 0) {
        await sendBatchFailureAlert(
          'email',
          stats.emailFailures,
          totalEmails,
          'last hour'
        )
      }
    })

    // Check webhook failure rate
    await step.run('check-webhook-failures', async () => {
      const totalWebhooks = Math.max(stats.webhookFailures * 20, 50)

      if (stats.webhookFailures > 0) {
        await sendBatchFailureAlert(
          'webhook',
          stats.webhookFailures,
          totalWebhooks,
          'last hour'
        )
      }
    })

    // Check dead letter queue size
    await step.run('check-dlq-size', async () => {
      const unresolvedCount = await getUnresolvedCount()

      if (unresolvedCount >= 10) {
        await sendDLQThresholdAlert(unresolvedCount, 10)
      }
    })

    safeLog('[Health Monitor] Health check complete', {
      emailFailures: stats.emailFailures,
      webhookFailures: stats.webhookFailures,
      unresolvedCount: stats.totalUnresolved,
    })

    return {
      success: true,
      stats,
    }
  }
)
