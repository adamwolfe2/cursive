export const runtime = 'nodejs'

/**
 * Admin Email Deliverability — Health Score
 * Cursive Platform
 *
 * GET /api/admin/email-deliverability/health
 *
 * Computes overall deliverability health from email_sends (last 30 days):
 *   - open rate     (opened_at not null / total sent)
 *   - bounce rate   (bounced_at not null / total sent)
 *   - unsubscribe rate (campaign_leads unsubscribed / total sent)
 *
 * Health score (0-100):
 *   Start at 100, subtract penalties:
 *   - Bounce rate > 5% → -40 (critical)
 *   - Bounce rate > 2% → -20 (warning)
 *   - Open rate < 15% → -20
 *   - Open rate < 10% → -30
 *   - Unsub rate > 1%  → -20
 *   - Unsub rate > 0.5% → -10
 *
 * Auth: requireAdmin()
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

// ---- GET handler ----

export async function GET() {
  try {
    await requireAdmin()

    const adminClient = createAdminClient()
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    safeLog('[EmailDeliverability/Health] Querying email_sends for last 30 days')

    // Fetch sends with tracking columns
    const { data: sends, error: sendsError } = await adminClient
      .from('email_sends')
      .select('opened_at, bounced_at')
      .gte('created_at', since30d)

    if (sendsError) {
      safeError('[EmailDeliverability/Health] email_sends query error:', sendsError)
      return NextResponse.json({
        success: true,
        data: {
          health_score: 0,
          overall_open_rate: 0,
          overall_bounce_rate: 0,
          unsubscribe_rate: 0,
          total_sent: 0,
          total_opened: 0,
          total_bounced: 0,
          total_unsubscribed: 0,
          period_days: 30,
          note: 'email_sends table unavailable',
        },
      })
    }

    const rows = sends ?? []
    const totalSent = rows.length
    const totalOpened = rows.filter((r) => r.opened_at != null).length
    const totalBounced = rows.filter((r) => r.bounced_at != null).length

    // Fetch unsubscribes from campaign_leads (last 30 days)
    let totalUnsubscribed = 0
    try {
      const { count, error: unsubError } = await adminClient
        .from('campaign_leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unsubscribed')
        .gte('created_at', since30d)

      if (!unsubError) {
        totalUnsubscribed = count ?? 0
      } else {
        safeError('[EmailDeliverability/Health] campaign_leads unsub query error:', unsubError)
      }
    } catch (unsubErr) {
      safeError('[EmailDeliverability/Health] Unsub query threw:', unsubErr)
    }

    // Derived rates (percentages)
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0
    const unsubRate = totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0

    // Compute health score (0-100)
    let score = 100

    if (bounceRate >= 5) {
      score -= 40
    } else if (bounceRate >= 2) {
      score -= 20
    }

    if (openRate < 10) {
      score -= 30
    } else if (openRate < 15) {
      score -= 20
    }

    if (unsubRate >= 1) {
      score -= 20
    } else if (unsubRate >= 0.5) {
      score -= 10
    }

    const healthScore = Math.max(0, Math.min(100, Math.round(score)))

    safeLog('[EmailDeliverability/Health] Returning health score:', healthScore)

    return NextResponse.json({
      success: true,
      data: {
        health_score: healthScore,
        overall_open_rate: Number(openRate.toFixed(2)),
        overall_bounce_rate: Number(bounceRate.toFixed(2)),
        unsubscribe_rate: Number(unsubRate.toFixed(3)),
        total_sent: totalSent,
        total_opened: totalOpened,
        total_bounced: totalBounced,
        total_unsubscribed: totalUnsubscribed,
        period_days: 30,
      },
    })
  } catch (error: unknown) {
    safeError('[EmailDeliverability/Health] Route error:', error)

    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('Unauthorized') || msg.includes('forbidden')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Failed to fetch deliverability health' }, { status: 500 })
  }
}
