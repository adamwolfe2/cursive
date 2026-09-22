/**
 * Retry Failed Outbound Webhook Deliveries (Vercel Cron)
 *
 * Live deliveries are attempted once inline so the identification hot path is
 * never held open by a slow customer endpoint. This sweep is the other half of
 * that trade: a customer endpoint that was briefly down gets its leads, instead
 * of them being lost silently.
 *
 * Bounded so a permanently dead endpoint cannot cost anything unbounded:
 *  - up to 50 deliveries per run
 *  - up to 4 total attempts per delivery
 *  - nothing older than 24h
 *
 * Auth: CRON_SECRET Bearer (Vercel sends it automatically).
 */

export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { retryDelivery } from '@/lib/services/webhook-delivery.service'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

// Sized to fit maxDuration: 25 rows at concurrency 5 is 5 waves, and each wave
// is capped by the delivery timeout, so a run of dead endpoints still lands
// well inside 60s.
const MAX_PER_RUN = 25
const CONCURRENCY = 5
const MAX_ATTEMPTS = 4
const MAX_AGE_HOURS = 24

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 3600_000).toISOString()

  const { data: stuck, error } = await supabase
    .from('outbound_webhook_deliveries')
    .select('id')
    .eq('status', 'failed')
    .lt('attempts', MAX_ATTEMPTS)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(MAX_PER_RUN)

  if (error) {
    safeError('[WebhookRetry] Failed to load stuck deliveries:', error)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }

  let redelivered = 0
  let stillFailing = 0

  // Retry in place: retryDelivery updates the same row, so `attempts` keeps
  // climbing toward MAX_ATTEMPTS instead of resetting on every sweep.
  const queue = [...(stuck ?? [])]
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    for (let row = queue.shift(); row; row = queue.shift()) {
      try {
        const result = await retryDelivery(row.id)
        if (result.success) redelivered++
        else stillFailing++
      } catch (err) {
        safeError('[WebhookRetry] Redelivery threw:', err)
        stillFailing++
      }
    }
  })
  await Promise.all(workers)

  safeLog(`[WebhookRetry] swept=${stuck?.length ?? 0} redelivered=${redelivered} stillFailing=${stillFailing}`)

  return NextResponse.json({
    swept: stuck?.length ?? 0,
    redelivered,
    still_failing: stillFailing,
  })
}
