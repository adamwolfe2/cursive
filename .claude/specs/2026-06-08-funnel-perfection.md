# GOAL — Funnel Offer: Smooth, High-Quality System + Delivery (sellable tomorrow)

**Date:** 2026-06-08
**Mode:** Autonomous loop, 30-min cadence, toward PERFECTION.
**Owner:** Adam (selling to clients tomorrow)

## The goal in one sentence
A client can be sold today, onboarded in minutes, and end up logged into a
**premium, cohesive dashboard that is full of verified, high-quality leads** —
with a **smooth, repeatable delivery process** behind it (manual audience build
is acceptable, but the client experience must feel automatic and flawless).

## What PERFECTION looks like (success criteria — the definition of done)

### A. Cohesive, premium buyer experience (no marketplace bleed)
- [ ] Every screen a buyer touches — landing → portal → dashboard → leads →
      website-visitors → settings — is on-brand, consistent, calm (no orange/
      alarm color), and visually aligned (consistent container width).
- [ ] Zero wrong/overpromising copy anywhere a buyer sees it: no "10 leads/day",
      "fresh leads at 8am CT", "enrichment credits", daily-marketplace language.
      Copy reflects exactly the offer: identified website visitors + a weekly
      verified audience.
- [ ] No dead/irrelevant pages or tabs for a funnel buyer (marketplace
      targeting, CRM upsells, agency settings hidden).

### B. Lead quality is GUARANTEED (never give a client a bad lead)
- [ ] Every lead delivered to a buyer is **email-verified** before they see it.
- [ ] Leads are **auto-enriched** (contact details, company, intent) via the API.
- [ ] The audience list is cleaned (verified-email filter / Studio Segment) so
      no junk reaches the dashboard.

### C. Smooth, repeatable delivery process
- [ ] A clear runbook: pay → pixel + ICP → account built → client logs into a
      full account. One clean admin action if any step is manual.
- [ ] Ideal: client never logs into an empty account ("ready-gate" — access
      opens only when the account is full + verified, then they're emailed).
- [ ] Visitor sync (pixel → dashboard) proven working.

### D. Demo-proof
- [ ] A test workspace pre-loaded with real, verified leads so tomorrow's live
      walkthrough is guaranteed regardless of AL API mood.

## Prioritized work queue
- **P0-1** Purge/neutralize wrong marketplace copy on buyer surfaces (A).
- **P0-2** Lead-quality pipeline: enrich + email-verify before a lead is
  marked deliverable/visible (B). Wire existing enrichment + email-verification
  jobs into the funnel delivery path.
- **P0-3** Delivery runbook: crisp, repeatable, semi-manual-OK (C).
- **P1-1** Ready-gate: hold dashboard access until the account is full +
  verified; email the client when live (C). Tier-1 (auth/access) — careful.
- **P1-2** Cohesion polish: dedicated funnel Leads + Website-Visitors + Settings
  framing to match the dashboard's centered premium frame (A).
- **P1-3** Verify visitor sync + audience build end-to-end live (B/C).

## Blockers needing Adam (cannot do autonomously)
- **Pre-load demo account (D):** needs the test workspace email + the site/ICP
  to build the audience around. Provide these and I run + verify it.
- **Live AL proof:** needs a real pixel on a real site with traffic.

## Loop protocol (every iteration)
1. Pick the highest-priority unblocked item.
2. Build it; QA before commit (raw `node ./node_modules/next/dist/bin/next lint`,
   `pnpm typecheck`, `pnpm build`). Keep diffs clean.
3. Commit + push (main); note Vercel deploy.
4. Update this checklist + the iteration log. Note new blockers.
5. Skip nothing silently; if something can't be verified, say so.

## Iteration log
- **Iter 0 (2026-06-08):** Goal set. Already shipped this session toward it:
  minimal funnel dashboard (metrics-first, no orange), funnel nav (Website
  Visitors + Your Audience), credits chrome suppressed, settings trimmed to 4
  tabs, weekly audience-refresh gap closed (al_audiences registration), V4 pull
  pagination + pixel_last_event_at fixes.
- **Iter 1 (2026-06-08):** **P0-1 SHIPPED** (00969eae) — purged marketplace
  copy from the buyer leads view.
- **Iter 2 (2026-06-09):** **P0-2 (audience half) SHIPPED** (7b009bf0) —
  verified-only audience delivery. Funnel audience pull skips records without
  an AL-verified email and stamps inserted leads validated + verified. Pure
  hasVerifiedEmail helper + 5 tests.
  - **P0-2 remaining:** (a) same verified gate on the pixel→visitor lead path;
    (b) gate dashboard/leads VISIBILITY to verified leads only; (c) optional
    live email-verify API enrich pass.
- **Iter 3 (2026-06-09):** Live AL API verification report (20f6c931) —
  audience API healthy, verified gate safe (48% yield), V4 still 500, fixed
  list-endpoint Data/data casing bug. See 2026-06-09-al-api-verification.md.
- **Iter 4 (2026-06-09):** **P0-2 (a) SHIPPED** (32f78adc) — verified-email
  gate on the pixel→visitor lead path (markVerified). Remaining: (b) visibility
  gate to verified-only in the funnel leads view; (c) live email-verify pass;
  P0-3 runbook; P1-1 ready-gate.
