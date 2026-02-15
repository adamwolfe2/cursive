/**
 * Check Alert Rules
 * Runs every 5 minutes to check if any alert thresholds have been exceeded
 */

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/monitoring/logger'
import { sendSlackAlert } from '@/lib/monitoring/alerts'

interface AlertResult {
  triggered: boolean
  rule: string
  details?: Record<string, unknown>
}

/**
 * Check all alert rules against current system state
 */
async function checkAlertRules(): Promise<AlertResult[]> {
  const supabase = createAdminClient()
  const results: AlertResult[] = []

  // Rule 1: Check for unprocessed webhook events older than 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { count: failedWebhooks } = await supabase
    .from('webhook_events')
    .select('id', { count: 'exact', head: true })
    .is('processed_at', null)
    .lt('received_at', fiveMinutesAgo)

  if (failedWebhooks && failedWebhooks > 5) {
    results.push({
      triggered: true,
      rule: 'unprocessed_webhooks',
      details: { count: failedWebhooks, threshold: 5 },
    })
  } else {
    results.push({ triggered: false, rule: 'unprocessed_webhooks' })
  }

  // Rule 2: Check for high-severity unresolved platform alerts
  const { count: unresolvedAlerts } = await supabase
    .from('platform_alerts')
    .select('id', { count: 'exact', head: true })
    .in('severity', ['high', 'critical'])
    .is('resolved_at', null)

  if (unresolvedAlerts && unresolvedAlerts > 3) {
    results.push({
      triggered: true,
      rule: 'unresolved_critical_alerts',
      details: { count: unresolvedAlerts, threshold: 3 },
    })
  } else {
    results.push({ triggered: false, rule: 'unresolved_critical_alerts' })
  }

  // Rule 3: Check for email delivery failures in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: failedEmails } = await supabase
    .from('email_send_logs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'failed')
    .gte('created_at', oneHourAgo)

  if (failedEmails && failedEmails > 10) {
    results.push({
      triggered: true,
      rule: 'email_delivery_failures',
      details: { count: failedEmails, threshold: 10, window: '1 hour' },
    })
  } else {
    results.push({ triggered: false, rule: 'email_delivery_failures' })
  }

  return results
}

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

    const triggered = results.filter((r: AlertResult) => r.triggered)

    if (triggered.length > 0) {
      logger.warn(`${triggered.length} alerts triggered`, {
        alerts: triggered.map((r: AlertResult) => r.rule),
      })

      // Send Slack notification for triggered alerts
      await step.run('notify-triggered-alerts', async () => {
        await sendSlackAlert({
          type: 'system_health',
          severity: triggered.length > 2 ? 'critical' : 'warning',
          message: `${triggered.length} alert rule(s) triggered`,
          metadata: {
            rules: triggered.map((r: AlertResult) => r.rule).join(', '),
            details: triggered.reduce((acc: Record<string, unknown>, r: AlertResult) => {
              acc[r.rule] = r.details
              return acc
            }, {}),
          },
        })
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
