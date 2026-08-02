# Autonomous Hardening Session — Cursive

**Date:** 2026-07-31
**Branch:** `audit/2026-07-03` (pre-existing feature branch — nothing pushed, merged, or deployed)
**Baseline commit:** `4dbfc3b5`
**Commits added:** 21, all local

---

## Summary

| | Before | After |
|---|---|---|
| Tests | 1680 (1631 pass, 0 fail, 49 skip) | **1928 (1879 pass, 0 fail, 49 skip)** |
| Type errors (`tsc --noEmit`) | 0 | **0** |
| Lint | 0 errors, 15 warnings | **0 errors, 0 warnings** |
| Test files | 52 | 61 |

**+248 tests. +9 test files. 0 regressions.**

The branch was already green on all three checks, so Phase 2a ("fix what's broken") was
empty and the work went into finding what was broken *without* being red.

**Read the "Needs your decision" section before merging.** Several findings were
deliberately left unfixed because the safe choice was not mine to make.

---

## The three that matter most

### 1. Credit packages were charging 1/100th of list price 🔴
`src/app/api/credits/checkout/route.ts` · commit `760d7c11`

`CreditPackage.price` is whole dollars, but it was passed straight into Stripe's
`unit_amount`, which is **cents**.

- Enterprise (5,000 credits, **$2,999**) charged **$29.99**
- Starter ($99) charged **$0.99**

Both modals that POST this route were affected. `UpgradeModal` compounded it by
*also* formatting the field as cents, so it displayed "$30" and charged $29.99 —
the price looked deliberate. `BuyCreditsCard` renders the same package correctly
as $2,999, so two surfaces disagreed by 100x. The DB row was written as
`price / 100`, matching the undercharge, so nothing ever reconciled as a
mismatch — it just looked like weak revenue.

Fixed with a single `packagePriceCents()` boundary, the unit documented on the
interface, and 4 regression tests including one asserting no package can ever
price under $1.

> **Worth checking how long this has been live and reconciling against Stripe.**

### 2. Cross-tenant workspace takeover via unprotected RPCs 🔴
`supabase/migrations/20260731000000_rpc_grant_lockdown.sql` — **WRITTEN, NOT APPLIED**

Supabase grants EXECUTE to `anon`/`authenticated` by default and serves public
functions at `/rest/v1/rpc/`. Thirteen `SECURITY DEFINER` functions take the value
they authorize on — workspace id, actor id, beneficiary id — as an **argument**
rather than deriving it from `auth.uid()`.

The API routes scope them correctly, but that scoping is advisory: anyone with the
public anon key and their own JWT can call the function directly with different
arguments.

Worst case: `create_team_invite` performs **no authorization at all**. Knowing a
workspace UUID is enough to mint yourself an `owner` invite; `accept_team_invite`
then moves your user row into that workspace as owner — all their leads, billing,
exports, team.

Also covers role mutation, the four bulk-lead RPCs added after the 2026-02-12
sweep, three money RPCs including `affiliate_add_earnings` (a bare balance
`UPDATE`), and AL quota metering.

The migration includes the `pg_proc` query to **confirm exposure before applying**.
Per the ground rules I did not run it against any database.

### 3. Partner could be paid twice 🔴
`src/inngest/functions/partner-payouts.ts` · commit `294df22c`

The failed-balance-RPC path throws with the comment *"throw so Inngest retries"* —
but that throw is inside the same `try/catch` as the Stripe transfer. Its own catch
caught it, logged "Stripe transfer failed", and returned `{success:false}`. Inngest
saw a clean return and never retried.

So: transfer succeeds → balance RPC fails → `available_balance` never debited →
next Monday the partner is still eligible for the same amount under a **new** weekly
idempotency key, which Stripe does not dedupe. Real duplicated cash.

---

## Everything fixed

