# Affiliate program — launch readiness checklist

**Status:** NOT launch-ready (soft-launch possible after P0s)
**Date:** 2026-06-12

## ✅ Done + verified
- Redirect-loop / "Unauthorized" fixed (Connect Stripe reaches onboarding) — confirmed live.
- `transfers` + `card_payments` capability on account create — validated vs Stripe test.
- Idempotency keys on all 3 `transfers.create` (24h retry double-pay protection).
- Agreement: correct entity (AM Collective LLC) + Oregon governing law, v1.1.
- Stripe: Connect enabled, platform profile (test+live), 1099-NEC reporting configured.

## ✅ P0 — DONE + PROVEN (2026-06-12, test-mode harness)
1. **End-to-end payout proof (test mode).** ✅ PROVEN. Seeded affiliate+referral+user, drove a
   real `invoice.payment_succeeded` via Stripe test invoice through the local webhook route:
   commission $150 (15%) created → `transfers.create` → $150 landed in connected acct available
   balance (`tr_*`, metadata links commission/affiliate/invoice). Re-delivered event → route
   "Duplicate event detected, skipping", transfer count stayed 1 (idempotency holds). All test
   rows + Stripe objects torn down; zero DB footprint.
2. **LIVE mode parity.** ✅ CONFIRMED. Prod uses `sk_live`/live `whsec`; live platform account
   has transfers+card_payments active, charges_enabled, Connect live; prod webhook endpoint
   `enabled` and subscribed to all 8 required events (incl. invoice.payment_succeeded, account.updated,
   charge.refunded, customer.subscription.deleted).

## ✅ P0 — LAUNCH BLOCKERS — FIXED 2026-06-12 (safe-feature-slice + TDD)
- **B1 FIXED** — single hardened claim authority `resolveAffiliateIdForUser` in `portal.ts`
  (verified-email + one-time `.is('user_id',null)` CAS). Re-pointed `accept-terms/route.ts`
  AND the legacy `(affiliate)/layout.tsx` (which had the SAME unguarded email link) through it.
  No raw-email fallback remains.
- **B2 FIXED** — `isSelfReferral` guard (`guards.ts`) at all 3 inserts (`attribute/route.ts`,
  `processAffiliateAttribution`, `processAffiliateAttributionByEmail`) + commission backstop in
  `recordCommissionForReferral` + authoritative DB BEFORE-INSERT/UPDATE trigger
  `affiliate_reject_self_referral` + one-time cleanup (migration `20260612130000`). Also fixed a
  PostgREST `.or()` injection in `processAffiliateActivation` surfaced by review.
- **B3 FIXED** — `charge.dispute.created` (via `resolveInvoiceIdForCharge`) + `invoice.voided` +
  `invoice.marked_uncollectible` wired to `handleAffiliateClawback`; real
  `transfers.createReversal` against stored `stripe_transfer_id` with accounting carry-forward
  fallback; new terminal `'reversed'` status; cron clamps net ≥ 0 (`clampTransferCents`) and
  carries negative balances forward. Earnings debited exactly once per clawback (reviewer-caught
  double-debit fixed).
- **B4 FIXED** — atomic claim CAS via `stripe_transfer_id` in `cron/affiliate-payouts/route.ts`
  (+ `.is('stripe_transfer_id', null)` on select, `releaseClaim` on failure) and mirrored in the
  `commission.ts` immediate path. A dropped post-transfer write can no longer re-pay.
- Tests: `affiliate-guards`, `affiliate-claim-guard`, `affiliate-clawback-accounting` (22 new).
  Full suite 1596 passing, 0 fail. Reviewed by security-reviewer + code-reviewer (0 CRITICAL/HIGH
  remaining; both money-accounting findings fixed).

### Original blocker descriptions (for reference)
B1. **Partner-account takeover → payout redirection.** `api/affiliate/accept-terms/route.ts:35-52`
    falls back to matching the affiliate row by raw `authUser.email` with NO `email_confirmed_at`
    check and NO one-time-claim guard, then binds `user_id=attacker`. Attacker signs up with a known
    partner's email → claims their affiliate row → attaches own bank via stripe-connect → cron pays
    attacker the victim's commissions. Fix: use hardened `getAffiliateForUser(...)` like `sign-agreement`;
    consider deleting this legacy duplicate of `sign-agreement`.
B2. **Self-referral perpetual kickback.** No guard anywhere (attribute route, `processAffiliateAttribution`,
    `processAffiliateAttributionByEmail`, funnel self-heal, commission recording, or DB) prevents an
    affiliate from being attributed to their OWN email/user/workspace. They self-refer → earn 15-40%
    on their own subscription every renewal. Fix: block `referred_email/user_id/workspace==affiliate's own`
    at all 3 attribution inserts + backstop in `recordCommissionForReferral` + DB BEFORE-INSERT trigger.
    One-time cleanup of any existing self-referral rows needed.
B3. **Refund/dispute/void clawback gaps + no cash reversal.** Only `charge.refunded` triggers
    `handleAffiliateClawback`; `charge.dispute.created` (chargeback — worse: lose revenue+fee+commission)
    and `invoice.voided`/`marked_uncollectible` are NOT wired. No `transfers.createReversal` anywhere →
    clawback is accounting-only; if the partner never earns again the negative row sits pending forever and
    cash is unrecoverable. Negative net can also strand pending rows / risk a ≤0 transfer in cron. Fix: wire
    dispute+void to clawback; add reversal against stored `stripe_transfer_id`; clamp cron `total` ≥ 0 and
    carry clawback balance forward explicitly.
B4. **Claim-before-transfer double-pay (was P1 #3).** `cron/affiliate-payouts/route.ts:55-58` selects
    `status='pending'` WITHOUT `stripe_transfer_id IS NULL`; a dropped post-transfer write (Slack-alert only)
    leaves the commission pending → re-selected next month (>24h, idempotency key expired) → double-pay.
    Mirror the same gap in `commission.ts` immediate path. Fix per `2026-06-12-affiliate-payout-claim-guard.md`
    (atomic claim CAS via `stripe_transfer_id`).

## 🟠 P1 — before scaling past a tiny cohort
3. **Claim-before-transfer guard** (see 2026-06-12-affiliate-payout-claim-guard.md).
   Cross-month double-pay protection. Real money — build before volume.
4. **Counsel review of agreement** — file self-flags "not a substitute for licensed counsel."
   One lawyer pass for real liability protection (Adam's stated goal).

## 🟡 P2 — fast-follow
5. transfers-only Stripe approval -> drop card_payments for clean recipient model.
6. `account.updated` webhook to auto-flip stripe_onboarding_complete (avoids stale status
   if affiliate closes tab before the callback redirect).
7. Consolidate the 3 affiliate surfaces (legacy /affiliate/*, dashboard hub, /partners/portal).

## Recommended path
- Do P0 #1 + #2 -> **soft-launch to 2-3 trusted affiliates**, watch one real payout clear.
- Land P1 #3 -> **open marketing**.
