# Slice — Funnel → Dashboard Integration (Phases 1-4)

**Date:** 2026-06-05
**Owner:** Adam
**Tier:** 1 (workspaces + auth + state transitions)
**Skill:** safe-feature-slice
**Status:** PENDING — Phase 1 ready to ship pending Adam's "go"

---

## Strategic context

The JustSearched VSL funnel (`/get-leads` → `/funnel/[token]`) is fully shipped, tested, and converting. The existing `leads.meetcursive.com` dashboard (built but never user-tested) shows visitor leads, identified visitors, enriched/scored leads, intent — exactly what funnel buyers paid for. Currently funnel buyers get a static portal + a Google Sheet, which is a thin delivery experience versus the full dashboard they'd get if we connected the dots.

**The shift:** funnel portal becomes the *onboarding wizard* (pixel install + ICP submit). The dashboard becomes the *long-term home* where visitors + leads stream in automatically. Google Sheet stays as a fallback / archive.

**Adam's concern:** the dashboard has ~15 nav items (Outbound Agent, AI Studio, CRM, Campaigns, Templates, etc.) — premature/confusing for a $97-$247/mo self-serve buyer. Need a clean nav before exposing it.

---

## What's already shipped (don't re-build)

| Surface | Files | State |
|---|---|---|
| VSL landing | `src/app/get-leads/{page,layout,CheckoutButtons,PricingGate,FunnelTelemetry}.tsx` | Live, converting, Mux player, 60s gate, form-target=_blank checkout w/ same-tab fallback |
| Stripe checkout | `src/lib/stripe/funnel-products.ts` + `src/app/api/funnel/{checkout,checkout-redirect}/route.ts` | Live: JSON + form variants both → 303 to Stripe |
| Webhook order creation | `src/app/api/webhooks/stripe/handlers/checkout-session.ts` + `src/lib/funnel/order.service.ts` | Live: `metadata.type=funnel_order` routing, idempotent, signature verified |
| Funnel portal | `src/app/funnel/[token]/{page,layout,FunnelPortal}.tsx` + `src/app/funnel/checkout-success/{page,WaitingPoller}.tsx` | Live: 4-step wizard, lifecycle banners, visitor feed, manage billing, test install |
| Portal APIs | `src/app/api/funnel/[token]/{route,pixel,audience,visitors,billing-portal,test-pixel}/route.ts` + `/api/funnel/by-session` | Live, all token-gated |
| Subscription lifecycle | `src/lib/funnel/subscription-handlers.ts` | Live: deleted → hard-stop (pixel off, tokens revoked, email), past_due → banner + dunning, recovery |
| Admin fulfillment | `src/app/admin/funnel-orders/{page,FunnelOrdersTable}.tsx` + `/api/admin/funnel-orders/[id]/deliver` | Live: deep-link to `/audience-builder?prompt=…`, mark delivered fires email |
| Email templates | `src/lib/email/templates/funnel-{confirmation,audience-delivered,subscription-cancelled,payment-failed,pixel-install-reminder,visitor-digest,admin-notification}.ts` | Live |
| Inngest crons | `src/inngest/functions/funnel-{pixel-install-reminder,visitor-digest}.ts` | Live: daily 16:00 UTC + Fri 14:00 UTC |
| PostHog tracking | `src/lib/funnel/tracking.ts` + `src/app/get-leads/FunnelTelemetry.tsx` + wired into all step handlers | Live: 17 events, autocapture global |
| Admin analytics | `src/app/admin/funnel-analytics/page.tsx` + `src/lib/funnel/posthog-client.ts` | Live, needs `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID` env to render data |
| Pixel V4 verify | `src/lib/funnel/website-url.ts` | Live: detects cdn.idpixel.app vs cdn.v3.identitypxl.app |
| AL webhook probe handlers | `src/app/api/webhooks/audiencelab/superpixel/route.ts` | Live: GET/HEAD/POST-probe all return 200 |
| Migrations applied | `supabase/migrations/{20260604000000_funnel_orders,20260605000000_funnel_lifecycle}.sql` | Both applied to prod |

---

