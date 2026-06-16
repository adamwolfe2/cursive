# Slice: Launch funnel cockpit — /admin/launch-funnel

**Status:** in progress
**Tier:** 2 (read-only analytics — no writes, no money paths)
**Date:** 2026-06-15

## Goal
One admin UI page showing the full partner/offer funnel end-to-end with per-stage
counts and stage-to-stage conversion %, so the launch can be watched in one place.
Today the data exists but is split across 5 admin pages + PostHog + raw SQL, and
3 stages are surfaced nowhere.

## The 7 stages + data sources (verify exact columns from migrations before querying)
1. **Traffic** — PostHog `LANDING_VIEWED` (via existing `src/lib/funnel/posthog-client.ts`
   getFunnelStepCounts). Fallback/secondary: `affiliate_clicks` count. If PostHog env
   keys absent, show a clear "PostHog not configured" state for this row only.
2. **Visitor Estimate Submitted** — `visitor_estimate_leads` (count, by created_at).
3. **Booked Call** — `cal_bookings` (count; confirm table+columns via the Cal webhook
   route `src/app/api/webhooks/cal/route.ts` and its migration).
4. **Bought** — `funnel_orders` (status in paid/post-paid states) + service
   `subscriptions`/`invoices` (status active/paid). Confirm the exact paid-status enum.
5. **Installed Pixel** — `funnel_orders.pixel_provisioned_at IS NOT NULL` and/or
   `audiencelab_pixels.is_active`.
6. **First Visitor Identified** — `funnel_orders.first_visitor_notified_at IS NOT NULL`.
7. **Renewed** — recurring payments: subscriptions/invoices with ≥2 successful invoices
   (or affiliate renewal commissions). Confirm the cleanest signal from schema.

## UI/UX
- Route: `src/app/admin/launch-funnel/page.tsx` (server component) + data via a new
  `src/app/api/admin/launch-funnel/route.ts` (admin-gated) OR direct server-side query
  in the page — follow whatever `src/app/admin/analytics/page.tsx` already does.
- Auth: reuse the EXACT admin gate used by other `/admin/*` pages (platform admin /
  super-admin check). Do not invent a new auth path.
- Render: vertical funnel — each stage as a row with count, % of total traffic, and
  step-to-step conversion vs the previous stage. A simple bar/width proportional to
  count is enough. Time-window filter: Last 7 days / Last 30 days / All-time
  (default 30d), applied via created_at/paid_at per stage.
- Design: LIGHT theme only, brand blue `#007AFF`, Lucide icons, NO emojis, NO dark
  mode (matches the app). Match existing admin page styling.
- Read-only. No mutations. Each stage query independent; a failing/empty stage shows
  "—" not a crash. Scope every query with explicit columns + the time filter.

## Out of scope (v1)
- Cohort retention / LTV by channel.
- Linking individual rows across stages (estimate→booking→order join).
- Slack digest (fast-follow).

## Done when
- Page renders all 7 stages with counts + conversion %, admin-gated, light theme.
- `pnpm typecheck` clean. No new console.logs. No writes anywhere.
