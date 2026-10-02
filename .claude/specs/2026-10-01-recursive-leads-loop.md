# Recursive leads loop: feedback, customer list, ICP agent, credits (2026-10-01)

Status: PLAN ONLY (safe-feature-slice, needs-plan). No code yet. Tier 1 overall (money, ledger, webhooks).
Source of truth for pricing/positioning: `2026-10-01-cursive-pivot.md`. Constraints: `2026-10-01-free-leads-decisions.md`,
`2026-09-30-free-leads-flow.md` invariants (workspace filter on every leads read/write, lock spend before paid pull,
no empty catch, server-only tables RLS-on/no-policies, never name the provider, say "checked" not "verified").

## Working brief
- Feature: a paying (or free) workspace thumbs leads up/down, uploads past customers, sees what Cursive learned, and
  every next batch (weekly or on-demand) is filtered/ranked by that. More leads cost credits (packs) or a plan.
- Actors: workspace owner/members (feedback, upload, buy, pull); Inngest weekly job; Stripe webhook.
- Core invariant: **a workspace is never charged (Stripe or provider credits) for leads it did not get, never gets
  leads it did not pay for, and never sees another workspace's leads, feedback or customer list.**
- Previous behaviours preserved: free 25 flow (/start scan, IcpCard, count, approve, claim one per email/domain);
  `audience_197` Starter with 14-day trial and 25 every Monday (`free-leads-weekly.ts`, delivery row inserted before
  the pull as a spend lock); free 25 stay in the workspace; webhook idempotency via `webhook_events`; legacy
  marketplace credits (`workspace_credits`, `complete_stripe_credit_purchase`) keep working untouched.
- Unsafe outcomes: double credit grant on webhook replay; double spend on retry/double click; negative balance;
  paid provider pull with no reserved credits; agent widening the ICP so spend rises without consent; customer-list
  PII readable cross-workspace or by anon; leads re-delivered that are already customers or already delivered.
- Out of scope: outbound execution (booked by call), OS dashboard, Visitor Pixel changes, new marketing pages.

## What exists (explorer map, 2026-10-01)
- ICP: `free_lead_claims.icp/filters` (server-only). Leads: shared `leads` table, `source='free_leads'`,
  `metadata.fit_score/fit_why/fit_rank`; member SELECT RLS. Ranking: `src/lib/free-leads/lead-fit.ts` (pull 35, keep 25).
- Weekly: `src/lib/free-leads/weekly.ts` + `free_lead_weekly_deliveries` (unique order_id+week, offset cursor, lock row).
- Billing: `src/lib/stripe/funnel-products.ts` (pixel_97, audience_197, bundle_247), `/api/start/checkout`,
  webhook `src/app/api/webhooks/stripe/route.ts` + `handlers/checkout-session.ts` (switch on `metadata.type`).
  No `invoice.paid` handling today. Growth $497 and the three packs do not exist in Stripe.
- Legacy credits: `workspace_credits` + `credit_purchases` + RPC, packages 100/$99, 500/$399, 1000/$699, 5000/$2999
  (`src/lib/constants/credit-packages.ts`), no ledger. Different unit (marketplace), different prices.
- No lead feedback, no customer-list upload (general importer exists at `src/app/api/leads/import/*`; no papaparse).
- Provider client `src/lib/getleads/client.ts`: count free, search 1 credit/row, timed-out search still billed.

## Decisions needed from Adam (safe default in brackets)
1. Credits store: new append-only `lead_credit_ledger` separate from legacy marketplace credits
   [default: separate; legacy prices and unit differ, mixing them corrupts both].
2. Create live Stripe prices: packs $49/$199/$599 (one-time) and Growth $497/mo [default: create in test mode only
   until you say go; financial action].
