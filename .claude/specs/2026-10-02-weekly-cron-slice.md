# Weekly leads cron slice (2026-10-02)

Tier 1 (money). Branch overnight/weekly-cron.

## Problem
Production Inngest is unsynced, so the Monday weekly-leads delivery (Starter $197, 25 leads) never runs in prod.

## Change
- Vercel cron `/api/cron/free-leads-weekly`, Mondays 14:00 UTC, plus a 16:00 UTC catch-up. CRON_SECRET Bearer auth, fails closed when unset (same pattern as the other cron routes).
- Shared service in `src/lib/free-leads/weekly.ts`: `runWeekly`, `processOrderWeek` (paid-up check then `deliverWeekly`), `reportOutcome`, `sendWeeklyNote`.
- Inngest function kept as a thin caller of the same helpers (manual `free-leads/weekly.run` event and second trigger once synced). Its cron stays; overlap is safe because of the lock.

## Invariant
A subscriber never gets a second paid pull for the same (order, ISO week), and a paid pull is never started for an order that is no longer paid up.

## Unsafe outcomes checked
- Double pull (cron + catch-up, retry, overlapping Inngest): unique (order_id, week) row in `free_lead_weekly_deliveries` is inserted before any spend; loser gets `already`. Tested (`weekly.test.ts` concurrent, `weekly-run.test.ts` two runs).
- Pull for an ended subscription: `stillPaidUp` runs before the lock, so no row and no spend. Paused-but-active in Stripe still delivered. Tested.
- Provider failure: row marked `failed`, no leads stored, sales alerted, not re-bought by the catch-up run. Tested.
- Crash after lock: row stays `started`; later runs report `stuck` and alert, never re-buy.
- Stripe lookup error: caught per order before the lock; no spend; alert; other orders continue.
- Timeout on many orders: sequential, stops starting orders 60s before maxDuration (300s), logs and alerts deferred count; the 16:00 run takes them.
- Empty candidate list: returns zeros, no spend. Tested.
- Unauthorized: 401 on missing/wrong secret, no service call. Tested. 500 body is generic.
- We do not bill: Stripe bills the subscription independently. A week with no delivery (failed/deferred) is alerted to sales for manual make-good; no automated charge exists to reverse.

## Tests
`src/lib/free-leads/__tests__/weekly.test.ts` (existing service), `weekly-run.test.ts` (new), `src/app/api/cron/free-leads-weekly/__tests__/route.test.ts` (new).

## Before merge
Apply migration `supabase/migrations/20261001000000_free_lead_weekly_deliveries.sql` to prod. Confirm CRON_SECRET and GETLEADS_API_KEY exist in the Vercel production env.

## Status
Implemented and verified locally (vitest, tsc, eslint). Not pushed or deployed.
