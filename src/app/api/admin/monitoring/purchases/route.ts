/**
 * Admin Monitoring — Purchase Metrics API
 * GET /api/admin/monitoring/purchases
 *
 * Returns real-time marketplace purchase metrics from the marketplace_purchases table:
 * - purchasesPerHour: completed purchases in the last hour
 * - successRate: completed / total (non-pending) in last 24h
 * - conflictRate: purchases with conflict status (refunded/partially_refunded) in last 24h
 * - avgValue: average total_price of completed purchases in last 24h
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'
import { handleApiError } from '@/lib/utils/api-error-handler'

interface PurchaseMetrics {
  purchasesPerHour: number
  successRate: number
  conflictRate: number
  avgValue: number
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

    const [completedLastHour, completedLast24h, totalTerminalLast24h, conflictedLast24h, valueSample] =
      await Promise.all([
        // Completed purchases in the last hour
        supabase
          .from('marketplace_purchases')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('created_at', oneHourAgo.toISOString()),

        // Completed purchases in last 24h (for success rate numerator)
        supabase
          .from('marketplace_purchases')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('created_at', twentyFourHoursAgo.toISOString()),

        // All non-pending purchases in last 24h (denominator for rates)
        supabase
          .from('marketplace_purchases')
          .select('*', { count: 'exact', head: true })
          .not('status', 'eq', 'pending')
          .gte('created_at', twentyFourHoursAgo.toISOString()),

        // Refunded / partially_refunded purchases in last 24h (conflict indicator)
        supabase
          .from('marketplace_purchases')
          .select('*', { count: 'exact', head: true })
          .in('status', ['refunded', 'partially_refunded'])
          .gte('created_at', twentyFourHoursAgo.toISOString()),

        // Completed purchases with price data for avg value calculation
        supabase
          .from('marketplace_purchases')
          .select('total_price')
          .eq('status', 'completed')
          .gte('created_at', twentyFourHoursAgo.toISOString())
          .limit(500),
      ])

    const purchasesPerHour = completedLastHour.count ?? 0
    const completed24h = completedLast24h.count ?? 0
    const terminal24h = totalTerminalLast24h.count ?? 0
    const conflicted24h = conflictedLast24h.count ?? 0

    const successRate = terminal24h > 0 ? completed24h / terminal24h : 1
    const conflictRate = terminal24h > 0 ? conflicted24h / terminal24h : 0

    const prices = (valueSample.data ?? []).map((r) => Number(r.total_price)).filter((v) => !isNaN(v))
    const avgValue = prices.length > 0 ? prices.reduce((sum, v) => sum + v, 0) / prices.length : 0

    const metrics: PurchaseMetrics = {
      purchasesPerHour,
      successRate,
      conflictRate,
      avgValue,
    }

    return NextResponse.json({ data: metrics })
  } catch (error) {
    safeError('Failed to fetch purchase metrics:', error)
    return handleApiError(error)
  }
}
