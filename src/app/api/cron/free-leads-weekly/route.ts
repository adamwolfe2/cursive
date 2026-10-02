/**
 * Free leads weekly delivery (Vercel Cron, Mondays 14:00 UTC, catch-up 16:00 UTC).
 *
 * Replaces the Inngest cron as the production trigger (Inngest is not synced in prod). Calls the same
 * service as the Inngest function. Spend safety lives in src/lib/free-leads/weekly.ts: the paid-up
 * check runs first, then the unique (order_id, week) row in free_lead_weekly_deliveries is written
 * BEFORE any paid pull, so the 16:00 catch-up, a retried invocation, or an Inngest run overlapping
 * this one finds the row and buys nothing. Failed weeks are alerted, never re-bought.
 *
 * Auth: CRON_SECRET Bearer (Vercel sends it automatically).
 */

export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { runWeekly } from '@/lib/free-leads/weekly'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

// Stop starting new orders with a minute to spare; the catch-up run takes the rest.
const BUDGET_MS = (maxDuration - 60) * 1000

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const summary = await runWeekly(createAdminClient(), new Date(), Date.now() + BUDGET_MS)
    return NextResponse.json({ success: true, ...summary })
  } catch (err) {
    safeError('[free-leads-weekly] cron run failed', err)
    return NextResponse.json({ error: 'Weekly run failed' }, { status: 500 })
  }
}
