# Cursive Funnel — Pre-Launch Codex Audit Plan

**Created:** 2026-06-10 · **Purpose:** Drive a deep, Codex-powered pre-launch audit of the
Cursive funnel-buyer product using James Vanderhaka's curated Codex skills
(<https://github.com/vanderhaka/skills>). Find P0/P1 launch blockers, broken user
workflows, silent fallbacks, and bugs — BEFORE we drive paid traffic to the offer.

> Paste the prompt in the last section into a **fresh chat** (full context window) to run
> the audit. This doc is the reference it loads.

---

## 1. What we're launching (the funnel-buyer product)

A self-serve "done-for-you leads" funnel. A buyer:
1. Lands on the VSL → email-gated pricing → **Stripe checkout**.
2. Gets a magic-link account (managed workspace, `visible_features` preset).
3. **Installs an AudienceLab pixel** on their site → identified visitors become leads.
4. **Submits an ICP** → team builds the audience manually in Studio → synced as leads.
5. Works leads in a stripped, focused dashboard (no marketplace chrome).

Two lead engines: **pixel visitors** (automated) + **manual audience** (fulfillment).

---

## 2. The Codex skill toolkit (install these)

James's skills are Codex skills, invoked in Codex as `$skill-name`, installed via
`$skill-installer`. **Install only the audit-relevant set** (not all 24).

### Install (run once, then restart Codex)
```bash
for s in launch-critical-sweep code-review fallow bug-ripple logic-ripple \
         one-major-issue thermo-nuclear-code-quality-review issue-fix-strategy \
         safe-feature-slice thin-slice-plan cap handoff; do
  python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
    --repo vanderhaka/skills --path "skills/.curated/$s"
done
```

### The toolkit (what each is for)
| Skill | Role in the audit |
|---|---|
| `$launch-critical-sweep` | ★ **Primary.** Confirmed P0/P1 blockers across auth, payments, data loss, destructive actions, deploy/env, migrations, webhooks, trust-breaking workflows. Reports blockers only, not a backlog. |
| `$code-review` | Harsh correctness/safety/maintainability review of the funnel surfaces + diffs (auto-runs `$fallow` for JS/TS). |
| `$fallow` | Read-only structural analysis: dead code, dependency drift, duplication, circular imports, complexity. |
| `$bug-ripple` | For each confirmed bug: root cause + blast radius + sibling-bug sweep. |
| `$logic-ripple` | Blast radius of business-rule logic (money, source taxonomy, `managed` gating, pixel-id resolution). |
| `$one-major-issue` | Focused single-biggest-issue pass per subsystem (sharper than a broad sweep). |
| `$thermo-nuclear-code-quality-review` | Strict maintainability: giant files, spaghetti branching, abstraction quality. |
| `$issue-fix-strategy` | Triage ALL findings → plain-English judgement, priority, proof needed, fix routing. |
| `$safe-feature-slice` | Execute the **risky** fixes (money/auth/state/webhooks) with invariant preservation. |
| `$thin-slice-plan` | Decompose the fix backlog into a dependency-ordered slice plan. |
| `$cap` | James's verify → commit exact files → push (use to ship fixes safely). |
| `$handoff` | Write `HANDOFF.md` between audit sessions. |

### Skip (not for this audit)
- `feature-orchestrator` family (`feature-graph-plan`, `-intake-grill`, `-plan-grill`,
  `-slice-worker`, `-integrator`, `-proof`, `tdd-plan-grill`, `grill-me`) — for **building**
  a new feature end-to-end, not auditing. Pull in later only if we build something net-new.
- `skill-repo-maintainer`, `skill-push-review` — maintain the skills repo itself. Irrelevant.

---

## 3. Funnel surfaces to audit (the critical paths + file map)

Repo: `/Users/adamwolfe/cursive-project/cursive-work` · Prod: `leads.meetcursive.com`
(Vercel project `leadme` / `prj_2KnXEdYZqJB90a9bYJX80rWKzCFU`).

| # | Surface | Key files | Risk class |
|---|---|---|---|
| 1 | **Checkout / payment** | `src/app/api/webhooks/stripe/*`, funnel checkout route, `funnel_orders`, `funnel_email_captures`, subscription state | Tier-1 money |
| 2 | **Provisioning** | `src/lib/funnel/workspace-provision.ts`, `order.service.ts`, `src/lib/audiencelab/api-client.ts` (`provisionCustomerPixel`) | Tier-1 access, idempotency/race |
| 3 | **Pixel sync** | `src/lib/audiencelab/edge-processor.ts` (webhook), `src/inngest/functions/pixel-v4-sync.ts` (pull), `lead-inserter.ts`, `field-map.ts`, `src/app/api/pixel/verify/route.ts`, `src/app/(dashboard)/dashboard/page.tsx` (frontload) | Core value, data integrity |
| 4 | **Audience** | `src/app/api/funnel/[token]/audience/route.ts`, `src/inngest/functions/provision-workspace-audience.ts`, `AudienceProgress.tsx` | Manual fulfillment |
| 5 | **Dashboard / leads** | `FunnelBuyerDashboard.tsx`, `live-leads-feed.tsx`, `daily-leads-view.tsx`, `leads-list-table.tsx`, `website-visitors/*`, `app-shell.tsx` (managed gating) | Trust / UX |
| 6 | **Auth / access / RLS** | `src/app/(dashboard)/layout.tsx`, magic-link, RLS policies, `?ws=` webhook routing, funnel token gating | Tier-1 isolation |
| 7 | **Email** | `funnel-first-visitor`, `funnel-visitor-digest`, `funnel-reengagement`, founder email, `funnel-admin-notification` (+ Resend domain status) | Activation / retention |
| 8 | **Deploy / env / jobs** | Vercel env, Inngest cron registration (`api/inngest/route.ts`), `INNGEST_EVENT_KEY`, migration-lint CI | Go-live correctness |

---

## 4. Known context + suspected risks (seed the audit — verify each)

Hand these to the agent so it confirms rather than rediscovers. **Each is a hypothesis to
prove or disprove with file/line evidence.**

1. **Webhook delivers mostly EMPTY events.** AL resolves visitors server-side; the
   `pixelV4SyncCron` *pull* (pixel API) is the real source of truth. Confirm the pull is
   the reliable path for every net-new pixel and nothing critical depends on webhook data.
2. **Pixel-id triplet.** AL has 3 ids: management/query (creation), event (webhook posts),
   script. `provisionCustomerPixel` stores the **management id** (`result.pixel_id`); the
   pull needs it; the webhook routes via `?ws=`. **Suspect:** `/api/pixel/verify` counts
   `audiencelab_events` by `pixel_id` (management id), but events may be stored under the
   event id → **verify could falsely report "not installed" for net-new buyers.** Confirm.
3. **`hash_key` global unique dedup.** `leads.hash_key` is globally unique; a visitor who is
   already a lead in ANOTHER workspace can't be inserted here (409). Confirm the
   edge-processor/pull *link* instead of silently dropping, and that a buyer isn't denied
   their own visitor because another tenant saw them.
4. **Verified-only quality gate.** `assessLeadQuality` requires a verified email; ~27% of
   pixel visitors are unverified-only and are skipped. Confirm that's intended + surfaced.
5. **Frontload depends on `INNGEST_EVENT_KEY`.** The dashboard-open + verify-time pulls use
   `after()` + `inngest.send`. If the prod event key is missing in Vercel, **the pulls
   silently no-op.** Confirm the key is set in production.
6. **Resend domain verification.** MEMORY notes "Resend key exists, domain unverified." If
   true, **activation/retention emails won't send in prod** (first-visitor, digest,
   re-engagement, founder, admin alert). Confirm domain status — this is a likely P0.
