# Cursive — Handoff Prompt for Next Phases (paste into a fresh session)

Open a new Claude Code session in `/Users/adamwolfe/cursive-project/cursive-work` and paste the block below.

---

You are resuming Cursive launch-hardening + optimization work. Read these first, in order:
- `.claude/specs/2026-07-03-launch-audit.md` (full audit + all 3 fix waves + review)
- `.claude/specs/2026-07-04-HANDOFF-next-phases.md` (this file)
- `DESIGN.md` (design-token source of truth, Phase 1 output)
- `CLAUDE.md` (project rules)

## CURRENT STATE (as of 2026-07-04)
- App: `leads.meetcursive.com` (Next.js App Router + Supabase + Inngest + Stripe). Marketing: `meetcursive.com` in `marketing/`.
- Offer (source of truth `src/lib/stripe/funnel-products.ts`): $97 Visitor Pixel / $197 Custom Audience / $247 Bundle, monthly. NO free trial, NO free plan.
- Inngest is on the FREE plan by Adam's decision — all function concurrency capped ≤5. Do NOT propose paid upgrade; do NOT raise concurrency >5.
- Branch `audit/2026-07-03` committed+pushed (c4f1e9c0), PR #119 open vs main. Contains: security wave (auth gates, funnel takeover fix, reseller RPC lockdown, SSRF fix, frozen-fetch awaits, Inngest caps), platform QA (CRM edit cluster, onboarding routing, credit/data-accuracy, empty states, funnel dashboard, reseller admin UI), marketing CRO (fake-rating/phantom-trial removal, offer truth, a11y, GA4), and UI Phase 1 (design tokens in both apps).
- Reseller RPC lockdown migration `20260703000000` APPLIED to prod.
- Verified green: tsc (root + marketing), vitest 1631 pass, lint, parallel-review (no regressions).

## PENDING HUMAN ACTIONS (Adam — not code)
1. Merge PR #119 + deploy to Vercel.
2. After deploy: re-sync main Inngest app `PUT https://leads.meetcursive.com/api/inngest` → expect `modified:true`.
3. Rotate Cursive DB password (coordinate with Vercel env simultaneously).
4. Decide marketing testimonials/case-studies: real or placeholder (fabricated JSON-LD rating already removed; on-page ones await decision).

## HOW TO WORK (discipline — non-negotiable)
- Use Fable multi-agent workflows / parallel Agent fan-out with DISJOINT file ownership per agent (no two agents edit the same file). This is what kept prior waves conflict-free.
- Tier-1 surfaces (money/auth/RLS/webhooks/state) → safe-feature-slice discipline. NEVER weaken/delete tests. Immutability. Zod validation.
- Light theme only, no dark. NO emojis (Lucide icons). Enterprise-grade.
- DO NOT change the marketing homepage HERO (human-home-page.tsx above-the-fold) — Adam loves it. Design/layout/copy all locked.
- Keep offer at $97/$197/$247. Free Inngest plan.
- After each wave: verify with `npx tsc --noEmit` (root AND `cd marketing`), `npx vitest run --no-file-parallelism` (parallel run is flaky — worker pollution; single-threaded is the true signal), and lint. Fix regressions before reporting.
- Checkpoint state to `.claude/specs/` after each wave. Commit at wave boundaries (branch only; push when asked). Cap sessions before ~250K context.