3. Per-lead price inversion flagged by CRO review: credits are $0.40-$0.49/lead, Starter $1.97, Growth $0.99.
   [default: keep prices; sell plans on "done for you every Monday + ICP agent", credits don't get the agent].
4. Still open from before: provider product-use terms (their FAQ forbids powering a product on Unlimited). Paid
   on-demand pulls (S5) stay BLOCKED until resolved.

## Dependency graph
S1 feedback ─┐
S2 customer list ─┼─> S3 ICP agent (learns) ─> S6 Growth plan
S4 credit ledger + pack checkout ─> S5 pull-more with credits ─┘
S1, S2, S4 are independent (disjoint files/tables) and can run in parallel worktrees.

## Progress
| Slice | Tier | Status | Depends |
|---|---|---|---|
| S1 Lead feedback | 2 | pending | - |
| S2 Customer list upload | 1 (PII) | pending | - |
| S3 ICP agent | 2 | pending | S1, S2 |
| S4 Credit ledger + pack checkout | 1 | blocked (Q1, Q2) | - |
| S5 Pull more with credits | 1 | blocked (S4, Q4) | S4 |
| S6 Growth plan $497 | 1 | blocked (Q2) | S3, S4 |

## Slices

### S1 Lead feedback (like/dislike)
- Actor/trigger: workspace member clicks thumb on a lead (LeadsView in /start/leads and the app leads list).
- Data: `lead_feedback(id, workspace_id, lead_id fk leads, user_id, vote smallint check (vote in (-1,1)), reason text
  null, created_at, updated_at, unique(lead_id, user_id))`. RLS: members SELECT own workspace; INSERT/UPDATE/DELETE
  only where `user_id = auth.uid()`-mapped user AND lead's workspace = caller's workspace (policy checks via leads).
- API: `POST /api/leads/[id]/feedback {vote: -1|0|1}` (0 deletes), zod, session auth, workspace derived server-side.
- Unsafe: voting on another workspace's lead (RLS + route check); spam (per-user rate limit).
- Tests: RLS allow/deny with two workspaces; toggle idempotent; route rejects foreign lead id (404 not 403).
- Runtime: browser click thumbs on /start/leads, reload persists.

### S2 Customer list upload
- Actor: owner/member uploads CSV (max 5 MB, 10k rows) of past customers (company domain required; name/title optional).
- Storage: private bucket `customer-lists`, path `workspace_id/list_id.csv`, policy copied from `service-deliveries`.
- Data: `customer_lists(id, workspace_id, uploaded_by, row_count, status, created_at)`;
  `customer_list_rows(list_id, workspace_id, domain, company, title)` (normalized). RLS member SELECT; writes via route
  only. Delete action removes file + rows (hard delete; PII).
- Parse server-side with the existing import processor patterns; reject non-CSV, strip formulas, dedupe domains.
- Effect (before S3): exclude these domains from future pulls (`exclude_domains`), so we never sell a customer back.
- Tests: oversize/malformed rejected; cross-workspace read denied; delete leaves nothing; exclusion reaches filters.

### S3 ICP agent (learns from likes, skips, customers)
- Pure function first, no LLM: `learnIcp(icp, feedback, customerRows) -> { proposal, reasons[] }` in
  `src/lib/free-leads/learn.ts`. Rules: liked/customer title and size frequencies raise weights in `lead-fit.ts`;
  disliked companies/domains go to excludes; customer domains excluded. Optional LLM pass later only to phrase
  `reasons` (the "What Cursive learned" chips), never to set filters.
- Invariant: the agent may only **narrow or re-rank**; it never widens filters (no new countries, no larger size
  bands) without the user approving the chip. Spend per batch unchanged.
- Data: `icp_versions(id, workspace_id, icp, filters, source enum('scan','edit','agent'), approved_at, created_by)`;
  weekly job reads latest approved version. User can revert to any prior version.
- Tests: property test "learned filters are a subset of input filters"; dislikes never re-delivered; customers never
  delivered; weekly job uses approved version only.

### S4 Credit ledger + pack checkout (Tier 1)
- Data: `lead_credit_ledger(id, workspace_id, delta int not null check (delta <> 0), reason enum('purchase','spend',
  'refund','grant','adjust'), ref text not null, created_at, unique(reason, ref))`. Balance = sum(delta) via view.
  RLS: members SELECT; no client writes. SQL functions (security definer, search_path pinned):
  `grant_lead_credits(ws, n, ref)` and `spend_lead_credits(ws, n, ref)` which locks the workspace row
  (`select ... for update` on a per-workspace counter) and fails if balance < n.
- Checkout: `POST /api/credits/lead-packs/checkout {pack: '100'|'500'|'2000'}`; price looked up server-side from
  `LEAD_PACKS` (never from body); `metadata.type='lead_credit_pack'`, workspace_id from session; idempotency key.
- Webhook: new `case 'lead_credit_pack'` in `checkout-session.ts`; grant with `ref = checkout session id`;
  `charge.refunded` claws back with `ref = charge id` (may go negative: block pulls, flag for admin).
- Tests: replayed webhook grants once; concurrent spends never overdraw (integration test like
  `tests/integration/concurrent-purchases.test.ts`); body price ignored; refund debits once; legacy credits untouched.

### S5 Pull more with credits
- Trigger: "Get 100 more" on /start/leads. Flow: `spend_lead_credits(ws, n, ref=pull_id)` BEFORE provider call;
  pull with the approved ICP version and excludes; on provider failure or short delivery, `refund` the shortfall with
  `ref=pull_id`. Pull row (`lead_pulls`, unique pull_id) is the lock, same pattern as weekly deliveries.
- Tests: double click = one pull; provider timeout refunds (and logs the billed-anyway provider cost); short pull
  refunds difference; zero balance returns 402 with buy-credits path.

### S6 Growth plan ($497, 500/mo)
- New offer in `FUNNEL_OFFERS` (`growth_497`), weekly size 125 with the agent on; Starter stays 25/week.
  Handle `invoice.paid` only if allowance moves to the ledger; otherwise reuse weekly deliveries and `stillPaidUp`.
- Tests: Growth delivers 125 with agent version; Starter unchanged; downgrade mid-cycle stops next Monday.

## Verification per slice
`pnpm typecheck && pnpm lint && pnpm test`, RLS tests against local Supabase, Stripe test-mode webhook replay
(`stripe trigger` + resend same event id), browser check on staging preview. Parallel-review before merge (S2, S4, S5).
