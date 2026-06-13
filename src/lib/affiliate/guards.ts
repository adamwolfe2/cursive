/**
 * Affiliate program — pure invariant guards.
 *
 * These are framework-free predicates used at every money-touching insert/transfer
 * site so the rules live in ONE place (and are unit-tested exhaustively). The
 * authoritative backstops are still in the database (BEFORE-INSERT trigger for
 * self-referral; idempotency + claim CAS for payouts) — these guards reject early
 * so we never depend on a swallowed DB error.
 */

/** The affiliate's own identity, used to detect self-referral. */
export interface AffiliateIdentity {
  email: string | null | undefined
  /** affiliates.user_id (auth user id, stored as TEXT). */
  userId: string | null | undefined
  /** The workspace owned by the affiliate, if known. */
  workspaceId: string | null | undefined
}

/** The party being attributed to the affiliate. Any subset may be present. */
export interface ReferredParty {
  email?: string | null
  userId?: string | null
  workspaceId?: string | null
}

function eqInsensitive(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

function eqExact(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  return a === b
}

/**
 * True when the referred party IS the affiliate themselves — by email, auth user,
 * or owned workspace. Blocking this prevents an affiliate from self-referring and
 * earning a perpetual kickback on their own subscription (blocker B2).
 *
 * Conservative by construction: a match on ANY identity dimension is self-referral.
 * Missing values never match (no false positives from nulls).
 */
export function isSelfReferral(affiliate: AffiliateIdentity, referred: ReferredParty): boolean {
  if (eqInsensitive(affiliate.email, referred.email)) return true
  if (eqExact(affiliate.userId, referred.userId)) return true
  if (eqExact(affiliate.workspaceId, referred.workspaceId)) return true
  return false
}

/**
 * Clamp a Stripe transfer amount to a safe, non-negative integer number of cents.
 *
 * A partner's net for a period can go ≤ 0 once clawbacks (refunds/disputes/voids)
 * are netted in. Stripe rejects a transfer of ≤ 0, and we must never attempt a
 * negative transfer — the residual negative balance is carried forward instead
 * (blocker B3). Returns 0 for any non-positive / non-finite input.
 */
export function clampTransferCents(totalCents: number): number {
  if (!Number.isFinite(totalCents) || totalCents <= 0) return 0
  return Math.floor(totalCents)
}

/** True when a clamped total is actually transferable (> 0). */
export function isTransferable(totalCents: number): boolean {
  return clampTransferCents(totalCents) > 0
}
