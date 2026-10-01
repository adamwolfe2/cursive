# Free-leads handoff (session 2, 2026-09-30)

Branch feat/free-leads-flow, worktree ~/cursive-worktrees/free-leads, NOT pushed (push once at the end).
Status and results: `2026-09-30-free-leads-flow.md` (Status session 2), eval `scripts/free-leads-eval/RESULTS.md`,
cost `2026-09-30-free-leads-cost.md`, follow-ups `2026-09-30-free-leads-followups.md`.

## Done (committed locally)
A eval + fixes, B cost, C funnel + admin + Slack + profile email, D real-time UI (merged fl-ui), security review
fixes, code review fixes (6fe50b42). Prod DB migrations applied. Local prod E2E passed (/tmp/fl-e2e/e2e2.py).

## Update (later in session 2)
- Merged fl-polish (8975cdc7: AA contrast, 44px targets, CLS 0, code-review UI races, retryable, CSV BOM).
- Done: code-review backend fixes (6fe50b42), mobile profile email (6ab60dfa), scanner-safe /start/open click-through (610ab963).
- Waiting on: adversarial QA report (prod build :3103). Then: rebuild, E2E (e2e2.py now also checks /start/open), push.
- Root layout `maximumScale: 1` blocks zoom app-wide (outside this branch; /start overrides it). DESIGN.md: brand-600 for filled buttons.

## In flight when this was first written
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

## Adversarial QA findings to fix before push (full report: /tmp/fl-qa/, screenshots /tmp/fl-qa/shots/)
1. BLOCKER: client disconnect during POST /api/start/count|scan|refine crashes the Node process (ECONNRESET
   "Emitted 'error' event on IncomingMessage", Node 26 locally). Suspect src/instrumentation.ts uncaughtException
   re-throw. Repro: `curl -m 1.5 -X POST -H 'content-type: application/json' -d '{"icp":{...}}' localhost:3103/api/start/count`.
   Fix root cause; pin Node (engines / .nvmrc) to Vercel's runtime; verify the process survives aborts.
2. MAJOR: email-icp spends the per-mailbox/IP limits before validating session/domain: validate first, limit after.
   Rate-limited copy says "this network" even for the mailbox limit.
3. MAJOR: refine "remove everything" -> model returns empty summary -> 500. Keep the previous summary when empty.
4. MAJOR: refine "only Atlantis" -> upstream rejects unknown country -> 500. Validate countries (upstream list or
   catch `rejected` -> zero-match response) so it shows the zero state instead.
5. MAJOR: free-text industry chips not in the enum are silently dropped (and case-sensitive). Case-insensitive match
   to the enum, and only accept enum values in the UI (suggestions) or tell the user.
6. MINOR: all chips removed -> 64M people, Approve enabled; disable Approve while the count is stale/loading and when
   the profile has no title/industry/size filter.
7. MINOR: focus lost to BODY after scan start/complete, chip remove, Escape/Enter in add input.
8. MINOR: attribution marked sent before the first scan succeeds; two tabs race session id.
9. MINOR: client URL validator rejects acme.com?x=1, #top, :8080, IDN TLDs; server accepts arbitrary ports (drop port).
10. POLISH: "9 people match. Your free 25 come from this list." when count < 25; 1-char refine allowed client-side
    (server min 2); >4000-char description shows wrong copy; "$25 /mo" stray space; size chips use en dashes;
    email-profile hidden for description scans (ok); ?site= auto-scan spends model money when scanners open the
    profile email link (gate auto-start behind a click, or rely on the 7-day cache).

## Session 3 (QA fixes, ship)
- Fixed QA 1-10 (blocker: instrumentation re-threw uncaughtException; Node pinned 24.x), plus delivery bug found by E2E:
  leads.hash_key is unique across all workspaces, so one overlapping person failed the whole insert after paying.
- Deferred: two-tab session race (per-tab ids are intentional: email-icp ties the profile to the scanning session);
  ?site= auto-scan gate (profile emails only go out for scanned domains, so scanner opens replay the 7-day scan cache).
- Global count cap is now hourly (250) not daily. GetLeads credits after E2E: 16. Buy credits before traffic.
