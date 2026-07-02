/**
 * Reseller Metering + Caps (decision is pure; persistence is atomic via RPC)
 *
 * decideDelivery() is a pure function so cap/throttle behavior is fully
 * unit-testable. It answers: for this lead, do we deliver, and is it throttled?
 *
 * Cap semantics (soft caps controlling OVERAGE, not data capture — leads are
 * always captured in `leads`; caps only govern outbound delivery):
 *   - reseller.status must be 'active'
 *   - pixel.status must be 'active'
 *   - reseller-wide cap checked first, then per-pixel cap
 *   - a cap is compared against the CURRENT period's delivered count; if the
 *     stored period is stale (previous month/day) the effective count is 0
 *   - throttle_mode (pixel override, else reseller default) => reduced payload
 *
 * Counter persistence is done by reseller_record_delivery() (plpgsql), which is
 * atomic and handles the same period-reset logic, so concurrent workers never
 * lose increments. A minor over-delivery at the exact cap boundary under high
 * concurrency is accepted for v1 (documented in the slice spec).
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { Reseller, ResellerPixel, DeliveryDecision, DeliveryOutcome, PeriodKind } from './types'

/** Current period start (YYYY-MM-DD) for the given period kind, at `now`. */
export function currentPeriodStart(kind: PeriodKind, now: Date = new Date()): string {
  if (kind === 'day') {
    return now.toISOString().slice(0, 10)
  }
  // Calendar month — first day (UTC).
  return `${now.toISOString().slice(0, 7)}-01`
}

/** Effective delivered-this-period count: 0 when the stored period is stale. */
function effectivePeriodCount(
  storedPeriodStart: string,
  storedCount: number,
  curPeriodStart: string,
): number {
  return storedPeriodStart < curPeriodStart ? 0 : storedCount
}

/**
 * Pure cap + throttle decision. No I/O.
 *
 * This mirrors the authoritative SQL in reseller_consume_delivery() and is used
 * as a cheap pre-check (and is unit-tested as the behavior spec). The atomic
 * enforcement that prevents boundary races lives in the RPC — see consumeDelivery.
 *
 * Effective per-pixel cap = explicit pixel cap, else the reseller default cap.
 */
export function decideDelivery(
  reseller: Pick<
    Reseller,
    | 'status'
    | 'period_kind'
    | 'lead_cap_per_period'
    | 'default_lead_cap_per_period'
    | 'default_throttle_mode'
    | 'period_start'
    | 'leads_delivered_period'
  >,
  pixel: Pick<
    ResellerPixel,
    'status' | 'lead_cap_per_period' | 'throttle_mode' | 'period_start' | 'leads_delivered_period'
  >,
  now: Date = new Date(),
): DeliveryDecision {
  if (reseller.status !== 'active') {
    return { deliver: false, throttled: false, reason: 'reseller_suspended' }
  }
  if (pixel.status !== 'active') {
    return { deliver: false, throttled: false, reason: 'inactive' }
  }

  const cur = currentPeriodStart(reseller.period_kind, now)

  // Reseller-wide cap first.
  if (reseller.lead_cap_per_period != null) {
    const used = effectivePeriodCount(reseller.period_start, reseller.leads_delivered_period, cur)
    if (used >= reseller.lead_cap_per_period) {
      return { deliver: false, throttled: false, reason: 'reseller_cap' }
    }
  }

  // Effective per-pixel cap: explicit pixel cap, else reseller default (null = unlimited).
  const effectivePixelCap = pixel.lead_cap_per_period ?? reseller.default_lead_cap_per_period
  if (effectivePixelCap != null) {
    const used = effectivePeriodCount(pixel.period_start, pixel.leads_delivered_period, cur)
    if (used >= effectivePixelCap) {
      return { deliver: false, throttled: false, reason: 'pixel_cap' }
    }
  }

  // Throttle: pixel override wins; else reseller default.
  const throttled = pixel.throttle_mode ?? reseller.default_throttle_mode

  return { deliver: true, throttled }
}

/**
 * Atomically enforce caps and consume one delivery slot (race-safe).
 * Delegates to the reseller_consume_delivery RPC which locks the rows, checks
 * caps, and increments counters in one transaction. Returns the authoritative
 * decision.
 *
 * ERROR SEMANTICS: a transient RPC failure THROWS (it does not fail closed).
 * The caller runs this inside a retryable Inngest step, so a DB blip is retried
 * instead of silently dropping the lead as "cap-blocked". Retrying after an RPC
 * ERROR is safe: the RPC's transaction rolled back, so nothing was consumed.
 * (Known at-least-once edge: if the RPC COMMITS but the step result is lost
 * before Inngest persists it, a replay consumes a second slot — that errs
 * toward under-delivery, never past a partner's cap.)
 */
export async function consumeDelivery(
  resellerId: string,
  resellerPixelId: string,
): Promise<DeliveryDecision> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('reseller_consume_delivery', {
    p_reseller_id: resellerId,
    p_reseller_pixel_id: resellerPixelId,
  })
  if (error || !data) {
    safeError('[ResellerMetering] consume_delivery RPC failed:', error)
    throw new Error(`reseller_consume_delivery failed: ${error?.message ?? 'empty response'}`)
  }
  const d = data as { allowed?: boolean; throttled?: boolean; reason?: string | null }
  return {
    deliver: !!d.allowed,
    throttled: !!d.throttled,
    ...(d.reason ? { reason: d.reason as DeliveryDecision['reason'] } : {}),
  }
}

/**
 * Record a delivery outcome into the daily rollup (reporting/billing).
 * Never throws — metering failures must not crash the delivery worker.
 */
export async function recordDelivery(
  resellerId: string,
  resellerPixelId: string,
  outcome: DeliveryOutcome,
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.rpc('reseller_record_delivery', {
      p_reseller_id: resellerId,
      p_reseller_pixel_id: resellerPixelId,
      p_outcome: outcome,
    })
    if (error) {
      safeError('[ResellerMetering] record_delivery RPC failed:', error)
    }
  } catch (err) {
    safeError('[ResellerMetering] record_delivery unexpected error:', err)
  }
}
