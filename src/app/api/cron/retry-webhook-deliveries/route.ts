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
import { deliverWebhook } from '@/lib/services/webhook-delivery.service'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const MAX_PER_RUN = 50
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
    .select('id, webhook_id, event_type, payload, attempts')
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

  for (const row of stuck ?? []) {
    // The stored payload is the full envelope; re-send only its data so the
    // service rebuilds a fresh envelope with a current timestamp and signature.
    const data = (row.payload as { data?: unknown } | null)?.data ?? row.payload

    try {
      const result = await deliverWebhook(row.webhook_id, row.event_type, data, { maxAttempts: 1 })
      if (result.success) redelivered++
      else stillFailing++
    } catch (err) {
      safeError('[WebhookRetry] Redelivery threw:', err)
      stillFailing++
    }

    // Bump the original row's attempt count. The redelivery wrote its own row;
    // this one stops being swept once it reaches MAX_ATTEMPTS. No new status
    // value is introduced, so the delivery log keeps reading the same way.
    await supabase
      .from('outbound_webhook_deliveries')
      .update({ attempts: (row.attempts ?? 0) + 1 })
      .eq('id', row.id)
  }

  safeLog(`[WebhookRetry] swept=${stuck?.length ?? 0} redelivered=${redelivered} stillFailing=${stillFailing}`)

  return NextResponse.json({
    swept: stuck?.length ?? 0,
    redelivered,
    still_failing: stillFailing,
  })
}
