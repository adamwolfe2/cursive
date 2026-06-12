# Outbound Distribution Partner Program — Slice Spec

**Date:** 2026-06-12 · **Tier:** 1 (money / Stripe / payouts) · **Status:** built, pre-launch checklist pending

## Goal
Rinse-and-repeat partner program: outbound partners drive traffic to the Cursive
offers (VSL `/get-leads`, lead magnet `/visitor-estimate`) via tracked referral
links and earn **recurring** commission on the MRR they generate, on a ramp.

## Commission model (locked with Adam)
- Rate = f(current **active paying** referrals): 0–4=15%, 5–14=20%, 15–24=25%,
  25–34=30%, 35–44=35%, 45+=40%. Single source: `src/lib/affiliate/ramp.ts`
  (mirrored in SQL `affiliate_ramp_rate`).
- **Retroactive whole-book**: every invoice reads the live rate → all active
  referrals bill at the current rate.
- **Lifetime recurring** while subscribed. **Churn demotes** (tier = current
  active payers).
- Trigger = referred customer **pays** (Stripe `invoice.payment_succeeded`), not
  audience-match. Legacy $5k–$250k milestone cash bonuses DISABLED
  (`MILESTONE_CASH_BONUSES_ENABLED=false` in `activation.ts`).

## What was built
- **Engine**: `src/lib/affiliate/commission.ts` rewritten — ramp rate, atomic
  first-payment via RPC `affiliate_mark_paying`, churn via `affiliate_record_churn`
  / `affiliate_churn_referral`, clawback reverses earnings, idempotent.
- **Funnel path wired**: `src/lib/funnel/subscription-handlers.ts` now pays
  commission + churn on the $97/$197/$247 VSL renewals (previously bypassed).
  Deterministic attribution via `funnel_orders.affiliate_partner_code` stamped at
  checkout from `cursive_ref`.
- **Migration**: `supabase/migrations/20260612000001_affiliate_outbound_ramp.sql`
  — affiliate counters, `paying` status, `affiliate_agreements` table (+RLS),
  RPCs (ramp_rate, mark_paying, record_churn, churn_referral, add_earnings),
  funnel_orders.affiliate_partner_code.
- **Portal** `src/app/partners/portal/*`: Overview (rate, active payers, MRR
  driven, next-tier progress, balances, payout date), Referrals, Payouts (Stripe
  Connect), Links & Assets (per-product links + swipe copy), Achievements,
  Agreement (canvas e-signature). Gated by `requireAffiliate` (verified-email,
  one-time link).
- **Contract**: `src/lib/affiliate/agreement.ts` (canonical, hashed on sign).
  In-portal canvas signature → `POST /api/affiliate/sign-agreement` (PNG-only,
  rate-limited) → `affiliate_agreements`. Payouts gated on signed + Stripe.
- **Marketing**: `marketing/app/partners/page.tsx` one-pager (ramp graph,
  earnings example, apply form → `/api/affiliate/apply`) + `/partners/terms`.
- **Admin**: existing `/admin/affiliates` approve→creates affiliate+code; welcome
  email now points at `/partners/portal`.

## Verification done
- `src/__tests__/unit/affiliate-ramp.test.ts` (12 tests) + full suite: 112 pass.
- App + marketing typecheck clean. Next lint clean.
- code-reviewer + security-reviewer (Tier-1). CRITICALs fixed: account-takeover
  (verified-email + immutable link), non-atomic earnings (RPC), funnel
  mis-attribution (partner_code), signature XSS (PNG regex), cron agreement gate.

## PRE-LAUNCH CHECKLIST (before going live)
1. Apply migration to prod DB; verify `affiliate_referrals_status_check` dropped
   cleanly (standard PG name) before/after.
2. Confirm Supabase **email confirmation enabled** on the hosted project (code
   gates on `email_confirmed_at`, but enforce at auth layer too).
3. Stripe TEST end-to-end: pay → commission → tier bump → churn demote → refund
   clawback → monthly payout.
4. **Legal review of the agreement by counsel**; set COMPANY_LEGAL_NAME /
   GOVERNING_LAW in `agreement.ts`.
5. Env: `CRON_SECRET`, Stripe Connect enabled, `partners@meetcursive.com` inbox.

## Known follow-ups (non-blocking)
- Partial-refund proration (currently full clawback).
- Portal reads use admin client w/ explicit filters; move to RLS-scoped client
  for defense-in-depth.
- Add integration tests for commission/churn RPC paths (need DB mock).
