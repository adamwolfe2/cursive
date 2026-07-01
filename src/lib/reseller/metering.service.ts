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
 */
export function decideDelivery(
  reseller: Pick<
    Reseller,
    'status' | 'period_kind' | 'lead_cap_per_period' | 'default_throttle_mode' | 'period_start' | 'leads_delivered_period'
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

  // Per-pixel cap.
  if (pixel.lead_cap_per_period != null) {
    const used = effectivePeriodCount(pixel.period_start, pixel.leads_delivered_period, cur)
    if (used >= pixel.lead_cap_per_period) {
      return { deliver: false, throttled: false, reason: 'pixel_cap' }
    }
  }

  // Throttle: pixel override wins; else reseller default.
  const throttled = pixel.throttle_mode ?? reseller.default_throttle_mode

  return { deliver: true, throttled }
}

/**
 * Atomically record a delivery outcome (period-aware counters + daily rollup).
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