### Security
- **SSRF bypass in outbound webhook validation** (`870c1ca9`) — `isValidWebhookUrl`
  kept a private copy of the IP range list. `URL.hostname` returns IPv6 bracketed
  (`[::1]`), the patterns matched the bare form, so **every IPv6 loopback/ULA/
  link-local host passed**. Confirmed live. Also no CGNAT, and `isBlockedIpv6` only
  matched the dotted IPv4-mapped form while WHATWG URL normalizes it to hex — that
  third one my own test caught. Deleted the duplicate list, delegated to the
  canonical helpers. 40 tests.
- **Three hardcoded admin passwords removed** (`4d80b1f1`) — `create-admin-now.js`
  and `create-admin-simple.js` (both `AdminPass123`, both git-tracked, both headed
  "DELETE AFTER USE") deleted; `scripts/create-admin-account.ts` now reads
  `ADMIN_PASSWORD` from env. All three call `updateUserById`, and one loads
  `.env.local` itself — running it against a prod-pointed env silently reset the
  live admin password to a value in the source tree.
  **→ Rotate that account. One of the committed values reads like a real
  password, not a placeholder — rotate it anywhere else it is reused. (The
  literal is intentionally not repeated here; see commit `12cf1f50`.)**
- **Demo-pixel rate limit made real** (`6c2ec9cb`) — unauthenticated, `CORS: *`,
  sends branded email to a body-supplied address. Its 10/hour cap was a module-level
  `Map`; every cold lambda started empty, so it never applied across replicas. Now
  Upstash-backed.
- **Four unguarded endpoints rate-limited** (`ccba05a9`) — `outbound/icp/generate`
  and `portal/[token]/regenerate-email` (both billed LLM calls, the second reachable
  by anyone holding a portal link), `crm/export` and `exports` (10k rows/POST).
- **Query-param injection** (`ccba05a9`) — `analyze-site` interpolated a domain that
  `split('/')` leaves `&`/`?` in, letting a second `url=` param be injected into
  Microlink's query string.
- **Dead 547-line `src/lib/security` module deleted** (`47afd69f`) — zero importers,
  but it shadowed two correct implementations with broken lookalikes: an in-memory
  `checkRateLimit` that no-ops across replicas, and a `verifyStripeSignature` with
  no timestamp tolerance (captured webhook replays forever).
- **CSP comment corrected** (`86b8cc9f`) — claimed `'strict-dynamic'` was present.
  It is not, and never was.

### Money / correctness
- **Partial refund clawed back the entire commission** (`a03a72b0`) —
  `charge.refunded` fires on partial refunds; a $50 goodwill refund on a $5,000
  invoice reversed the partner's full $2,000. Worse, that write took the sole
  `clawback_<invoiceId>` key, so a later full refund found a duplicate and no-opped
  — the two errors did not cancel. Now prorated against cumulative
  `amount_refunded`, netted against prior clawbacks. Extracted as the pure
  `prorateClawback()` with 11 tests covering staged sequences, replay, over-claw and
  integer cents.
- **Three silent affiliate failures** (`f9bc7ac9`) — all the same root cause:
  supabase-js **resolves** with `{data:null, error}` instead of rejecting, and each
  site destructured only `data`. A failed commission insert logged "already
  processed" and returned 200 so Stripe never retried; the same on clawbacks; and a
  referral lookup using `maybeSingle()` with no ordering meant a workspace with two
  referrals silently paid **no commission on any renewal, forever**.
- **Failed balance credit silently underpaid** (`f36fa402`) — items flipped to
  `payable` before the per-partner credit, and a failed RPC was only logged, so the
  next run's query skipped them permanently. Now reverts on failure.
- **Double-sold lead reported success** (`0466240a`) — the `.is('sold_at', null)`
  guard was inert because a zero-row UPDATE is not an error. The second buyer was
  charged, told "success", and got nothing. Now returns 409.
- **Dropped fire-and-forget sends** (`05869153`) — the frozen-fetch class already
  fixed twice in this repo. `firePixelProvisionedEvent` was double-floating (async,
  never awaited its own fetch, and no call site awaited it), dropping the entire
  pixel drip / trial-countdown sequence; the demo route dropped the prospect's
  snippet email.
