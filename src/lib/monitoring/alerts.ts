/**
 * Slack Alerting System
 * Sends alerts to Slack for critical failures and threshold violations
 */

import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

export type AlertType = 'email_failure' | 'webhook_failure' | 'dlq_threshold' | 'system_health'
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface SlackAlert {
  type: AlertType
  severity: AlertSeverity
  message: string
  metadata?: Record<string, any>
}

/**
 * Send alert to Slack webhook
 */
export async function sendSlackAlert(alert: SlackAlert): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!webhookUrl) {
    safeLog('[Alerts] SLACK_WEBHOOK_URL not configured, skipping alert')
    return
  }

  try {
    const color = getSeverityColor(alert.severity)
    const emoji = getSeverityEmoji(alert.severity)

    const payload = {
      text: `${emoji} *${alert.severity.toUpperCase()}*: ${alert.message}`,
      attachments: [
        {
          color,
          fields: Object.entries(alert.metadata || {}).map(([key, value]) => ({
            title: formatFieldName(key),
            value: formatFieldValue(value),
            short: true,
          })),
          footer: 'Cursive Platform',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Slack webhook returned ${response.status}`)
    }

    safeLog(`[Alerts] Sent ${alert.severity} alert for ${alert.type}`)
  } catch (error) {
    safeError('[Alerts] Failed to send Slack alert', error)
    // Don't throw - alerting failures shouldn't crash the system
  }
}

/**
 * Send batch failure alert
 */
export async function sendBatchFailureAlert(
  operationType: 'email' | 'webhook',
  failureCount: number,
  totalCount: number,
  timeWindow: string
): Promise<void> {
  const failureRate = (failureCount / totalCount) * 100
  const threshold = operationType === 'email' ? 10 : 5

  if (failureRate > threshold) {
    await sendSlackAlert({
      type: operationType === 'email' ? 'email_failure' : 'webhook_failure',
      severity: failureRate > threshold * 2 ? 'critical' : 'warning',
      message: `High ${operationType} failure rate detected`,
      metadata: {
        failureRate: `${failureRate.toFixed(1)}%`,
        failureCount,
        totalCount,
        timeWindow,
        threshold: `${threshold}%`,
      },
    })
  }
}

/**
 * Send dead letter queue threshold alert
 */
export async function sendDLQThresholdAlert(itemCount: number, threshold: number = 10): Promise<void> {
  if (itemCount >= threshold) {
    await sendSlackAlert({
      type: 'dlq_threshold',
      severity: itemCount >= threshold * 2 ? 'critical' : 'warning',
      message: `Dead letter queue has ${itemCount} items`,
      metadata: {
        itemCount,
        threshold,
        actionRequired: 'Review failed operations in admin panel',
      },
    })
  }
}

/**
 * Send system health alert
 */
export async function sendSystemHealthAlert(
  message: string,
  severity: AlertSeverity,
  metadata?: Record<string, any>
): Promise<void> {
  await sendSlackAlert({
    type: 'system_health',
    severity,
    message,
    metadata,
  })
}

// Helper functions

function getSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'info':
      return '#36a64f' // Green
    case 'warning':
      return '#ff9800' // Orange
    case 'error':
      return '#f44336' // Red
    case 'critical':
      return '#9c27b0' // Purple
    default:
      return '#9e9e9e' // Grey
  }
}

function getSeverityEmoji(severity: AlertSeverity): string {
  switch (severity) {
    case 'info':
      return 'ℹ️'
    case 'warning':
      return '⚠️'
    case 'error':
      return '❌'
    case 'critical':
      return '🚨'
    default:
      return '📢'
  }
}

function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

function formatFieldValue(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}
