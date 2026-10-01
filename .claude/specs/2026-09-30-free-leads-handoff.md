# Free-leads handoff (session 2, 2026-09-30)

Branch feat/free-leads-flow, worktree ~/cursive-worktrees/free-leads, NOT pushed (push once at the end).
Status and results: `2026-09-30-free-leads-flow.md` (Status session 2), eval `scripts/free-leads-eval/RESULTS.md`,
cost `2026-09-30-free-leads-cost.md`, follow-ups `2026-09-30-free-leads-followups.md`.

## Done (committed locally)
A eval + fixes, B cost, C funnel + admin + Slack + profile email, D real-time UI (merged fl-ui), security review
fixes, code review fixes (6fe50b42). Prod DB migrations applied. Local prod E2E passed (/tmp/fl-e2e/e2e2.py).

## In flight when this was written
- Polish agent on branch `fl-polish` (from 44e0280b): impeccable audit + polish of src/app/start/** plus code-review
  UI items (refine lock, late count overwrite, retryable failed UI, hide lead-26 row when <= delivered, CSV BOM/revoke,
  email-profile label). Merge `fl-polish` when done.
- Adversarial QA agent (report only) against the local prod build on :3103.

## Remaining to ship
1. Merge fl-polish; fix QA findings.
2. Magic-link scanner protection: email link -> /start/open interstitial with a button -> /auth/confirm
   (Safe Links/Mimecast can consume single-use links on GET).
3. tsc + vitest + lint; `next build`; restart `next start -p 3103` with SLACK_SALES_WEBHOOK_URL= ; run
   `python3 /tmp/fl-e2e/e2e2.py kalungi.com` (~35 credits; ~86 left as of writing; check get_fair_use).
4. Push once -> PR (body: what changed, eval numbers, cost, security, test plan, open decisions, pre-existing flaky
   brand-extract test) -> one preview -> merge -> promote manually (leadme prod sits in "Running Checks") -> live
   smoke on leads.meetcursive.com/start (scan only; no paid claim unless Adam asks).

## Open decisions (Adam)
MillionVerifier at delivery; weekly-leads price; GetLeads product-use terms; day-14 read-only rule.
