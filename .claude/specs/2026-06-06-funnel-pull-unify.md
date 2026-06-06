# Slice — Unified AL Pull Architecture (Build #1 + Harden #2)

**Date:** 2026-06-06
**Owner:** Adam
**Branch:** `unstaffed-porcupine`
**Resumed from:** prior session's plan (`Build unif…` builder agent) that wrote files but did not commit. Tree restored to clean; rebuilding from the design notes Adam pasted.

## Goal in one line

One consistent authenticated-pull model for both halves of the leads dashboard:
**Visitors** = poll `GET /pixels/{id}/v4` → insert leads.
**Audience** = `createAudience` → poll until records ready → `fetchAudienceRecords` → insert leads.
Both routed through the same shared inserter, with the "audience building" banner clearing itself the moment leads actually land.

## Why this is the right shape

- **No new pipelines.** The V4 endpoint, the audience endpoints, the lead-inserter util, and the `audiencelab/provision-workspace-audience` Inngest event are all already wired. The work is filling two specific gaps and unifying the inserter call path.
- **No webhooks or Workflows.** Both halves authenticate the same way (X-API-Key), so failure modes, retries, and observability are uniform.
- **Webhook stays canonical for real-time, pull is the fallback.** V4 pull never duplicates webhook-inserted leads (we dedupe by email in workspace before insert), so this is purely additive resilience — if AL's webhook misses an event, the every-4h pull catches it.

---

## Build #1 — V4 visitor pull → insert as leads