## P0 bug fixed during QA (2026-06-05)

- `audiencelab_pixels.trial_status` `CHECK` constraint allows only `trial|expired|active|cancelled|demo`. Code was inserting `'paid'` → every funnel pixel row silently failed → visitor events orphan.
- Fix: `'paid'` → `'active'` in `order.service.ts::provisionFunnelPixel`.
- Backfilled: ran `INSERT…SELECT` to recover missing rows for testsite.com + amcollectivecapital.com orders.

---

## The 4 phases — what to build next

### Phase 1 — Workspace feature flags (ship first, ~2 hrs)

**Why:** dashboard nav has ~15 items; funnel buyers only need 3. Need a clean nav before integrating.

**Migration:**
```sql
alter table workspaces
  add column if not exists visible_features text[] default null;
comment on column workspaces.visible_features is
  'Allowlist of nav items to show. NULL = show all (existing behavior). Funnel buyers default to [dashboard, leads, settings].';
```

**Code:**
- New file `src/lib/workspaces/feature-flags.ts` — `isFeatureVisible(workspace, key)`, `FUNNEL_TIER_FEATURES = ['dashboard','leads','settings']`
- Update dashboard layout (likely `src/app/(dashboard)/layout.tsx` — verify) to filter nav based on `workspace.visible_features`
- Admin toggle: extend `/admin/workspaces/[id]` (or whatever route exists) with checkboxes per feature

**Default:** funnel-tier workspaces (created in Phase 2) start with `['dashboard','leads','settings']`. Existing admin/test workspaces stay `null` → show everything (backward-compat).

**Test:**
- Existing admin login → all nav items still visible
- Set test workspace `visible_features=['dashboard']` → only Dashboard renders
- Admin toggle adds/removes features live

### Phase 2 — Auto-provision workspace + magic-link on checkout (~4 hrs)

**Why:** convert pay-first anonymous funnel orders into real workspaces buyers can log into.

**Extend `handleFunnelOrderCompleted` (src/lib/funnel/order.service.ts):**
1. Create `workspaces` row:
   - `name = order.pixel_domain ?? order.customer_email`
   - `visible_features = ['dashboard', 'leads', 'settings']`
   - `dfy_tier = 'funnel'` (or similar — check existing schema)
   - `created_via = 'funnel_order'`
2. Create `users` row:
   - `email = order.customer_email`
   - `role = 'owner'`
   - `workspace_id = new workspace.id`
   - `auth_user_id = null` initially (set when they accept magic link)
3. Issue Supabase magic-link via `supabase.auth.admin.generateLink({ type: 'magiclink', email })`
4. Update `funnel_orders` row with `workspace_id` foreign key
5. Update existing confirmation email to include TWO buttons:
   - "Set up your account" → `/funnel/<token>` (existing portal for pixel install)
   - "Open my dashboard" → magic-link URL → lands signed in at `/dashboard`

**Edge cases:**
- Buyer email already has a `users` row (re-purchase): re-use existing workspace, issue magic link, don't create duplicate
- Migration of existing test funnel orders: optional backfill script that creates workspaces for them retroactively

### Phase 3 — Re-bind pixel to workspace (~30 min)

**Why:** funnel pixels currently have `workspace_id=null` → visitor events fall into the orphan path. With workspaces auto-provisioned, route events directly to the buyer's dashboard.

**Code:**
- `provisionFunnelPixel` (`src/lib/funnel/order.service.ts`): change `workspace_id: null` → `workspace_id: order.workspace_id` (set in Phase 2)
- `audiencelab/superpixel` webhook already routes events by `audiencelab_pixels.workspace_id` → they'll flow into the dashboard's `audiencelab_events`/`leads` pipeline automatically

**Backfill consideration:** for orders provisioned before Phase 2 lands, set their pixels to point to the new workspace via a one-off script.

### Phase 4 — Audience auto-push from Studio/Workflow (~1 day)

**Why:** when Adam marks an order delivered with a Sheet URL, also push the audience records as `leads` rows in the buyer's workspace so they appear in the dashboard's "Recent Leads" / "Hot Leads" sections.