- **Onboarding clients could stick in `regenerating`** (`6b4cf645`) — the recovery
  path had three independent ways to fail silently: `catch {}`, log-before-reset
  ordering, and an unchecked `.update()`.

### Tests
- **8 untested modules covered, 231 tests** (`de9e6f6f`) — ssrf-guard,
  signature-verify (real Ed25519/HMAC keypairs, fail-closed), csv-sanitizer,
  sanitize-text, feature-flags, deal-pricing, website-url, intent-scoring.
- **A "fake test" made real** (`4c7f1b4f`) — `credit-balance.test.ts` declared its
  algorithm *"verbatim from credits/history/route.ts"* and then reimplemented it.
  All 9 assertions tested the copy; the route could break without failing anything.
  Extracted the real function, pointed the test at it.
- **Two order-dependent suites fixed** (`4b858b7f`) — `brand-extract` and
  `creatives` share the module-level rate-limit store. **Both were already broken at
  the baseline commit**: `brand-extract` fails 19/23 run on its own at `4dbfc3b5`. It
  passed in full runs only by luck of worker scheduling, and my added files
  redistributed the workers and exposed it. Verified deterministic afterwards.
- **All 4 `it.todo` resolved** (`6b2cabd7`) — one fixed, two documented as pricing
  decisions (below).

### Quality
- **15 lint warnings → 0** (`ea0ae708`) — mostly dead locals, but two were real:
  a redundant `baseUrl` destructure diverging from the value actually used in a
  redirect, and `WaitingPoller` holding a never-rendered counter in `useState`,
  forcing a re-render every 2s for five minutes (now a ref).

---

## Needs your decision — deliberately NOT fixed

1. **`payout_requests` is missing two columns the payout code writes.** 🔴
   `weeklyPartnerPayouts` (live, registered in the Inngest route) reads and writes
   `idempotency_key` and `stripe_transfer_id`. Neither exists on that table in any
   migration, and the table also has a `NOT NULL workspace_id` the insert doesn't
   supply — three reasons that write can never succeed. So the weekly idempotency
   guard is **inert** and no payout record is ever created; Stripe's own 24h key is
   the only duplicate protection. The `payouts` table *does* have both columns plus
   a unique index. Repointing the code is a schema/product call, so I only surfaced
   the errors as CRITICAL logs.

2. **Apply the RPC lockdown migration** after running the included `pg_proc` check.

3. **Rotate the admin password** (see above).

4. **Reconcile Stripe for the 100x credit undercharge** — how long was it live?

5. **Double-sell refunds.** The 409 now tells the truth, but the capture is not
   reversed and the duplicate partner credit is not backed out. Auto-refunding is a
   money-moving side effect I would not add unattended.

6. **CSP nonce.** Adding `'strict-dynamic'` needs a per-request nonce (without one
   it also blocks `'self'` scripts) plus real browser verification against Stripe,
   Crisp, Sentry, PostHog and Vercel.

7. **Demo-pixel email recipient** is still an unvalidated body field rather than
   bound to a token issued by the sales-deck page.

8. **Two deal-pricing questions** — custom-tier deals never get the pixel+outbound
   bundle discount (defensible: custom tiers contribute no outbound revenue to the
   subtotal), and `discountAmount` rounds to whole dollars while sibling fields keep
   cents. Both now have tests pinning current behaviour so any change is conscious.

9. **`commission.test.ts` is a redundant duplicate** — it reimplements what
   `partner-commission.test.ts` already covers against the real module. I don't
   delete tests unasked.

---

## Known-open, found but not addressed

Lower priority than the above; each confirmed by reading the code.

- No `payment_intent.succeeded` webhook branch — marketplace lead fulfilment depends
  on the buyer's browser completing a call after payment. Close the tab in that ~1s
  and money is captured with no purchase row and no delivery.
- `webhook_events` poison pill: a lambda timeout mid-handler leaves `error_message`
  NULL forever, so every Stripe redelivery short-circuits to `200 {duplicate:true}`.
  The alert meant to catch it queries a column (`received_at`) that does not exist on
  that table, so it never fires.