## UI COHESION ROADMAP (white + blue; Phase 1 DONE)
Consume the tokens in DESIGN.md; migrate surfaces to them.
- **Phase 2 — Typography:** apply the Inter type ramp/weights/line-height/tracking everywhere; Dancing Script accent-only; fix low-contrast text + any duplicate-H1; kill gradient-text anti-pattern (.text-gradient-*, bg-clip-text) → solid brand color.
- **Phase 3 — Component primitives:** unify Button/Input/Select/Badge/Card/Dialog/Tabs to one canonical set with consistent focus rings + hover/disabled/loading states (audit flagged ~96 inconsistent <Button> usages). Migrate to semantic tokens.
- **Phase 4 — DataTable system:** one pattern for leads/my-leads/find-leads/lead-database/CRM/reseller/admin tables — density, alignment, sticky headers, sort, pagination, responsive overflow (systematize prior patches), consistent row/hover.
- **Phase 5 — Empty/loading/error visual system:** on-brand skeletons + CTA-driven empties across all surfaces (logic already fixed in wave 2; now make them visually consistent).
- **Phase 6 — Dashboard + stat tiles + dataviz:** unify KPI cards + charts on a white/blue palette (use the dataviz skill) so funnel/marketplace/admin dashboards read as one product.
- **Phase 7 — App shell & nav:** consistent sidebar/topbar, active states, breadcrumbs, responsive nav; reconcile funnel-minimal view with full view visually.
- **Phase 8 — Forms & wizards:** consistent labels/validation/helper text across signup, campaign wizard, inline CRM edits.
- **Phase 9 — Motion system:** duration/easing tokens (already in DESIGN.md); purposeful transitions; replace the 12 eager homepage framer-motion demos with lazy/performant motion (NOT the hero).
- **Phase 10 — Marketing↔app visual continuity + design-QA gate:** align both properties to one visual language; then lock with the `design-qa` skill (visual snapshot + axe + Lighthouse).
Phase-1 drift to clean along the way: marketing `.prose` raw hex → --gray-*; dead `.dark` block in src/app/globals.css; `destructive`(app) vs `danger`(marketing) naming unify; radius/shadow token adoption per component.

## PLATFORM OPTIMIZATION FRONTIERS (separate track from UI; pick per session)
- **Performance:** edge-runtime light API routes; replace select('*') with explicit columns; batch N+1 (lead tags/enrichment); loading.tsx + streaming on every route; virtualize long tables; bundle analyze + lazy-load charts/editors.
- **Cost:** LLM pipeline (copy-gen/enrichment/brand-extract) — model-routing by complexity + prompt caching + cheaper models for extract/classify; DB-backed cache for paid enrichment/AudienceLab lookups; trim Vercel functions + cron maxDuration.
- **Reliability/observability:** dead-Inngest-function health check + alert (the ≤5 cap will bottleneck under load — never let silent-idle recur); Sentry breadcrumbs on money paths; idempotency keys + retry/DLQ on all webhooks.
- **Data/DB:** indexes on workspace_id/status/delivered_at + FKs; add proper count/sum aggregate RPCs (the 5000-row truncations patched in wave 2 are a symptom of missing aggregates).
- **Growth instrumentation:** full funnel analytics (checkout-start → activation → retention), cohort/activation dashboards, cross-domain attribution analysis (GA4 events already wired in wave 2).
- **Testing/CI:** E2E net on money paths (checkout→provision→login, reseller delivery, marketplace purchase); RLS multi-tenant test suite; wire the Claude GitHub Action CI auto-review agent so quality doesn't drift; add regression evals for the bugs fixed this cycle.

## RESIDUAL FOLLOW-UPS flagged in prior waves (small, in the spec)
partners/portal/payouts table overflow; AudienceProgress.tsx gate steps 3–6 on receivedAt; live-leads-feed.tsx AL_SOURCES filter for funnel; leads/targeting/route.ts:157 + waitlist-validation.ts:44 logistics slug normalizer; DailyLeadsView 'archive' tab chrome for funnel buyers; lead_purchases price_paid vs purchase_price schema verify; Partner Integration Packet signs over unsigned X-Cursive-Timestamp; copilot/reveal client-trusted trigger; refund doesn't revoke funnel access / credit refund no-op.

## SUGGESTED ORDER
If UI is the priority: run Phases 2→3→4 as one arc (typography + primitives + tables cover the most surface), verify, commit, then 5→6, then 7→10.
If launch-readiness is the priority: do the E2E money-path net + dead-Inngest health check first, then performance pass.
Start by telling me which track (UI cohesion vs platform optimization) and which phase; I'll scope a Fable workflow with disjoint agents and report P0→P2 + verification.
