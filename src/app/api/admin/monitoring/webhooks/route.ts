/**
 * Admin Monitoring — Webhook Metrics API
 * GET /api/admin/monitoring/webhooks
 *
 * Returns real-time outbound webhook delivery metrics from
 * the outbound_webhook_deliveries table:
 * - processedPerHour: deliveries processed in the last hour
 * - successRate: success / total terminal (non-pending) in last 24h
 * - retryRate: deliveries with attempts > 1 / total in last 24h
 * - avgProcessingTime: average ms between created_at and completed_at
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'
import { handleApiError } from '@/lib/utils/api-error-handler'

interface WebhookMetrics {
  processedPerHour: number
  successRate: number
  retryRate: number
  avgProcessingTime: number
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
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [processedLastHour, successLast24h, terminalLast24h, retrySample, timingSample] =
      await Promise.all([
        // Processed (non-pending) in the last hour
        supabase
          .from('outbound_webhook_deliveries')
          .select('*', { count: 'exact', head: true })
          .not('status', 'eq', 'pending')
          .gte('created_at', oneHourAgo.toISOString()),

        // Successful deliveries in last 24h
        supabase
          .from('outbound_webhook_deliveries')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'success')
          .gte('created_at', twentyFourHoursAgo.toISOString()),

        // All terminal deliveries in last 24h (denominator for rates)
        supabase
          .from('outbound_webhook_deliveries')
          .select('*', { count: 'exact', head: true })
          .not('status', 'eq', 'pending')
          .gte('created_at', twentyFourHoursAgo.toISOString()),

        // Deliveries that required more than 1 attempt in last 24h
        supabase
          .from('outbound_webhook_deliveries')
          .select('attempts')
          .gt('attempts', 1)
          .gte('created_at', twentyFourHoursAgo.toISOString())
          .limit(1000),

        // Completed deliveries with timing data for avg processing time
        supabase
          .from('outbound_webhook_deliveries')
          .select('created_at, completed_at')
          .eq('status', 'success')
          .not('completed_at', 'is', null)
          .gte('created_at', twentyFourHoursAgo.toISOString())
          .limit(500),
      ])

    const processedPerHour = processedLastHour.count ?? 0
    const successful24h = successLast24h.count ?? 0
    const terminal24h = terminalLast24h.count ?? 0

    const successRate = terminal24h > 0 ? successful24h / terminal24h : 1
    const retryRate = terminal24h > 0 ? (retrySample.data?.length ?? 0) / terminal24h : 0

    // Compute average processing time in ms
    const timings = (timingSample.data ?? [])
      .map((r) => {
        if (!r.completed_at) return null
        const start = new Date(r.created_at).getTime()
        const end = new Date(r.completed_at).getTime()
        return end - start
      })
      .filter((v): v is number => v !== null && v >= 0)

    const avgProcessingTime =
      timings.length > 0 ? Math.round(timings.reduce((sum, v) => sum + v, 0) / timings.length) : 0

    const metrics: WebhookMetrics = {
      processedPerHour,
      successRate,
      retryRate,
      avgProcessingTime,
    }

    return NextResponse.json({ data: metrics })
  } catch (error) {
    safeError('Failed to fetch webhook metrics:', error)
    return handleApiError(error)
  }
}
