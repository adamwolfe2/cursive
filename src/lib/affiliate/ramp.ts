/**
 * Outbound Partner — Commission Ramp (single source of truth)
 *
 * The partner's commission rate scales with the number of referred customers
 * who are CURRENTLY paying (active subscriptions attributed to them). A churn
 * lowers the active count and can demote the rate. The current rate applies to
 * their ENTIRE active book each billing cycle (retroactive whole-book), which
 * happens naturally because every invoice reads the live rate at payment time.
 *
 *   active paying referrals   →   commission rate
 *   ───────────────────────────────────────────────
 *   0 – 4                     →   15%
 *   5 – 14                    →   20%
 *   15 – 24                   →   25%
 *   25 – 34                   →   30%
 *   35 – 44                   →   35%
 *   45+                       →   40%
 *
 * Keep this in lock-step with the SQL function `affiliate_ramp_rate(int)` in the
 * 20260612 migration. If you change one, change both.
 */

export interface RampTier {
  /** Minimum number of active paying referrals to reach this tier (inclusive). */
  readonly minPaying: number
  /** Commission rate as a whole-number percentage. */
  readonly rate: number
  /** Human label for the portal/marketing. */
  readonly label: string
}

/** Ordered low → high. The last tier whose `minPaying <= count` wins. */
export const RAMP_TIERS: readonly RampTier[] = [
  { minPaying: 0, rate: 15, label: 'Partner' },
  { minPaying: 5, rate: 20, label: 'Bronze' },
  { minPaying: 15, rate: 25, label: 'Silver' },
  { minPaying: 25, rate: 30, label: 'Gold' },
  { minPaying: 35, rate: 35, label: 'Platinum' },
  { minPaying: 45, rate: 40, label: 'Elite' },
] as const

export const MIN_RATE = RAMP_TIERS[0].rate
export const MAX_RATE = RAMP_TIERS[RAMP_TIERS.length - 1].rate

/**
 * The commission rate (whole-number %) for a given count of active paying
 * referrals. Defensive against negative/NaN inputs — always returns a valid
 * rate in [MIN_RATE, MAX_RATE].
 */
export function rampRate(activePaying: number): number {
  const count = Number.isFinite(activePaying) ? Math.max(0, Math.floor(activePaying)) : 0
  let rate = RAMP_TIERS[0].rate
  for (const tier of RAMP_TIERS) {
    if (count >= tier.minPaying) rate = tier.rate
    else break
  }
  return rate
}

/** The tier object a given count currently sits in. */
export function currentTier(activePaying: number): RampTier {
  const count = Number.isFinite(activePaying) ? Math.max(0, Math.floor(activePaying)) : 0
  let result = RAMP_TIERS[0]
  for (const tier of RAMP_TIERS) {
    if (count >= tier.minPaying) result = tier
    else break
  }
  return result
}

export interface NextTierInfo {
  /** Active-paying count required to unlock the next rate. */
  readonly at: number
  /** The rate unlocked at that threshold. */
  readonly rate: number
  /** How many more paying referrals are needed from the current count. */
  readonly remaining: number
  readonly label: string
}

/**
 * Info about the next rate the partner can unlock, or null if they're already
 * at the max (40%).
 */
export function nextTier(activePaying: number): NextTierInfo | null {
  const count = Number.isFinite(activePaying) ? Math.max(0, Math.floor(activePaying)) : 0
  for (const tier of RAMP_TIERS) {
    if (count < tier.minPaying) {
      return {
        at: tier.minPaying,
        rate: tier.rate,
        remaining: tier.minPaying - count,
        label: tier.label,
      }
    }
  }
  return null
}

/**
 * Compute the commission amount (in cents) for an invoice, given the partner's
 * current active-paying count. Floors to whole cents.
 */
export function commissionForInvoice(invoiceAmountCents: number, activePaying: number): number {
  if (!Number.isFinite(invoiceAmountCents) || invoiceAmountCents <= 0) return 0
  const rate = rampRate(activePaying)
  return Math.floor((invoiceAmountCents * rate) / 100)
}
