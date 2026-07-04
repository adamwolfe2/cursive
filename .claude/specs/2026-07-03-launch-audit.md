# Cursive Launch Audit — 2026-07-03

Branch: `audit/2026-07-03`. Multi-agent audit (24 recon/audit/verify agents) + 6 parallel fix agents.
Verified: `tsc --noEmit` clean · full vitest 1631 pass / 0 fail · reseller 35/35 · lint clean.
NOT pushed. Nothing deployed.

## Dominant root cause
Main Inngest app (`/api/inngest`) sync was REJECTED in prod: 4 functions declared concurrency > Free-plan cap (5), so the whole app failed to register — every main-app function (audience provisioning, first-lead pull, purchase emails, outbound webhooks, crons, dunning) was silently DEAD in prod. This caused ~7 of the findings. Fix: capped all 4 offenders to 5.

## P0 (fixed)
1. `/api/admin/affiliates` (+[id]) gated on owner/admin role — every customer is workspace 'owner' → any user read all affiliate PII + approve/terminate + cancel commissions. → `requirePlatformAdmin()`.
2. Funnel account takeover: pay $97, type victim's email at Stripe checkout, reuse-by-email links order to victim's workspace + portal token mints a session as victim. → reuse only when target workspace is funnel-sourced; pre-existing accounts get a REAL emailed magic link (no server-consumed session).
3. Paid $197/$247 audience never delivered (dead Inngest app) while dashboard showed a fake progress bar. → root-cause Inngest fix + send-then-mark idempotency.

## P1 (fixed)
- `/api/admin/ops/*` (5 routes) + audiencelab segment stats/import (2) same weak gate → platform-admin. (9 routes total hardened.)
- `/api/funnel/by-session` returned raw portal token (=login) to unauth requests keyed on session_id → returns `{ready, email_masked}` + rate limit.
- Reseller SECURITY DEFINER RPCs callable by anon (RLS bypass) → new migration `20260703000000_reseller_rpc_lockdown.sql` (REVOKE + search_path). **MUST APPLY TO PROD MANUALLY.**
- Every new signup's first-lead provisioning was a silent no-op (dead Inngest) → root-cause fix.
- 5 fire-and-forget `inngest.send` (frozen-fetch class) → awaited.
- Edge processor ignored inn.gs HTTP status → logs non-2xx + missing key.
- Marketplace purchase email/webhooks + funnel pixel "trial ended for paying sub" + funnel view hijacking marketplace accounts → fixed.
- Reseller usage/pixels reported wrong effective cap; added suspend route; delivery taxonomy; permanent-redirect retry storm; pixel.service unbounded recursion → fixed.

## P2 (fixed)
Website-visitors false "no pixel"; confirmation-email loss (now throws → Stripe retries, verified idempotent); reseller period-rollover stale counts; robots.txt/sitemap unblocked for crawlers; legacy sign-in/up redirects; stale marketing offer ($99-$999 → $97/$197/$247) in 2 blog JSON-LD pages + "$1k/mo platform" line + affiliate calc.

## DECISIONS / MANUAL STEPS FOR ADAM
1. **Inngest: free-cap (done) vs IN-S ~$99/mo.** Capping to 5 serializes heavy jobs (enrichment, trial-drip 20→5) — queued not dropped. Upgrade unblocks full concurrency.
2. **Deploy** branch to prod (Vercel) — nothing runs until deployed.
3. **After deploy:** re-sync main app `PUT /api/inngest` → expect `modified:true` (previously rejected).
4. **Apply** `supabase/migrations/20260703000000_reseller_rpc_lockdown.sql` to prod (dashboard SQL editor — Management-API PAT 403s).
5. **Rotate** Cursive DB password (passed through prior chat).
6. **Funnel reuse behavior change:** existing marketplace customers buying an add-on are no longer auto-attached (safe default) — they log in to their real account via emailed magic link. Verified linking flow = future work.
7. **Backfill** funnel workspaces already stuck in `trial` status (one-off script).

## Deferred / flagged (not fixed)
- Arbitrary soft-404 → real 404 needs a route allowlist in middleware (auth-bypass risk) — needs decision.
- Marketing: deck/enterprise-deck "14-day free trial" copy; `$0.50/lead` custom-audience lines; verify tier names still exist.
- Reseller: no-burn-on-permanent-failure cap refund needs a new RPC + metering change.
- `/api/public/copilot/reveal` trusts client `trigger:'call_booked'` (P2, not fixed).
- Refund does not revoke funnel access; credit refunds no-op (P2, not fixed).

---

## WAVE 2 COMPLETE (2026-07-03, platform QA#2 + marketing CRO)
Branch audit/2026-07-03. Verified: root tsc + marketing tsc clean · full vitest 1631 pass / 0 fail (single-threaded; parallel run shows flaky worker-pollution failures in edge-processor/creatives/brand-extract — all pass in isolation, pre-existing infra flakiness) · lint clean · 126 files changed total.

