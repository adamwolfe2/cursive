export const runtime = 'nodejs'

/**
 * Admin Email Deliverability — Volume Trends
 * Cursive Platform
 *
 * GET /api/admin/email-deliverability/trends
 *
 * Returns daily email volume metrics for the last 30 days, aggregated
 * in-memory from email_sends.
 *
 * Per-day fields returned:
 *   date        — YYYY-MM-DD
 *   sent        — total rows created that day
 *   opened      — rows with opened_at set that day
 *   clicked     — rows with clicked_at set that day
 *   bounced     — rows with bounced_at set that day
 *   unsubscribed — campaign_leads updated to 'unsubscribed' that day
 *
 * Auth: requireAdmin()
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

// ---- Types ----

interface DailyTrend {
  date: string
  sent: number
  opened: number
  clicked: number
  bounced: number
  unsubscribed: number
}

// ---- GET handler ----

export async function GET() {
  try {
    await requireAdmin()

    const adminClient = createAdminClient()
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    safeLog('[EmailDeliverability/Trends] Querying email_sends for last 30 days')

    // Fetch all sends in period with tracking timestamps
    const { data: sends, error: sendsError } = await adminClient
      .from('email_sends')
      .select('created_at, opened_at, clicked_at, bounced_at')
      .gte('created_at', since)
      .order('created_at', { ascending: true })

    if (sendsError) {
      safeError('[EmailDeliverability/Trends] email_sends query error:', sendsError)
      return NextResponse.json({
        success: true,
        data: {
          trends: [],
          period_days: 30,
          note: 'email_sends table unavailable',
        },
      })
    }

    // Build date map for the last 30 days (ensure every day is present)
    const dayMap = new Map<string, DailyTrend>()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      dayMap.set(key, { date: key, sent: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 })
    }

    // Aggregate sends
    for (const row of sends ?? []) {
      const day = (row.created_at ?? '').slice(0, 10)
      const entry = dayMap.get(day)
      if (!entry) continue
      entry.sent += 1
      if (row.opened_at) entry.opened += 1
      if (row.clicked_at) entry.clicked += 1
      if (row.bounced_at) entry.bounced += 1
    }

    // Fetch daily unsubscribes from campaign_leads
    try {
      const { data: unsubs, error: unsubError } = await adminClient
        .from('campaign_leads')
        .select('created_at')
        .eq('status', 'unsubscribed')
        .gte('created_at', since)

      if (!unsubError) {
        for (const row of unsubs ?? []) {
          const day = (row.created_at ?? '').slice(0, 10)
          const entry = dayMap.get(day)
          if (entry) entry.unsubscribed += 1
        }
      } else {
        safeError('[EmailDeliverability/Trends] campaign_leads unsub query error:', unsubError)
      }
    } catch (unsubErr) {
      safeError('[EmailDeliverability/Trends] Unsub query threw:', unsubErr)
    }

    const trends = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date))

    safeLog('[EmailDeliverability/Trends] Returning', trends.length, 'days')

    return NextResponse.json({
      success: true,
      data: {
        trends,
        period_days: 30,
      },
    })
  } catch (error: unknown) {
    safeError('[EmailDeliverability/Trends] Route error:', error)

    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('Unauthorized') || msg.includes('forbidden')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch email volume trends' },
      { status: 500 }
    )
  }
}