- `/api/checkout` builds session metadata with no `type`, so
  `handleCheckoutSessionCompleted` returns early — charges, never fulfils. No caller
  today, but the route is live and authenticated.
- Auto-recharge Inngest idempotency is keyed on `workspace_id` with no time
  component, so a genuine `credits-low` within 24h of a purchase is dropped.
- Two live commission engines disagree: `confirm-purchase` hardcodes 70% while
  `COMMISSION_CONFIG` is 30% base / 50% max.
- Currency handled as floats in several places; `partner-payouts` transfers
  `Math.floor(x*100)` cents but debits the unfloored dollar amount.
- Eight read-only `SECURITY DEFINER` functions still take `p_workspace_id` with no
  caller check — listed at the bottom of the migration, they need an in-function
  `auth.uid()` guard rather than a revoke.
- Recommended: a CI assertion that no public function carries `anon=X` /
  `authenticated=X` outside an allowlist. The 2026-02-12 sweep worked; nothing has
  prevented drift since.

---

## Verified clean

Worth recording so these aren't re-audited: no SQL injection (every user-driven
`.or()` routes through `sanitizeSearchTerm`); all 11 `dangerouslySetInnerHTML` sites
safe (user content is DOMPurify'd); no secrets behind `NEXT_PUBLIC_`; all 32 webhook
and cron routes verify signatures and fail closed; all 74 `/api/admin/**` routes
enforce `requirePlatformAdmin()`; `fastAuth` HMAC-verifies the workspace cookie
against the JWT; the credits double-grant race is genuinely closed by a DB
constraint. The API route layer itself is in good shape — the real gaps were one
layer down in the RPCs.

---
---

# Session 2 — 2026-08-01

**Branch:** `audit/2026-07-03` (still nothing pushed, merged, or deployed)
**Baseline for this session:** `76131369` (end of session 1)
**Commits added:** 6, all local

| | Session 1 end | Now |
|---|---|---|
| Tests | 1928 (1879 pass, 49 skip) | **1948 (1899 pass, 0 fail, 49 skip)** |
| Type errors | 0 | **0** |
| Lint | 0 errors, 0 warnings | **0 errors, 0 warnings** |

Worked the Priority 1 list. Two items came back with a different answer than
the session 1 write-up had — noted below, because the corrected diagnosis
matters more than the fix.

## Fixed

### Credentials (`23987783`)
- **A fourth hardcoded admin password.** `scripts/setup-admin-user.ts` is the
  same class as the three removed in `4d80b1f1` and was missed: it loads
  `.env.local` itself and calls `auth.admin.updateUserById`, so running it
  against a prod-pointed env reset the live admin password to `AdminPass123!`.
  Now requires `ADMIN_PASSWORD`.
- **`scripts/seed-test-users.ts`** created six real auth users on that same env
  with a committed password. Now requires `SEED_TEST_PASSWORD`.
- **The session 1 report leaked the password it had just removed** — quoting
  the literal in this file re-committed it. Redacted to a commit reference.
  Rotation is still required and is still yours; the value is in history at
  `12cf1f50` regardless of anything done in the tree.

### Webhook poison pill (`cc6a9769`)
`webhook_events` rows are inserted before the handler runs, and `processed_at`
defaulted to `NOW()` at insert — so a lambda that died mid-handler was
indistinguishable from one that succeeded. Every Stripe redelivery of that
event returned `200 {duplicate:true}`. Money captured, never fulfilled, no
retry left.

`processed_at` is now stamped only on completion, which is the meaning
`checkAlertRules()` already assumed. Disposition extracted as the pure
`classifyWebhookEvent()`: finished-clean skips, finished-with-error retries,
unfinished-and-fresh returns **409** so Stripe comes back (a 200 would be the
last delivery we ever see), unfinished-and-stale is taken over after 15 min.
The alert queried `received_at`, which does not exist on that table — now
`created_at`, so it can fire for the first time. 9 tests.

### Marketplace fulfilment no longer depends on a browser (`ca0daf1d`)
Added the missing `payment_intent.succeeded` branch. Fulfilment extracted to
`fulfilLeadPurchase()` and called from both the route and the webhook, so the
two cannot drift on money; idempotency is keyed on the payment intent inside
the shared path, so running both — and Stripe redelivering on top — is safe.
The handler validates metadata strictly on `lead_id` + `buyer_user_id`, since
`checkout.session.completed` carries a different `lead_purchase` shape for
bulk orders and must never be fulfilled here.

Two smaller things found while extracting: the idempotency lookup discarded
its own error (supabase-js resolves with `{data:null,error}`, so a failed
lookup read as "no purchase yet" and would record a second one), and
`recordLeadPurchase` dereferenced `data.id` after a `maybeSingle()` that can
return null without erroring — after the buyer has been charged. 11 tests.

### `/api/checkout` deleted (`07caf5c9`)
Session metadata with no `type`, so `handleCheckoutSessionCompleted` returned
early: charge, no fulfilment. It also selected the lead with
`.eq('workspace_id', user.workspaceId)` — a lead the buyer's own workspace
already owns, which the real flow returns 403 for. Zero callers repo-wide,
but live and authenticated. Fixing it meant designing a second fulfilment path
next to the working one; deleted instead.

## Corrected findings

### `payout_requests` is missing **three** columns, not two (`69895cdc`)
`failure_reason` is absent too, so the failed-transfer branch never recorded
anything either — and it discarded its own error, which is why nobody noticed.
Migration written for all three plus the partial unique index, mirroring
`payouts`. **Not applied.** That insert now surfaces its error.

**Open question that needs the live DB, and it changes the fix:** the archived
`20260213_critical_security_fixes.sql` makes `payout_requests.workspace_id`
NOT NULL and backfills it from `partners.workspace_id` — but **no migration in
this repo ever adds `workspace_id` to `partners`**. Either it was added out of
band, or that migration never ran. If it ran, the cron's insert needs
`workspace_id` threaded through `getPartnersEligibleForPayout()` before it can
write at all. If it did not, the three missing columns are the whole story.
Deliberately not guessed at — the verification query is in the migration
header.

### Auto-recharge: worse than an idempotency bug (`5ad50d34`)
The session 1 note said a genuine `credits-low` within 24h of a purchase is
dropped. It cannot be: **nothing in the codebase ever sends
`marketplace/credits-low`.** The only live trigger is `credit-purchased`,
which fires immediately after credits are bought — when the balance is at its
highest — so the `balance >= threshold` check skips every time. A workspace
can switch auto-recharge on in settings and it will never once recharge.

Not wired up: the missing half is an emitter on the credit-consumption path,
and that automatically charges a saved card. Documented at the trigger,
including what to revisit about the idempotency key once a producer exists.

## Still needs your decision

Unchanged from session 1: the RPC lockdown migration, the Stripe reconciliation
for the 100x undercharge, double-sell refunds, the CSP nonce, the demo-pixel
recipient, the two deal-pricing questions, and `commission.test.ts`.

Added by this session:
1. **Rotate the admin password.** Still outstanding, still yours.
2. **Apply `20260801120000_payout_requests_idempotency.sql`** — after running
   the queries in its header, especially the `workspace_id` one.
3. **Reconcile weekly partner transfers against `payout_requests`.** Transfers
   that succeeded at Stripe have no row on that table, so any payout total
   read from it is wrong for every automated payout ever made.
4. **Decide whether auto-recharge should exist.** It is enabled in the settings
   API and advertised to workspaces, and it has never fired.

## Not touched this session

Priority 2 (RLS policy correctness, `chrome-extension/`, `marketing/`,
performance, E2E) and Priority 3 are untouched. The commission-engine
disagreement (70% in the lead path vs 30/50 in `COMMISSION_CONFIG`) is now
documented at the constant in `lead-fulfilment.ts` but not reconciled — they
appear to govern two different programmes, and merging them is a product call.
