/**
 * API Spend Guard — daily cost cap with Slack alerts
 *
 * Call `checkSpendLimit()` before expensive API calls (Claude Sonnet/Opus).
 * Throws if the daily cap is exceeded, preventing runaway spending.
 *
 * Daily cap defaults to $50 (DAILY_API_SPEND_CAP env var).
 * Alert threshold at 80% of cap.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError } from '@/lib/utils/log-sanitizer'

const DEFAULT_DAILY_CAP_USD = 50
const ALERT_THRESHOLD_PCT = 0.8

// In-memory cache to avoid DB query on every call (resets per instance)
let cachedSpend: { date: string; total: number; alertSent: boolean } | null = null

function getDailyCap(): number {
  const envCap = process.env.DAILY_API_SPEND_CAP
  return envCap ? parseFloat(envCap) : DEFAULT_DAILY_CAP_USD
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Query the api_logs table for today's total spend.
 */
async function fetchDailySpend(): Promise<number> {
  const supabase = createAdminClient()
  const today = todayUTC()

  const { data, error } = await supabase
    .from('api_logs')
    .select('estimated_cost')
    .gte('created_at', `${today}T00:00:00Z`)
    .lt('created_at', `${today}T23:59:59.999Z`)

  if (error) {
    safeError('[spend-guard] Failed to query api_logs:', error.message)
    // Fail open — don't block API calls if we can't check
    return 0
  }

  return (data ?? []).reduce((sum, row) => sum + (row.estimated_cost ?? 0), 0)
}

/**
 * Check if daily API spend is within limits.
 * Sends Slack alert at 80% threshold.
 * Throws SpendLimitExceededError if cap exceeded.
 */
export async function checkSpendLimit(): Promise<void> {
  const cap = getDailyCap()
  const today = todayUTC()

  // Use cache if same day and under threshold
  if (cachedSpend?.date === today && cachedSpend.total < cap * ALERT_THRESHOLD_PCT) {
    return
  }

  const total = await fetchDailySpend()
  const alertSent = cachedSpend?.date === today ? cachedSpend.alertSent : false
  cachedSpend = { date: today, total, alertSent }

  // Alert at 80%
  if (total >= cap * ALERT_THRESHOLD_PCT && !alertSent) {
    cachedSpend.alertSent = true
    await sendSlackAlert({
      type: 'system_health',
      severity: 'warning',
      message: `Daily API spend at $${total.toFixed(2)} / $${cap} cap (${Math.round((total / cap) * 100)}%)`,
      metadata: { daily_spend: total, daily_cap: cap, date: today },
    }).catch(() => {/* non-fatal */})
  }

  // Hard cap
  if (total >= cap) {
    await sendSlackAlert({
      type: 'system_health',
      severity: 'critical',
      message: `Daily API spend cap exceeded: $${total.toFixed(2)} / $${cap}. Blocking further calls.`,
      metadata: { daily_spend: total, daily_cap: cap, date: today },
    }).catch(() => {/* non-fatal */})

    throw new SpendLimitExceededError(total, cap)
  }
}

export class SpendLimitExceededError extends Error {
  constructor(public spend: number, public cap: number) {
    super(`Daily API spend cap exceeded: $${spend.toFixed(2)} / $${cap}`)
    this.name = 'SpendLimitExceededError'
  }
}

/**
 * Increment the cached spend total after a call completes.
 * Keeps the cache accurate without re-querying the DB.
 */
export function recordSpend(costUsd: number): void {
  const today = todayUTC()
  if (cachedSpend?.date === today) {
    cachedSpend.total += costUsd
  }
}