**File:** `src/inngest/functions/pixel-v4-sync.ts` (EXTEND existing, don't replace)

Current job enriches matched leads only. Extension: for V4 events with a usable email but **no matching lead** in the workspace, insert as a new lead using the shared inserter.

**Diff intent:**

1. Keep the existing enrich-matched-lead path verbatim (it's correct).
2. Add a parallel "insert new lead" path triggered when `matchedLeads.length === 0`.
3. Convert `ALPixelResolutionV4` → `ALEnrichedProfile`-shaped record (field names align — both UPPER_CASE).
4. Call `insertLeadFromALRecord` with:
   - `sourceTag: 'audiencelab_pixel_v4'`
   - `extraTags: ['visitor', 'pixel-v4']`
   - `industries: []` (we don't know workspace ICP at insert time; intent score takes over)
5. After insert, set `intent_score` + `intent_signal` from `scoreUrlIntent(event.full_url)` and `page_url = event.full_url`.
6. Maintain the `last_v4_synced_at` watermark on the pixel. Don't reprocess events older than the watermark (saves work + prevents reordering surprises).
7. **Idempotency:** insertion already dedupes by `(workspace_id, email)` in `lead-inserter.ts`. V4 may return the same email across pages → dedupe is the safety net.
8. **Per-pixel concurrency limit:** add Inngest `concurrency: { key: 'event.data.pixel_id', limit: 1 }` so two cron firings can't race on the same pixel. Cron itself doesn't carry per-pixel keys, so we do this by emitting one Inngest event per pixel from the cron orchestrator and binding the limit on the worker.
9. **Architecture split** (cleaner than one big function):
   - `pixelV4SyncCron` — cron tick that lists active pixels, emits `pixel/v4-sync.requested` per pixel
   - `pixelV4SyncWorker` — handles `pixel/v4-sync.requested` for one pixel, per-pixel concurrency=1
   This pattern matches what `funnelPixelHealthCheck` does and gives clean retry semantics.
10. **Failsafe alerts:** if a pixel has been active for >24h and V4 has returned zero usable events across two consecutive runs, send a Slack warning (reuses `sendSlackAlert`).

**Tests** (`src/inngest/functions/pixel-v4-sync.test.ts`):
- V4 event with email + no matching lead → inserts one lead with `source='audiencelab_pixel_v4'`
- V4 event with email + matching lead → enriches existing (no new insert)
- V4 event with no email → skipped (no insert, no enrichment)
- V4 event for unknown pixel → throws → caught + Slack-alerted
- Dedupe: 3 events for same email → 1 insert (or 1 insert + 2 enrichments)
- Watermark: events older than `last_v4_synced_at` skipped
- Intent score writes through `scoreUrlIntent(full_url)`
- Per-pixel concurrency: two concurrent invocations on same pixel → only one runs at a time

---

## Harden #2 — `provisionWorkspaceAudience` async polling + banner clear

**Files:**
- `src/inngest/functions/provision-workspace-audience.ts` — add polling step, switch to shared inserter
- `src/lib/funnel/order.service.ts` (or `workspace-provision.ts`) — wire `audience_delivered_at` set on first successful auto-push
- `src/app/(dashboard)/dashboard/AudienceBuildingBanner.tsx` — optional copy tweak to mention "minutes" not "24 hours" once auto-push is the default

**Diff intent — polling:**

1. After `createAudience`, insert a polling step: `wait-for-audience-ready`
2. Up to 6 attempts, exponential backoff via `step.sleep`: 20s, 40s, 60s, 90s, 120s, 180s (≈8.7 min total worst case — well under the 8m timeout; bump `finish: '12m'`).
3. Each attempt calls `fetchAudienceRecords(audienceId, 1, 1)` (page 1, 1 record) just to read `total_records`.
4. **Ready condition:** `total_records > 0 AND total_records < UNFILTERED_RECORDS_THRESHOLD`.
5. **Empty condition:** if final attempt still returns 0, accept "empty segment, log + skip" (don't fail loudly).
6. **Unfiltered condition:** if `AudienceLabUnfilteredError` thrown, abort + Slack alert (already implemented).
7. If at any point `fetchAudienceRecords` succeeds with records, jump to the existing fetch+insert loop with `page=1`.

**Diff intent — unified inserter:**

1. Replace the inline insert block (lines 281–388) with a loop calling `insertLeadFromALRecord` per record.
2. Keep the workspace-side post-filters (industry/state) at the loop level — `lead-inserter.ts` doesn't know about workspace ICP, that lives here.
3. Keep the sample-leads-for-email collection at the loop level.
4. Keep the `user_lead_assignments` insert at the loop level (after `insertLeadFromALRecord` returns `leadId`).
5. Delete the duplicate `scoreALProfile` (lines 45–75) — use the exported one from `lead-inserter.ts`.

**Diff intent — banner clear:**

1. In `pushFunnelAudienceToWorkspace` (`workspace-provision.ts`), after `inngest.send` succeeds, leave `audience_pushed_at` as the "push initiated" marker (already in place).
2. In `provisionWorkspaceAudience`, after a successful insert run where `inserted > 0`, set `funnel_orders.audience_delivered_at = now()` for the order matching `workspace_id` — but only if it's still null (forward-only, race-safe). This is the trigger that flips the banner off in the existing dashboard logic.
3. Edge case: a workspace can have multiple funnel_orders. Match the one where `workspace_id` matches AND `audience_delivered_at IS NULL`, ordered most-recent first, single row.
4. Add a brief `safeLog` so the deliver event is traceable.

**Tests** (`src/inngest/functions/provision-workspace-audience.test.ts`):
- Polling: first 2 attempts return 0, attempt 3 returns 50 records → succeeds, no leads lost
- Polling exhausted: all 6 attempts return 0 → returns `skipped: empty`, no leads, no error
- Polling abort: `AudienceLabUnfilteredError` → Slack alert + skip
- Insert path: uses `insertLeadFromALRecord` (mocked) for every record
- Banner clear: on insert > 0, `funnel_orders.audience_delivered_at` is set (forward-only)
- Banner clear: on insert = 0, `audience_delivered_at` is NOT set
- Banner clear: skipped if already set (forward-only)
- Workspace ICP filter still applied post-fetch
- `user_lead_assignments` still created per inserted lead

---

## Cross-cutting

- **No new DB migrations.** `audience_delivered_at`, `audience_pushed_at`, `last_v4_synced_at`, and `workspace_id` already exist.
- **No new env vars.** `AUDIENCELAB_ACCOUNT_API_KEY`, `INNGEST_EVENT_KEY`, `SLACK_WEBHOOK_URL` already wired.
- **No new Inngest functions in the index export beyond the worker split** for V4 (cron + worker).
- **Backward compatibility:** existing callers of `provisionWorkspaceAudience` (signup hook + Phase 4 funnel push) need no changes — the event payload and return shape stay identical.
- **Failure modes documented** at each Inngest `step.run`: anything that can fail returns a structured `{skipped, reason}` rather than throwing, except for retryable transients which throw to trigger Inngest's retry.

---

## Failure & fallback matrix

| Scenario | Behavior |
|---|---|
| AL API key missing | Skip both jobs with `{skipped: 'no_api_key'}`, Slack warning on provision |
| `createAudience` fails | Throw → Inngest retry (max 2) → Slack alert on final fail |
| `fetchAudienceRecords` returns 0 after all polls | Accept empty, skip insert, no banner clear |
| `fetchAudienceRecords` returns >100k | Throw `AudienceLabUnfilteredError` → Slack alert + skip |
| V4 event has no email | Counted as "skipped_no_email", no insert/enrichment |
| V4 event email matches existing lead | Enrich existing (no duplicate insert) |
| V4 event email is new | Insert as new lead via shared inserter |
| Two cron firings collide on one pixel | Per-pixel concurrency=1 serializes them |
| Banner clear race (two jobs both want to set `audience_delivered_at`) | `.is('audience_delivered_at', null)` predicate → only first wins |

---

## QA gates before commit

- `pnpm typecheck` clean
- `pnpm lint` clean
- New tests + existing `provision-workspace-audience` tests green
- Manual mental walkthrough: a brand-new funnel buyer pays → workspace + magic link → ICP submit → `audiencelab/provision-workspace-audience` fires → polling → leads land → banner clears → dashboard "Recent Leads" populated within minutes

---

## Reuse map (final)

| Need | Existing piece |
|---|---|
| V4 events API | `fetchPixelEventsV4()` in `api-client.ts` |
| Audience preview/create/fetch | `previewAudience`, `createAudience`, `fetchAudienceRecords` |
| Lead insert + dedupe + scoring | `insertLeadFromALRecord` in `lead-inserter.ts` |
| URL intent score | `scoreUrlIntent` in `lib/audiencelab/intent-scoring.ts` |
| Slack alerts | `sendSlackAlert` in `lib/monitoring/alerts.ts` |
| Log sanitization | `safeLog`, `safeError` |
| Banner state | `funnel_orders.audience_delivered_at` already gates `AudienceBuildingBanner` |
| Inngest polling pattern | `al-enrichment-poller.ts` (template) |
| Per-pixel work fan-out | `funnel-pixel-health-check.ts` (template) |
