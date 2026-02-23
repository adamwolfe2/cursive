/**
 * Admin Monitoring — Alerts API
 * GET /api/admin/monitoring/alerts
 *
 * Returns active system alerts generated dynamically from real DB data:
 * - Low workspace credit balances
 * - High email bounce rates
 * - Purchase failure spikes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'
import { handleApiError } from '@/lib/utils/api-error-handler'

interface Alert {
  id: string
  name: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  triggeredAt: string
  resolved: boolean
}

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireAdmin()

    const supabase = createAdminClient()
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const alerts: Alert[] = []

    // --- Alert 1: Low credit balances ---
    const { data: lowCreditWorkspaces } = await supabase
      .from('workspace_credits')
      .select('workspace_id, balance')
      .lt('balance', 10)

    if (lowCreditWorkspaces && lowCreditWorkspaces.length > 0) {
      const severity = lowCreditWorkspaces.some((w) => w.balance <= 0) ? 'error' : 'warning'
      alerts.push({
        id: 'low-credits',
        name: 'Low Workspace Credits',
        severity,
        message: `${lowCreditWorkspaces.length} workspace(s) have fewer than 10 credits remaining`,
        triggeredAt: now.toISOString(),
        resolved: false,
      })
    }

    // --- Alert 2: Email bounce spike (last 24h) ---
    const { count: totalSent24h } = await supabase
      .from('email_sends')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo.toISOString())

    const { count: bounced24h } = await supabase
      .from('email_sends')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'bounced')
      .gte('created_at', twentyFourHoursAgo.toISOString())

    if (totalSent24h && bounced24h && totalSent24h > 0) {
      const bounceRate = bounced24h / totalSent24h
      if (bounceRate > 0.1) {
        alerts.push({
          id: 'high-bounce-rate',
          name: 'High Email Bounce Rate',
          severity: bounceRate > 0.2 ? 'critical' : 'error',
          message: `Email bounce rate is ${(bounceRate * 100).toFixed(1)}% over the last 24 hours (${bounced24h} of ${totalSent24h} emails)`,
          triggeredAt: now.toISOString(),
          resolved: false,
        })
      }
    }

    // --- Alert 3: Purchase failures spike (last 1h) ---
    const { count: totalPurchases1h } = await supabase
      .from('marketplace_purchases')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo.toISOString())

    const { count: failedPurchases1h } = await supabase
      .from('marketplace_purchases')
      .select('*', { count: 'exact', head: true })
      .not('status', 'in', '(completed,pending)')
      .gte('created_at', oneHourAgo.toISOString())

    if (totalPurchases1h && failedPurchases1h && totalPurchases1h > 0) {
      const failureRate = failedPurchases1h / totalPurchases1h
      if (failureRate > 0.1) {
        alerts.push({
          id: 'purchase-failure-spike',
          name: 'Purchase Failure Spike',
          severity: failureRate > 0.25 ? 'critical' : 'warning',
          message: `${(failureRate * 100).toFixed(1)}% of purchases failed in the last hour (${failedPurchases1h} of ${totalPurchases1h})`,
          triggeredAt: now.toISOString(),
          resolved: false,
        })
      }
    }

    // --- Alert 4: Webhook delivery failures (last 1h) ---
    const { count: totalWebhooks1h } = await supabase
      .from('outbound_webhook_deliveries')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo.toISOString())

    const { count: failedWebhooks1h } = await supabase
      .from('outbound_webhook_deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('created_at', oneHourAgo.toISOString())

    if (totalWebhooks1h && failedWebhooks1h && totalWebhooks1h > 0) {
      const webhookFailRate = failedWebhooks1h / totalWebhooks1h
      if (webhookFailRate > 0.15) {
        alerts.push({
          id: 'webhook-failure-spike',
          name: 'Webhook Delivery Failures',
          severity: webhookFailRate > 0.3 ? 'error' : 'warning',
          message: `${(webhookFailRate * 100).toFixed(1)}% of webhooks failed in the last hour (${failedWebhooks1h} of ${totalWebhooks1h})`,
          triggeredAt: now.toISOString(),
          resolved: false,
        })
      }
    }

    // --- Fallback: system healthy info alert when no issues detected ---
    if (alerts.length === 0) {
      alerts.push({
        id: 'system-healthy',
        name: 'All Systems Operational',
        severity: 'info',
        message: 'No active alerts. All platform metrics are within normal thresholds.',
        triggeredAt: now.toISOString(),
        resolved: true,
      })
    }

    return NextResponse.json({ data: alerts })
  } catch (error) {
    safeError('Failed to fetch monitoring alerts:', error)
    return handleApiError(error)
  }
}
