/**
 * Lead Count Reset Cron
 *
 * GET /api/cron/reset-lead-counts
 *
 * Resets daily/weekly/monthly lead counts in user_targeting.
 * Without this, users permanently hit their caps after the first period.
 *
 * Schedule: Daily at midnight UTC (0 0 * * *)
 * - Daily counts: reset every run
 * - Weekly counts: reset on Monday (day 1)
 * - Monthly counts: reset on 1st of month
 *
 * Auth: CRON_SECRET Bearer token (Vercel Cron sends automatically).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'


export async function GET(request: NextRequest) {
  // Auth: Vercel Cron sends CRON_SECRET automatically
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0=Sun, 1=Mon, ...
  const dayOfMonth = now.getUTCDate()

  const results: Record<string, unknown> = {}

  try {
    // Always reset daily counts
    const { error: dailyError, count: dailyCount } = await supabase
      .from('user_targeting')
      .update({
        daily_lead_count: 0,
        updated_at: now.toISOString(),
      })
      .gt('daily_lead_count', 0)

    results.daily_reset = dailyError
      ? { error: dailyError.message }
      : { reset: true, rows_affected: dailyCount }

    // Reset weekly counts on Monday (UTC)
    if (dayOfWeek === 1) {
      const { error: weeklyError, count: weeklyCount } = await supabase
        .from('user_targeting')
        .update({
          weekly_lead_count: 0,
          updated_at: now.toISOString(),
        })
        .gt('weekly_lead_count', 0)

      results.weekly_reset = weeklyError
        ? { error: weeklyError.message }
        : { reset: true, rows_affected: weeklyCount }
    } else {
      results.weekly_reset = { skipped: true, reason: `Not Monday (day=${dayOfWeek})` }
    }

    // Reset monthly counts on 1st of month (UTC)
    if (dayOfMonth === 1) {
      const { error: monthlyError, count: monthlyCount } = await supabase
        .from('user_targeting')
        .update({
          monthly_lead_count: 0,
          updated_at: now.toISOString(),
        })
        .gt('monthly_lead_count', 0)

      results.monthly_reset = monthlyError
        ? { error: monthlyError.message }
        : { reset: true, rows_affected: monthlyCount }
    } else {
      results.monthly_reset = { skipped: true, reason: `Not 1st (day=${dayOfMonth})` }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    })
  } catch (error) {
    safeError('[Lead Count Reset] Unhandled error:', error)
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
  }
}
