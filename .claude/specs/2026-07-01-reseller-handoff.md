# Reseller / White-Label Layer — Handoff (next session)

Paste the "PROMPT" block below into a fresh Claude Code chat (in `/Users/adamwolfe/cursive-project/cursive-work`).

---

## STATE (already done, live in prod)
- Repo: `/Users/adamwolfe/cursive-project/cursive-work` · app: `leads.meetcursive.com` (Vercel project `leadme`, team am-collective) · default branch `main`.
- **Merged to `main`** (PRs #112, #113). Reseller layer files:
  - `src/lib/reseller/*` (types, api-key.service, auth, metering.service, payload, pixel.service, delivery.service, docs)
  - `src/app/api/reseller/v1/*` (pixels CRUD, usage, openapi) + `src/app/api/reseller/admin/keys` (platform-admin gated)
  - `src/app/reseller/docs/page.tsx` (public + noindex)
  - `src/inngest/functions/deliver-reseller-lead.ts` (subscribes to existing `lead/created`)
  - `supabase/migrations/20260701000000_reseller_layer.sql`
  - `scripts/reseller-smoke-test.ts` (fake-data test)
  - `src/middleware.ts` — allowlisted `/api/reseller/v1` + `/reseller/docs`
- **Design:** each end-customer = a headless reseller-owned `workspaces` row → reuses the existing ingest→normalize→leads→`lead/created` pipeline unchanged. Delivery = new Inngest fn on `lead/created`. Zero diff to webhook/edge-processor hot paths.
- **Migration APPLIED to Cursive prod DB** (`lrbftjspiiakfnydxbgk`) via psql: 5 tables (`resellers`, `reseller_api_keys`, `reseller_pixels`, `reseller_lead_deliveries`, `reseller_usage_daily`) + RPCs `reseller_consume_delivery` (atomic cap gate) and `reseller_record_delivery` (daily rollup). RLS enabled deny-all (service-role only).
- **Live DB fix NOT in a migration file (capture it!):** `workspaces.onboarding_status` default was `'not_started'`, which violates the table's own `valid_onboarding_status` check (`pending|in_progress|completed|skipped`) — every workspace insert relying on the default failed. Changed live to default `'pending'`. NEEDS a migration file to document.
- **Verified working today:** API-key auth (401 w/o key), AudienceLab provisioning (real pixel), child-workspace isolation, DB writes + idempotency (`existing:true` on repeat), and **signed outbound delivery landed on webhook.site** (manual sign+POST reproducing `deliverToPartner`). Unit tests 25/25, tsc 0.

## Demo artifacts (in prod DB)
- Reseller "Demo Reseller" id `54944e5d-525a-476f-9a42-32dcb6aceb50`
- API key (raw): `rk_live_MFRaGuiFbNnfd9JP0Ab_HHNq3qvJ0SVgRCpneRnFsCc` (sha256 hash stored)
- Demo pixel: `pixel_id=ef9b8155-a38b-4706-a049-c415614fee2b`, child workspace `a35a940d-8784-4d7e-a605-eb14b06bd234`, `external_customer_ref=demo-cust-1`, per-pixel `signing_secret=rk_live_KkahZq5rgG1Z_31clVOF0jEXss0wkyFgdjAFb4Xj9hY`
- Signing scheme: header `X-Cursive-Signature: t=<unix>,v1=HMAC_SHA256(signing_secret, "<t>.<body>")` + `X-Cursive-Event` + `X-Cursive-Timestamp`.

## THE BLOCKER (why auto-delivery isn't live)
Inngest **Production** env is **Free pool IN-XS: 5 concurrency, 500K events/mo**. The app declares function concurrency up to **200**, so Inngest **rejects the whole app's sync** (`PUT /api/inngest` → 400 "…higher concurrency limits (10) than your plan limit of 5", `modified:false`). Therefore `deliverResellerLead` never registered → `lead/created` doesn't reach it. Adam does **NOT** want to pay. Free-tier path chosen: **isolate the reseller function in its own Inngest app** (below).

## Global rules
Light theme only (no dark), NO emojis (Lucide icons), immutability, Zod validation, repository pattern, Tier-1 safe-feature-slice discipline (this touches webhooks/isolation/metering). Read `DESIGN.md`/`PRODUCT.md` for UI.

---

## PROMPT (paste this)

> Continue the Cursive reseller/white-label layer. Read `.claude/specs/2026-07-01-reseller-handoff.md` and `.claude/specs/2026-07-01-reseller-layer.md` first for full context and IDs. Work in priority order; Tier-1 discipline; free Inngest tier only (no paid plan); nothing may break under a surge of signups.
>
> **1 — Isolated reseller Inngest app (free-tier safe).** Create a second Inngest serve endpoint `src/app/api/inngest-reseller/route.ts` with its own Inngest client/app id (e.g. `cursive-reseller`) that registers ONLY `deliverResellerLead`. It must sync independently on the free tier even though the main app's sync is broken. Confirm `lead/created` routes to it (events are account-wide). Acceptance: `PUT /api/inngest-reseller` syncs (`modified:true`); firing `lead/created` (via `scripts/reseller-smoke-test.ts` against the demo pixel) delivers a real signed payload to a webhook.site URL via the FUNCTION (not manual).
>
> **1b — Concurrency hardening (critical for surge).** In `deliver-reseller-lead.ts`, replace the in-function retry `sleep` loop with Inngest step-based retries (release the concurrency slot between attempts) and add `concurrency: { limit: 3, key: reseller_id }` so reseller work can't starve the 5-slot account pool. Preserve exactly-once metering: revisit whether `reseller_consume_delivery` should run after a successful delivery step, and guard against double-consume on step re-runs. Acceptance: a slow/failing partner endpoint can't block other deliveries; each lead is metered once.
>
> **2 — Rate-limit the reseller API.** Add rate limiting to `POST /api/reseller/v1/pixels` (reuse the app's existing Upstash/rate-limit util) — per API key. Prevents a partner key from hammering AudienceLab provisioning. Acceptance: bursts past threshold → 429.
>
> **3 — Test matrix.** Using `scripts/reseller-smoke-test.ts` + psql: (a) cap — set `reseller_pixels.lead_cap_per_period=2`, fire 3 leads → 3rd logs `skipped_cap`; (b) throttle — `throttle_mode=true` → delivered payload omits phone/title/location; (c) deactivate — `POST /pixels/{id}/deactivate` → no further deliveries + inbound `is_active=false`; (d) burst — fire 20 leads → all deliver, `reseller_lead_deliveries` + `reseller_usage_daily` + `/usage` counters accurate; (e) HMAC signature verifies on a receiver.
>
> **4 — Partner-ready docs + key.** In `src/lib/reseller/docs.ts` add a signature-verification code sample (Node + one other language), rate limits, and the explicit base URL `https://leads.meetcursive.com/api/reseller/v1`. Mint the partner a real API key (via `POST /api/reseller/admin/keys` as platform admin, or SQL). Produce a short PARTNER INTEGRATION PACKET (below) to hand off.
>
> **5 — Internal tracking UI (Adam will test as a fake user).** Platform-admin-gated dashboard (match Cursive's existing admin UI + DESIGN.md; light, no emojis) reading the reseller tables: resellers list (status, caps, period/lifetime usage); per-reseller pixels (pixel_id, external_customer_ref, domain, status, destination, throttle, cap, delivered period/lifetime, last_delivered_at); delivery log (`reseller_lead_deliveries`: status/http/throttled/attempts/error/time). Actions: toggle pixel active, edit cap/throttle, revoke/mint API keys. Optional v2.1: a read-only reseller-facing view so Adam can walk it "as the partner." Acceptance: Adam can see + manage resellers/pixels/usage/deliveries live.
>
> **6 — Housekeeping.** (a) Add a migration capturing the `workspaces.onboarding_status` default change (`not_started`→`pending`). (b) Log the broader finding: the whole app's Inngest sync is broken on the free tier (many functions declare concurrency >5) → all Inngest functions may be silently idle in prod; recommend either capping all to ≤5 (free) or upgrading to IN-S ($99/100 concurrency) — Adam's call, separate from reseller. (c) Reminder: rotate the Cursive DB password (it passed through a prior chat).
>
> After 1–4 are green, run the full test matrix and confirm a real end-to-end automatic delivery, then hand over the partner packet. Do 5 next, 6 alongside.

---

---

## SESSION 2 PROGRESS (2026-07-01) — code complete for 1–5, live verify gated on deploy

**Branch:** `fix/reseller-workspace-onboarding` → **PR #114** (base `main`). Commits `d4acbbaf` (1/1b/2/3/4/6a) + `5d3c62be` (item 5). tsc clean, reseller unit tests 25/25, lint clean.

- **5 — Admin tracking UI (DONE).** `/admin/resellers` (list: status/caps/pixel counts/usage + summary cards) and `/admin/resellers/[id]` (stats, API key manager with mint-once + revoke, pixels table with inline toggle/cap/throttle/destination edits, delivery log). Platform-admin gated by existing `/admin` layout; service-role reads (RLS deny-all). Mutation routes `PATCH /api/admin/reseller/pixels/[pixelId]` + `DELETE /api/admin/reseller/keys/[keyId]`; mint reuses `POST /api/reseller/admin/keys`. Nav link under Partners. Light/Lucide/no-emoji.

Done (code, green locally):
- **1 — Isolated Inngest app.** New `src/inngest/reseller-client.ts` (app id `cursive-reseller`, lazy Proxy) + `src/app/api/inngest-reseller/route.ts` serving ONLY `deliverResellerLead`. Function rebound to the reseller client; **removed** from the main `/api/inngest` serve list so it syncs independently of the broken main app. Middleware already allowlists it (`/api/inngest` prefix covers `/api/inngest-reseller`).
- **1b — Surge hardening.** Rewrote `deliver-reseller-lead.ts`: in-function `setTimeout` retry loop → Inngest step retries (`retries: 4`), each side-effect in a memoized `step.run` (load-context / consume / deliver / record). Slot is freed between attempts. `concurrency: [{ limit: 3 }, { limit: 2, key: 'event.data.workspace_id' }]` — global cap 3 protects the 5-slot account; per-workspace key adds fairness. **NOTE:** deviated from spec's single `{limit:3, key:reseller_id}` — a keyed-only limit is *per-key* (no account cap), which would NOT protect the pool; the global `{limit:3}` is the account guard. reseller_id isn't in the event (zero-diff hot path), so fairness keys on workspace_id (1:1 with pixel). Exactly-once metering: `consumeDelivery` in a memoized step → never double-consumes on replay.
- **2 — Rate limit.** `POST /api/reseller/v1/pixels` now calls `checkRateLimit('reseller-pixels-create:<keyId>', 'write')` (Upstash, 30/min per key) → 429 + Retry-After.
- **3 — Test matrix.** New `scripts/reseller-test-matrix.ts` — auto-creates a webhook.site token, drives cap / throttle / deactivate / burst-20 / HMAC-verify against the LIVE function, asserts delivery rows + counters, restores config. (Old `reseller-smoke-test.ts` kept for single fires.)
- **4 — Docs.** `src/lib/reseller/docs.ts`: absolute base URL, `RESELLER_RATE_LIMITS`, `SIGNATURE_VERIFICATION_SAMPLES` (Node + Python), corrected delivery_note. Wired into `/reseller/docs` page + `/api/reseller/v1/openapi`.
- **6a — Migration.** `supabase/migrations/20260701010000_workspace_onboarding_status_default.sql` captures the `not_started`→`pending` default fix + backfill + constraint re-assert.

**GATED ON ADAM (can't do headless):**
- **Deploy** the branch to prod (Vercel) — nothing reseller runs in prod until deployed.
- **Inngest Cloud:** after deploy, register/sync the new app at `https://leads.meetcursive.com/api/inngest-reseller` (PUT → `modified:true`). Only then does `lead/created` reach `deliverResellerLead`.
- Run `npx tsx scripts/reseller-test-matrix.ts ef9b8155-a38b-4706-a049-c415614fee2b` against prod env → confirm real automatic delivery.
- **4** mint the real partner key (needs partner name/label).
- **6c** rotate the Cursive DB password.

### 6b — FINDING: app-wide Inngest sync is broken on the Free plan
The MAIN app (`cursive-platform`, `/api/inngest`) declares functions with per-function concurrency far above the Free plan account cap (5). Inngest rejects the **entire app's** sync (`PUT /api/inngest` → 400, `modified:false`), so **every** main-app Inngest function may be silently unregistered/idle in prod (crons, email sequences, enrichment, campaigns, payouts, etc.). This is bigger than reseller. Options (Adam's call, separate from reseller):
- **(A) Free:** cap every function's `concurrency` to ≤5 and re-sync. Cheap, but serializes heavy jobs.
- **(B) Upgrade** to Inngest IN-S (~$99/mo, 100 concurrency) — unblocks the whole platform at once.
The reseller layer is deliberately isolated into its own low-concurrency app so it works regardless of this decision. Recommend auditing which main-app functions are actually idle in prod ASAP — this may explain other "silently not running" symptoms.

---

## PARTNER INTEGRATION PACKET (fill in the key, then send to partner)
- **What it does:** create a tracking pixel for each of your users via one API call; we POST each identified visitor (lead) to your endpoint, signed.
- **Base URL:** `https://leads.meetcursive.com/api/reseller/v1`
- **Docs:** `https://leads.meetcursive.com/reseller/docs`
- **Auth:** `Authorization: Bearer <API_KEY>` (we issue this)
- **Create a pixel:** `POST /pixels` `{ "website_url", "external_customer_ref", "destination_url" }` → returns `pixel_id` + `embed_snippet` + `signing_secret`.
- **Install:** put `embed_snippet` on that customer's site before `</head>`.
- **Receive leads:** stand up an HTTPS endpoint at `destination_url`. Each identified lead arrives as `POST` `event: lead.identified` (see docs for the JSON schema).
- **Verify each request:** recompute `HMAC_SHA256(signing_secret, "<X-Cursive-Timestamp>.<raw_body>")`, compare to the `v1=` value in `X-Cursive-Signature`.
- **Caps/throttle:** we can set per-pixel or per-account delivery caps and a throttled (reduced-payload) mode — tell us your limits.
- 2026-07-02: uq_reseller_pixels_workspace APPLIED to prod (via aside/dashboard SQL editor — Management API PAT now 403s, note for future) + TESTED: duplicate insert rejected 23505, data intact. PR #118 (onboarding event fix + matrix assert) merged + deployed green. NOTE: supabase keychain PAT lost management-API query privilege — apply-prod-sql.ts broken until re-auth.
