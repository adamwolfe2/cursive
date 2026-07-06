# Cursive — Implementation Summary + Handoff (2026-07-05)

Everything below is COMMITTED + PUSHED to branch `audit/2026-07-03` (PR #119). Nothing is merged to `main` yet — see "MERGE BLOCKER" before merging.

## PREVIEW URLS (for visual approval)
- App: https://leadme-git-audit-2026-07-03-am-collective.vercel.app
- Marketing: https://cursive-git-audit-2026-07-03-am-collective.vercel.app
(If a preview shows "canceled", re-trigger from the Vercel dashboard for that project on this branch.)

## WHAT WAS IMPLEMENTED (this cycle)

### Security (Tier-1)
- 9 cross-tenant admin routes moved from owner/admin role → `requirePlatformAdmin` (affiliates x2, ops x5, audiencelab segments x2).
- Funnel account-takeover closed: no server-consumed session for a pre-existing account on an unverified Stripe email; pre-existing accounts get a real emailed magic link.
- `/api/funnel/by-session` no longer returns the raw portal token to unauth callers (returns `{ready, email_masked}` + rate limit).
- Reseller SECURITY DEFINER RPC lockdown (migration `20260703000000`, APPLIED TO PROD): `service_role`-only + `search_path` pinned; delivery-taxonomy columns.
- SSRF on `/api/enrich/website`: shared DNS-resolving guard (extracted to `src/lib/utils/ssrf-guard.ts`, used by both enrich + reseller delivery), https-only, per-redirect-hop, per-IP rate limit.
- 5 fire-and-forget `inngest.send` awaited (frozen-fetch class); edge-processor logs dropped events + missing key.
- Inngest concurrency capped ≤5 (FREE plan — do not change); `checkAlerts` cron registered.

### Platform QA (functional)
- CRM edit cluster (P0): PATCH URL 405 fix; `[id]` schema accepts tags+assigned_user_id; `LEAD_STATUSES` single source of truth; bulk actions/counts; inline editor resync.
- CRM create-refresh (contacts/companies/deals show new record immediately).
- Onboarding: marketplace `source` preserved through auth callback; quiz answers persisted server-side (`user_metadata`) for cross-device; honest first-leads promise; success-screen polling fix; logistics slug normalizer.
- Data accuracy: credit history includes marketplace spend; exact counts (not estimated); 5000-row truncations → count aggregates; credits≠dollars; issued≠redeemed; enrichment_log insert fixed.
- Error-vs-empty states with retry (my-leads table/stats, campaigns, leads page, lead-database).
- Funnel dashboard: 95%-stuck resolved; milestone from `audience_delivered_at`; visitor count reconciled; pixel-only feed; "Your Audience" full list; funnel-gated weekly email.
- Reseller admin: suspend/cap UI; pixel deactivate syncs `is_active`; clear destination_url; portal cap display.
- Campaign wizard datetime→ISO; segment "is one of" multi-select; responsive table/drawer overflow (6).

### Marketing CRO
- Removed fabricated `aggregateRating` (JSON-LD) + phantom free-trial/free-plan copy; offer truth $97/$197/$247 across blog/decks/comparison pages.
- a11y: single `<main>` per page + keyboard/touch dropdowns; GA4 CTA/form events; sitemap +13 slugs; robots/sitemap unblocked; perf (lazy embeds, AVIF/webp).
- HERO UNTOUCHED (per Adam).

### UI design system (white + blue; hero locked)
- Phase 1 — Design tokens: brand blue ramp + neutral ramp + semantic tokens + spacing/radius/shadow/motion + Inter type scale, in BOTH apps. `DESIGN.md` = source of truth.
- Phase 2 — Typography: killed gradient-text anti-pattern → brand tokens; `.prose` hex → tokens; Dancing Script removed from app (marketing-accent-only); low-contrast → AA; duplicate-H1 fixed across 99 marketing pages (visible hero h1 kept).
- Phase 3 — Component primitives: unified Button/Input/Select/Badge/Card/Dialog/Tabs (backward-compatible); fixed Input `success` focus-ring typo bug; tabs/status-badge/loading-button/select-radix/dialog token+focus-visible normalization; usage migration across 6 clusters.

### Commits on branch
c4f1e9c0 (audit) · dd0abcac (Phase 2 typography) · 308e004c (Phase 3 primitives). All pushed. tsc clean (root + marketing) after each.

## MERGE BLOCKER (do this before merging to main)
PR #119 is CONFLICTING. `main` advanced 8 commits after we branched (PRs incl. #118 + reseller audit hardening) that OVERLAP our work — SSRF, reseller metering/retry, Inngest awaits, onboarding frozen-fires were also fixed independently on main. Conflicting files (all Tier-1):
- src/app/api/onboarding/setup/route.ts
- src/app/reseller/portal/page.tsx
- src/inngest/functions/deliver-reseller-lead.ts
- src/lib/audiencelab/edge-processor.ts
- src/lib/reseller/delivery.service.ts
- src/lib/reseller/pixel.service.ts

RESOLUTION PLAN (own focused session, NOT autonomous):
1. `git checkout audit/2026-07-03 && git fetch origin && git rebase origin/main` (or merge origin/main in).
2. For each of the 6 files: keep the SUPERSET of both sides' hardening — do NOT clobber main's versions. Diff carefully; where main already fixed the same thing (e.g. SSRF, Inngest await), take main's and drop our duplicate; where our fix is additive (e.g. reseller admin UI, taxonomy), layer it on.
3. Re-verify: tsc (root + marketing), `npx vitest run --no-file-parallelism`, lint.
4. Re-run parallel-review on the rebased diff.
5. THEN merge PR #119 → triggers prod deploy.

## PENDING HUMAN (after merge/deploy)
- Re-sync main Inngest app `PUT /api/inngest` → `modified:true` (concurrency now ≤5).
- Rotate Cursive DB password (coordinate with Vercel env).
- Marketing testimonials/case-studies: real or placeholder decision (fabricated JSON-LD rating already removed; on-page ones await).

## NEXT UI PHASES (after merge)
4 DataTable system · 5 Empty/loading/error visual system · 6 Dashboard + white-blue dataviz · 7 App shell/nav · 8 Forms/wizards · 9 Motion (replace 12 eager homepage demos, not hero) · 10 Marketing↔app continuity + design-qa gate.
Consolidation follow-ups flagged in Phase 3: duplicate Select (native vs radix) / Modal vs Dialog / Card variants; `cn` import split (@/lib/utils vs @/lib/design-system) → canonicalize.

## HANDOFF PROMPT (paste into fresh session)
Resume Cursive. Read .claude/specs/2026-07-05-IMPLEMENTATION-AND-HANDOFF.md, 2026-07-03-launch-audit.md, DESIGN.md, CLAUDE.md. Branch audit/2026-07-03 (PR #119) has the full audit + UI phases 1-3, all pushed, tsc green, NOT merged. FIRST TASK: resolve the PR #119 merge conflict per the RESOLUTION PLAN (6 Tier-1 files, main got overlapping fixes — keep the superset, don't clobber), re-verify + re-review, then it's ready for Adam to merge. Discipline: Fable multi-agent disjoint file ownership; Tier-1 safe-feature-slice; no test weakening; light/no-emoji; DON'T touch marketing hero; offer $97/$197/$247; free Inngest ≤5. After merge, continue UI Phase 4 (DataTable). Verify each wave with tsc (both apps) + vitest --no-file-parallelism + lint.
