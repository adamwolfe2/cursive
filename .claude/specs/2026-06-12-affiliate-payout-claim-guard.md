# Slice: Affiliate payout claim-before-transfer guard

**Status:** pending
**Tier:** 1 (money) — safe-feature-slice + TDD required
**Date:** 2026-06-12

## Problem
`stripe.transfers.create` now has idempotency keys (24h dedupe → kills
webhook-retry / cron-retry double-pay). One gap remains: if a transfer
**succeeds** but the subsequent DB "mark paid" write **fails**, the commission
stays `status='pending'` with `stripe_transfer_id=null` and is re-selected next
month → **double-pay** (>24h later, so the idempotency key no longer dedupes).
Today this is only caught by a CRITICAL Slack alert (manual reconciliation).

## Fix — claim lock via `stripe_transfer_id` (migration-free)
Invariant: a commission/bonus can be selected for payout only while
`status='pending' AND stripe_transfer_id IS NULL`. Claim it BEFORE transferring.

Per affiliate, per run:
1. **Claim** (atomic CAS): `UPDATE affiliate_commissions SET stripe_transfer_id=<claimKey>
   WHERE id IN (ids) AND status='pending' AND stripe_transfer_id IS NULL RETURNING id, amount`.
   `claimKey = payout_<affiliateId>_<YYYY-MM>` (== the transfer idempotency key).
2. Recompute `total` from **claimed rows only**.
3. `transfers.create({amount: total}, {idempotencyKey: claimKey})`.
4. **Success** → `UPDATE ... SET status='paid', stripe_transfer_id=<realTransferId>, paid_at=now WHERE stripe_transfer_id=<claimKey>`.
5. **Failure** → revert: `UPDATE ... SET stripe_transfer_id=NULL WHERE stripe_transfer_id=<claimKey> AND status='pending'`.

A dropped post-transfer write leaves rows claimed (`stripe_transfer_id` set) →
excluded from next month's selection → never re-paid. Stuck rows surface for
reconciliation. Apply the same pattern to `affiliate_milestone_bonuses`.

Also update the cron's initial SELECT to filter `.is('stripe_transfer_id', null)`.
Mirror the claim in `src/lib/affiliate/commission.ts` (per-invoice path) so the
two payout paths share the invariant.

## Files
- `src/app/api/cron/affiliate-payouts/route.ts` (claim/transfer/settle/revert)
- `src/lib/affiliate/commission.ts` (claim before immediate transfer)
- tests: extend `src/__tests__/unit/` — claim CAS, revert-on-failure,
  no-double-select, skip unsigned/uncapability.

## Out of scope
- `account.updated` webhook to auto-flip `stripe_onboarding_complete` (nice-to-have).
- Dropping `card_payments` capability once Stripe approves transfers-only.
