/**
 * Check Alert Rules
 * Runs every 5 minutes to check if any alert thresholds have been exceeded
 */

import { inngest } from '@/lib/inngest/client'
import { checkAlertRules } from '@/lib/monitoring/alerts'
import { logger } from '@/lib/monitoring/logger'

export const checkAlerts = inngest.createFunction(
  {
    id: 'check-alerts',
    name: 'Check Alert Rules',
    retries: 3,
  },
  { cron: '*/5 * * * *' }, // Every 5 minutes
  async ({ step }) => {
    const results = await step.run('check-alert-rules', async () => {
      logger.info('Checking alert rules')
      return await checkAlertRules()
    })

    const triggered = results.filter((r) => r.triggered)

    if (triggered.length > 0) {
      logger.warn(`${triggered.length} alerts triggered`, {
        alerts: triggered.map((r) => r.rule),
      })
    } else {
      logger.debug('No alerts triggered')
    }

    return {
      checked: results.length,
      triggered: triggered.length,
      alerts: triggered,
    }
  }
)