**Inngest function:** new `funnel-audience-push.ts`
- Fires on `funnel/audience.deliver` event (emitted from `markOrderDelivered`)
- Pulls AL audience records (the same data behind the Sheet)
- `INSERT INTO leads (workspace_id, source='cursive_audience', intent_score, …)` for each row
- Mark order with `audience_pushed_at` so we don't double-insert

**Reuse pattern:** `src/inngest/functions/icp-audience-builder.ts` already does AL audience → `leads` table inserts. Pattern is proven.

---

## Open questions for Adam (need answers before Phase 1)

1. **Which features stay visible for funnel buyers?** Current proposal: `['dashboard', 'leads', 'settings']`. Anything else? (Maybe `analytics` once we have something funnel-relevant to show there?)
2. **Where does the workspace settings page live?** Need to verify the route name. Likely `src/app/(dashboard)/settings/page.tsx` — check during Phase 1 implementation.
3. **For Phase 2 magic link:** Supabase's `generateLink` returns a URL with a token in the query string. Email template should embed it as a bare CTA without preview-link sniffing (some email clients pre-fetch URLs and burn the token). Use `?invite_token=…` and have a tiny `/auth/magic-link` page that consumes it on click.
4. **Does Adam want existing test orders (testsite.com, amcollectivecapital.com) backfilled into workspaces?** Probably yes — easy one-off script after Phase 2 ships.

---

## Reuse map

| Need | Existing piece |
|---|---|
| Workspace schema | `workspaces` table (check `supabase/migrations` for current shape) |
| Users table | `users` table — has `auth_user_id`, `workspace_id`, `role` |
| Dashboard layout w/ nav | `src/app/(dashboard)/layout.tsx` (verify) |
| Admin workspaces view | look in `src/app/admin/...` for existing workspace mgmt |
| AL audience → leads insert | `src/inngest/functions/icp-audience-builder.ts` |
| Magic-link auth | Supabase `auth.admin.generateLink` |
| Existing user provisioning | check `src/lib/provisioning/` |

---

## Test plan per phase

**Phase 1:**
- Unit: `isFeatureVisible(workspace, key)` for empty array, null, populated
- Integration: dashboard rendering with various `visible_features` values
- Manual: existing admin workspace shows everything, test workspace with `['dashboard']` shows only Dashboard

**Phase 2:**
- Integration: webhook firing creates workspace + user + magic-link email (use Stripe CLI replay)
- Edge case: re-purchase by same email → no duplicate workspace
- Manual: complete checkout, click magic-link in email, land logged in at `/dashboard`

**Phase 3:**
- Manual: install pixel on a test domain via funnel portal, visit it, verify events route to buyer's workspace (not orphan)

**Phase 4:**
- Integration: mark order delivered → Inngest job fires → leads appear in buyer workspace within 30s
- Verify no double-insert on re-mark

---

## Auth + dependencies state (verified working 2026-06-05)

- Vercel CLI: working with `PATH=/opt/homebrew/opt/node@22/bin:$PATH` (Node 25 has dyld issues with vercel deps)
- Stripe CLI: authed for live Cursive account (sk_live_51QkC1g…)
- Supabase MCP: connected to `lrbftjspiiakfnydxbgk.supabase.co`
- Vercel MCP: connected, team `am-collective`, project `prj_2KnXEdYZqJB90a9bYJX80rWKzCFU` (`leadme`)
- gh: authed as adamwolfe2
- Figma MCP: authed as `adam wolfe`, plan `team::1403452654367731555`

---

## Tracking + analytics state

- PostHog: globally wired via `src/components/providers/posthog-provider.tsx` (autocapture on buttons + anchors, manual pageview, pageleave time-on-page)
- Sentry: globally wired browser + server
- 17 custom funnel events: `src/lib/funnel/tracking.ts`
- Admin analytics page: `/admin/funnel-analytics` (needs `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID` env to render)

---

## Reflection seed

If Phase 1 ships and the dashboard renders cleanly for the test workspace, this whole integration unlocks. Phase 2-4 are mostly mechanical from there. The hard part is Phase 1: getting the feature-flag system clean enough that we trust it.
