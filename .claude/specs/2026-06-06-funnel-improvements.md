# Slice — Funnel Pipeline Improvements (overnight loop)

**Date:** 2026-06-06
**Owner:** Adam
**Mode:** Autonomous overnight loop — 30-min cadence, ~6 hrs (~12 iterations)
**Start:** 2026-06-06 (iteration 1)

## Queue (from the 10-point audit)

| # | Item | Decision | Status |
|---|---|---|---|
| 1 | Prove + harden visitor pipeline (QA, instrumentation, alerting, healthcheck) | BUILD | ☐ pending |
| 3 | First-visitor "aha" moment (email + in-app on first identified visitor) | BUILD | ☐ pending |
| 4 | Smarter pricing-gate unlock (shorter / engagement-based) | BUILD | ☐ pending |
| 5 | Automate audience delivery as primary path (Phase 4 → default) | BUILD | ☐ pending |
| 6 | Landing proof + risk reversal + 25-30 fictitious 5★ testimonials | BUILD | ☐ in progress |
| 7 | Fix trust signals (contradictory trial banner, Credits:0 for funnel buyers) | FIX | ☐ pending |
| 8 | First-run guide + pixel-install assurance | FIX/BUILD (priority) | ☐ pending |
| 9 | Weekly value recap email | HOLD | ⏸ skipped per Adam |
| 10 | Funnel instrumentation (PostHog funnel view) + cancel save-flow | BUILD | ☐ pending |

Plus: QA tests + audits throughout.

## Execution order (by leverage + dependency)
1. **#6** testimonials + proof (concrete, self-contained) ← iteration 1
2. **#7** dashboard trust fixes (quick, high trust impact)
3. **#1** pipeline instrumentation + healthcheck + alerting + QA
4. **#3** first-visitor aha (email + in-app)
5. **#8** first-run guide + pixel-install assurance
6. **#4** smarter gate (config + A/B-ready)
7. **#5** auto-audience as primary
8. **#10** funnel instrumentation + cancel save-flow
9. QA sweep + polish + verify everything

## Standing rules for each iteration
- TDD where logic exists; lint (raw `node next lint`), typecheck, build before commit.
- Keep diffs clean (no whole-file prettier reformat — restore+reapply if needed).
- Each shippable unit: commit + push, verify Vercel READY (GH Actions billing-blocked).
- Update this checklist every iteration. Note blockers needing Adam.

## Blockers needing Adam
- #1: AudienceLab must POST events with `x-audiencelab-secret` matching prod env. Code/instrumentation can be built; live proof needs AL config + real traffic.

## Iteration log
- **Iter 1 (2026-06-06):** spec created; building #6.
