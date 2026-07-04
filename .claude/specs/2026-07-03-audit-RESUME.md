# RESUME CHECKPOINT — Cursive audit (branch audit/2026-07-03)

Session hit rate limit 2026-07-03 (resets 7:50am PT). Resume here.

## DONE & on branch (verified green earlier)
- Security wave (30 fixes): 9 admin routes → requirePlatformAdmin, funnel account-takeover, portal-token leak, reseller RPC lockdown migration (20260703000000, MUST APPLY TO PROD), 5 fire-and-forget inngest.send awaited, edge-processor logging, Inngest concurrency capped ≤5 (FREE PLAN — do not revert), checkAlerts registered, pixel trial-vs-active, funnel view gating, marketing stale offer.
- Marketing CRO wave (24 fixes) + JSON-LD fabricated aggregateRating removed + comparison-page pricing → $97/$197/$247.
- tsc clean, full vitest 1631 pass / 0 fail (last verified before this wave).

## PENDING (relaunch these — group files in /tmp, re-derive from /tmp/qa2-findings.json if gone)
Platform QA#2 fixes (findings JSON: /tmp/qa2-findings.json; group md files /tmp/PF*.md):
- PF1_crm_edit (P0): use-leads.ts URL 405, [id] PATCH schema drops tags/assigned_user, EditLeadDialog status enum, BulkActionsToolbar 400, bulk count, inline resync
- PF2_crm_create: contacts/companies/deals list never refreshes after create
- PF3_onboarding (T1): auth callback drops source=marketplace, cross-device quiz loss, signup 'Other', success-screen polling, logistics slug
- PF4_empty_states: my-leads-table/stats, campaigns retry, leads/page swallow, lead-database label
- PF5_data_accuracy (T1 money): credit history omits purchases, stats estimated count, 5000-row truncation x2, credits/dollars conflation x2, enrichment usage insert
- PF6_wizard_segment: campaign schedule datetime-local ISO, segment 'is one of'
- PF7a_reseller_admin (T1): wire suspend/cap UI, admin pixel deactivate is_active, clear destination_url, portal cap display
- PF7b_funnel_dash: stuck 95%, milestone at enqueue, visitor count divergence, live feed source, Your-Audience empty, weekly-email funnel content
- PF7c_responsive: 5 table/drawer overflow fixes

Marketing wave-2 leftovers (relaunch):
- G2 phantom free-trial/free-plan/"Start Free" claims sweep (enterprise-deck, deck, warmly-vs, blog/components)
- G4 a11y: nested <main> landmarks (layout + pages both render <main>; blog BlogPostLayout has none), header hover-only dropdowns → keyboard/touch

## AFTER fixes
tsc (root + marketing) + full vitest + lint → all green. Then report P0→P2. Then phases 2-10 from the roadmap (parallel-review+/cap, deploy+wiring, trust sweep, tracking, E2E, perf, RLS deep, onboarding, CI agent).
DISCIPLINE: Tier-1 safe-feature-slice, no test weakening, immutability, light/no-emoji, don't touch homepage hero, offer=$97/$197/$247, free Inngest plan.