### Platform QA#2 fixed (44 findings)
- CRM edit cluster (P0): use-leads PATCH URL 405→[id] route; [id] PATCH schema now accepts tags+assigned_user_id; status enum unified via new LEAD_STATUSES single-source (crm.types.ts); bulk action names/counts aligned; inline editors resync on prop change. (Touched extra: src/app/api/leads/[id]/route.ts enum, crm-lead.repository.ts count returns — minimal/backcompat.)
- CRM create-refresh: contacts/companies/deals show new record immediately (onSuccess + initialData useEffect sync).
- Onboarding: marketplace source preserved in auth callback; quiz answers persisted server-side (user_metadata) for cross-device; honest first-leads promise; success-screen polling fixed (/api/auth/user); logistics slug normalizer aligned.
- Empty/error states: my-leads table+stats, campaigns retry, leads/page, lead-database — error vs empty distinguished + retry.
- Data accuracy: credit history includes marketplace spend; stats exact counts (not estimated); 5000-row truncations → count aggregates; credits/dollars separated; issued≠redeemed; enrichment_log insert fixed (was silently failing NOT NULL).
- Campaign wizard datetime→ISO; segment 'is one of' multi-select.
- Reseller admin: suspend/cap UI wired to PATCH endpoint; admin pixel deactivate now syncs audiencelab_pixels.is_active; can clear destination_url; portal cap display uses effective cap.
- Funnel dashboard: 95%-stuck resolved (terminal state stamp); milestone from audience_delivered_at; visitor count reconciled with /website-visitors; pixel-only live feed; 'Your Audience' shows full list; weekly email funnel-gated (no credit upsell).
- Responsive: 5 table/drawer overflow fixes.

### Marketing CRO fixed (wave1 24 + wave2)
- JSON-LD: removed fabricated aggregateRating (4.8/127), price $1000→AggregateOffer 97/247 (structured-data.ts, platform/layout.tsx, SchemaMarkup.tsx).
- Phantom offer claims: decks + warmly comparison ($0 fake plan) + 8 blog 'Get Started Free' CTAs → accurate paid framing. Competitor free-tier facts + real audit lead-magnet correctly left.
- Comparison-page stale pricing ($499-$999/$99-$999) → $97/$197/$247.
- a11y: single <main> landmark per page (layout wrapper downgraded + 8 pages promoted + blog-post-layout wrapped); header dropdowns keyboard+touch accessible.
- Wave1: contact 15→30min, footer dead links + tap targets, sitemap +13 slugs, superpixel metadata, crisp lazyOnload, skip-link, AVIF/webp, contact/dashboard-cta GA4 events, partners iframe lazy.

### RESIDUAL FOLLOW-UPS (flagged, NOT fixed)
- partners/portal/payouts/page.tsx table overflow (other half of #40).
- AudienceProgress.tsx: gate steps 3–6 on receivedAt (currently 12-min timer) — companion to funnel milestone fix.
- live-leads-feed.tsx AL_SOURCES still includes managed sources for realtime tail (funnel feed).
- leads/targeting/route.ts:157 + waitlist-validation.ts:44 logistics slug normalizer residuals.
- DailyLeadsView 'archive' tab chrome for funnel buyers (richer than AllLeadsTable).
- lead_purchases schema uncertainty (price_paid vs purchase_price) — verify prod columns.
- Partner Integration Packet: signs over unsigned X-Cursive-Timestamp header (doc fix).
- Still-open security P2s: copilot/reveal client-trusted trigger; refund doesn't revoke funnel access / credit refund no-op.
- Marketing (needs your input): fabricated on-page testimonials + '5.0/345 reviews' + anonymous 'real company' case studies — trust/FTC decision.

---

## WAVE 3 (2026-07-04) — review + SSRF + design Phase 1
- **parallel-review** (claude+security+codex, verified) on full main...HEAD diff: NO regressions from fix waves. Findings: 1 HIGH pre-existing SSRF (fixed below), 1 MEDIUM reseller RPC search_path (already covered by 20260703000000 lockdown migration), 2 LOW.
- **SSRF fix (TIER-1):** extracted shared DNS-resolving guard (resolvesToBlockedAddress/isBlockedIpv4/6) into src/lib/utils/ssrf-guard.ts; both /api/enrich/website (now https-only + per-IP rate-limited + per-redirect-hop resolved) and reseller delivery.service consume it. Scopes tightened to z.enum(['pixels:read','pixels:write']). tsc clean, 17 SSRF tests pass.
- **UI Phase 1 — Design Tokens Foundation (DONE):** additive token system in BOTH apps (brand blue ramp around #007AFF + neutral gray ramp + semantic tokens + spacing/radius/shadow/z/motion + Inter type scale, Dancing Script=accent-only). DESIGN.md created = source of truth. Backward-compatible (net-new `brand`/`ink` namespaces; existing blue-*/gray-*/primary untouched). Hero LOCKED, not touched. tsc clean root + marketing.
- Verified end of wave 3: root tsc + marketing tsc clean.

## UI COHESION ROADMAP (white+blue, hero locked) — Phase 1 done, 2-10 pending
2 Typography system · 3 Component primitives unification · 4 DataTable system · 5 Empty/loading/error visual system · 6 Dashboard/stat-tiles + white-blue dataviz · 7 App shell & nav · 8 Forms & wizards · 9 Motion system (+ replace 12 eager homepage demos) · 10 Marketing↔app visual continuity + design-qa gate.
Phase-1 drift to clean in later phases: gradient-text anti-pattern (.text-gradient-*), marketing .prose raw hex, dead .dark block in app globals.css, destructive/danger naming unification, radius/shadow token adoption per-component.

## NEXT SESSION START HERE
Branch audit/2026-07-03 is UNCOMMITTED (large — security+platform+marketing+SSRF+tokens). Options: parallel-review already passed → safe to `/cap` (commit+push, no deploy) then deploy manually. Manual prod steps still pending: apply 20260703000000 migration, re-sync main Inngest app after deploy, rotate DB password, marketing trust-decision on testimonials/case-studies. Then UI Phases 2-10.
