export const runtime = 'nodejs'

/**
 * Admin Email Deliverability — Health Score
 * Cursive Platform
 *
 * GET /api/admin/email-deliverability/health
 *
 * Computes an overall deliverability health score (0-100) based on the last
 * 30 days of email_sends data. Score formula:
 *
 *   Start at 100
 *   -30 if bounce rate > 5%
 *   -20 if bounce rate > 2% (and not already penalised -30)
 *   -20 if open rate < 15%
 *   -10 if open rate < 20% (and not already penalised -20)
 *   -20 if unsubscribe rate > 1%
 *   -10 if unsubscribe rate > 0.5% (and not already penalised -20)
 *
 * Unsubscribes are read from campaign_leads.status = 'unsubscribed' for sends
 * created in the same period.
 *
 * Auth: requireAdmin()
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

// ---- Health score computation ----

function computeHealthScore(opts: {
  bounceRate: number
  openRate: number
  unsubscribeRate: number
}): number {
  let score = 100

  // Bounce rate penalty
  if (opts.bounceRate > 5) {
    score -= 30
  } else if (opts.bounceRate > 2) {
    score -= 20
  }

  // Open rate penalty
  if (opts.openRate < 15) {
    score -= 20
  } else if (opts.openRate < 20) {
    score -= 10
  }

  // Unsubscribe rate penalty
  if (opts.unsubscribeRate > 1) {
    score -= 20
  } else if (opts.unsubscribeRate > 0.5) {
    score -= 10
  }

  return Math.max(0, Math.min(100, score))
}

// ---- GET handler ----

export async function GET() {
  try {
    await requireAdmin()

    const adminClient = createAdminClient()
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    safeLog('[EmailDeliverability/Health] Querying email_sends for last 30 days')

    // Fetch sends with tracking fields
    const { data: sends, error: sendsError } = await adminClient
      .from('email_sends')
      .select('id, opened_at, bounced_at')
      .gte('created_at', since)

    if (sendsError) {
      safeError('[EmailDeliverability/Health] email_sends query error:', sendsError)
      // Return a safe default rather than 500
      return NextResponse.json({
        success: true,
        data: {
          health_score: 100,
          overall_open_rate: 0,
          overall_bounce_rate: 0,
          unsubscribe_rate: 0,
          total_sent: 0,
          period_days: 30,
          note: 'email_sends table unavailable — defaulting to 100',
        },
      })
    }

    const sendList = sends ?? []
    const totalSent = sendList.length
    const totalOpened = sendList.filter((r) => r.opened_at !== null).length
    const totalBounced = sendList.filter((r) => r.bounced_at !== null).length

    // Fetch unsubscribes: campaign_leads where status = 'unsubscribed' and updated within period
    let totalUnsubscribed = 0
    try {
      const { count, error: unsubError } = await adminClient
        .from('campaign_leads')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'unsubscribed')
        .gte('created_at', since)

      if (!unsubError) {
        totalUnsubscribed = count ?? 0
      } else {
        safeError('[EmailDeliverability/Health] campaign_leads unsub query error:', unsubError)
      }
    } catch (unsubErr) {
      safeError('[EmailDeliverability/Health] Unsub query threw:', unsubErr)
    }

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0
    const unsubscribeRate = totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0

    const healthScore = computeHealthScore({ bounceRate, openRate, unsubscribeRate })

    safeLog(
      '[EmailDeliverability/Health] score=%d open_rate=%d bounce_rate=%d unsub_rate=%d',
      healthScore,
      openRate,
      bounceRate,
      unsubscribeRate
    )

    return NextResponse.json({
      success: true,
      data: {
        health_score: healthScore,
        overall_open_rate: Number(openRate.toFixed(2)),
        overall_bounce_rate: Number(bounceRate.toFixed(2)),
        unsubscribe_rate: Number(unsubscribeRate.toFixed(3)),
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

    return NextResponse.json(
      { error: 'Failed to compute deliverability health score' },
      { status: 500 }
    )
  }
}