7. **Manual audience SLA.** ICP submit fires Slack + admin email. Confirm both reliably
   send and that a missed alert doesn't strand a paying buyer with no audience.
8. **`managed` flag drives ALL the stripped UX.** Set at provisioning
   (`visible_features`), read at login (`layout.tsx`). Confirm it's airtight for every
   net-new buyer and there's no path where a funnel buyer sees marketplace chrome.
9. **Stripe checkout redirect** has historically been flaky in prod on a sibling project —
   confirm the funnel checkout → success → provision → magic-link chain has no dead end.

---

## 5. Audit methodology (skill → surface sequence)

1. **Sweep (read-only):** `$launch-critical-sweep` scoped to the funnel surfaces (§3) →
   confirmed P0/P1 blockers with file/line evidence + verify steps.
2. **Per-subsystem focus:** `$one-major-issue` on each of: checkout, provisioning, pixel
   sync, audience, auth/RLS, email/jobs. One sharp confirmed issue each.
3. **Deep review:** `$code-review` (which runs `$fallow`) on the funnel diffs/surfaces +
   `$thermo-nuclear-code-quality-review` on the sprawl-prone files (`edge-processor.ts`,
   `pixel-v4-sync.ts`, `dashboard/page.tsx`).
4. **Ripple each finding:** `$bug-ripple` per confirmed bug; `$logic-ripple` for the
   money/source-taxonomy/managed/pixel-id logic.
5. **Triage:** `$issue-fix-strategy` over ALL findings → prioritized, proof-defined fix plan.
6. **Plan + fix:** `$thin-slice-plan` → ordered slices → `$safe-feature-slice` for the
   risky ones → `$cap` to ship. (Do NOT fix during the audit; review the plan first.)

**Operating rules:** read-only investigation; no DB writes; no fixes until the findings are
reviewed; Tier-1 fixes (money/auth/RLS/webhooks/state) go through `$safe-feature-slice`;
never commit to `main` until an explicit `/cap`.

---

## 6. Expected output

A single triage report:
- **P0 (launch blockers)** — what's broken · who it hurts · why it blocks launch · file:line
  evidence · how to verify the fix.
- **P1 (fix before scale)** — same shape.
- **P2 (post-launch)** — brief.
- **Fix plan** — ordered slices, each routed to `$safe-feature-slice` or a direct fix, with
  the proof needed.
- **Green-light call:** can this funnel take paid traffic, or not yet?

---

## 7. PASTE-READY PROMPT (copy into a fresh chat)

See the fenced block delivered alongside this doc (also reproduced in the session that
created it). It instructs the new chat to load this plan, install the skills, run the
Codex-driven audit read-only, and return the §6 report.
