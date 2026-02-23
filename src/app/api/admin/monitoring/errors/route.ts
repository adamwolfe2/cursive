/**
 * Admin Monitoring — Recent Errors API
 * GET /api/admin/monitoring/errors
 *
 * Returns recent error-level entries from the admin_audit_log and api_logs
 * tables, aggregated and deduplicated for display in the monitoring dashboard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'
import { handleApiError } from '@/lib/utils/api-error-handler'

interface RecentError {
  id: string
  timestamp: string
  message: string
  count: number
  level: 'error' | 'warning' | 'critical'
}

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireAdmin()

    const supabase = createAdminClient()
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const errors: RecentError[] = []

    // --- Source 1: API logs with non-2xx status codes ---
    const { data: apiErrorLogs } = await supabase
      .from('api_logs')
      .select('service, endpoint, status_code, created_at')
      .gte('status_code', 400)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(500)

    if (apiErrorLogs && apiErrorLogs.length > 0) {
      // Aggregate by service + endpoint + status_code
      const aggregated: Record<string, { count: number; latestAt: string; statusCode: number }> = {}
      for (const log of apiErrorLogs) {
        const key = `${log.service}:${log.endpoint}:${log.status_code}`
        if (!aggregated[key]) {
          aggregated[key] = { count: 0, latestAt: log.created_at, statusCode: log.status_code }
        }
        aggregated[key].count++
        if (log.created_at > aggregated[key].latestAt) {
          aggregated[key].latestAt = log.created_at
        }
      }

      const sorted = Object.entries(aggregated)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 25)

      for (const [key, stats] of sorted) {
        const [service, endpoint, statusCode] = key.split(':')
        const level: RecentError['level'] = stats.statusCode >= 500 ? 'error' : 'warning'
        errors.push({
          id: `api-error-${key}`,
          timestamp: stats.latestAt,
          message: `[${service}] ${endpoint} returned HTTP ${statusCode}`,
          count: stats.count,
          level,
        })
      }
    }

    // --- Source 2: Failed email sends ---
    const { data: emailErrors } = await supabase
      .from('email_sends')
      .select('error_message, created_at')
      .eq('status', 'failed')
      .not('error_message', 'is', null)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(200)

    if (emailErrors && emailErrors.length > 0) {
      // Aggregate by error message
      const emailAgg: Record<string, { count: number; latestAt: string }> = {}
      for (const row of emailErrors) {
        const msg = (row.error_message as string).slice(0, 120)
        if (!emailAgg[msg]) {
          emailAgg[msg] = { count: 0, latestAt: row.created_at }
        }
        emailAgg[msg].count++
        if (row.created_at > emailAgg[msg].latestAt) {
          emailAgg[msg].latestAt = row.created_at
        }
      }

      const topEmailErrors = Object.entries(emailAgg)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)

      for (const [msg, stats] of topEmailErrors) {
        errors.push({
          id: `email-error-${Buffer.from(msg).toString('base64').slice(0, 16)}`,
          timestamp: stats.latestAt,
          message: `[email] ${msg}`,
          count: stats.count,
          level: 'error',
        })
      }
    }

    // --- Source 3: Failed webhook deliveries ---
    const { data: webhookErrors } = await supabase
      .from('outbound_webhook_deliveries')
      .select('error_message, event_type, created_at')
      .eq('status', 'failed')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(200)

    if (webhookErrors && webhookErrors.length > 0) {
      const webhookAgg: Record<string, { count: number; latestAt: string }> = {}
      for (const row of webhookErrors) {
        const msg = `${row.event_type}: ${(row.error_message ?? 'unknown error') as string}`.slice(0, 120)
        if (!webhookAgg[msg]) {
          webhookAgg[msg] = { count: 0, latestAt: row.created_at }
        }
        webhookAgg[msg].count++
        if (row.created_at > webhookAgg[msg].latestAt) {
          webhookAgg[msg].latestAt = row.created_at
        }
      }

      const topWebhookErrors = Object.entries(webhookAgg)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)

      for (const [msg, stats] of topWebhookErrors) {
        errors.push({
          id: `webhook-error-${Buffer.from(msg).toString('base64').slice(0, 16)}`,
          timestamp: stats.latestAt,
          message: `[webhook] ${msg}`,
          count: stats.count,
          level: 'warning',
        })
      }
    }

    // Sort combined errors by count descending, cap at 50
    const sorted = errors
      .sort((a, b) => b.count - a.count)
      .slice(0, 50)

    return NextResponse.json({ data: sorted })
  } catch (error) {
    safeError('Failed to fetch monitoring errors:', error)
    return handleApiError(error)
  }
}
