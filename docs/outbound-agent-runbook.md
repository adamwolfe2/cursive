# Outbound Agent — Production Runbook

A Rox-inspired AI revenue agent built on top of Cursive's existing
AudienceLab + Claude + EmailBison + Inngest infrastructure. Lives at
`/outbound` in the dashboard.

## Architecture in one paragraph

A user creates an **outbound workflow** (a row in `agents` with
`outbound_enabled=true`) by filling in three textareas: ICP, persona,
product. The workflow lazy-creates a synthetic `email_campaigns` row
(`is_outbound_agent=true`) the first time it runs. Clicking **Run Now**
fires an `outbound/workflow.run` Inngest event. The orchestrator
(`outboundWorkflowRun`) calls AudienceLab via `prospectAndIngest()` (preview
+ create + fetch + dedupe + insert), runs each new lead through DNC +
suppression filters, then inserts `campaign_leads` rows and emits one
`campaign/lead-added` event per lead. The existing `enrichCampaignLead`
function takes over from there: it enriches the lead with Claude, then emits
`campaign/compose-email`. The patched `composeCampaignEmail` (single
conditional branch in `src/inngest/functions/campaign-compose.ts`) detects
the `is_outbound_agent` flag, calls `generateSalesEmail()` directly using the
agent's `icp_text` / `persona_text` / `product_text` / `tone`, and inserts
the result as `email_sends.status='pending_approval'`. Drafts now appear in
the workflow detail page (right column) where the user can Approve, Edit,
Regenerate, or Discard each one. Approve sets `status='approved'` and emits
`campaign/email-approved` — the existing `onEmailApproved` →
`sendApprovedEmail` pipeline ships the email via EmailBison. Replies land
through the existing EmailBison campaigns webhook
(`/api/webhooks/emailbison/campaigns`) which writes
`email_replies` with the right `campaign_id`, and the
`outbound_pipeline_counts` view picks them up automatically — no new code in
the reply path.

## Files added

### Migration
- `supabase/migrations/20260408000000_outbound_agent_v1.sql`
  - extends `agents` (8 cols), adds `email_campaigns.is_outbound_agent`,
    creates `outbound_runs`, `outbound_chat_messages`, `outbound_saved_prompts`
    + the `outbound_pipeline_counts` view + RLS policies

### Services
- `src/lib/services/outbound/al-prospecting.service.ts` — `prospectAndIngest()` with dev mock
- `src/lib/services/outbound/icp-generator.service.ts` — Claude-powered ICP extractor
- `src/lib/services/outbound/chat.service.ts` — streaming Anthropic SSE for the chat panel

### Repositories
- `src/lib/repositories/outbound-run.repository.ts`
- `src/lib/repositories/outbound-chat.repository.ts`
- `src/lib/repositories/outbound-saved-prompt.repository.ts`
- `src/lib/repositories/agent.repository.ts` (extended with `findOutboundEnabled`,
  `findOutboundById`, `updateOutboundConfig`, `ensureOutboundCampaign`)

### Inngest functions
- `src/inngest/functions/outbound-workflow-run.ts` — main orchestrator
- `src/inngest/functions/outbound-stats-refresher.ts` — cron + on-demand stats refresh
- `src/inngest/functions/campaign-compose.ts` — **patched** to call `generateSalesEmail()`
  when the campaign is `is_outbound_agent` and has no templates
- `src/inngest/client.ts` — added 3 events: `outbound/workflow.run`,
  `outbound/workflow.completed`, `outbound/stats.refresh`
- `src/inngest/functions/index.ts` — registers the new functions

### API routes
- `src/app/api/outbound/workflows/route.ts` — GET (list) + POST (create)
- `src/app/api/outbound/workflows/[id]/route.ts` — GET / PATCH / DELETE
- `src/app/api/outbound/workflows/[id]/run/route.ts` — POST trigger run
- `src/app/api/outbound/workflows/[id]/stats/route.ts` — GET stage counts (polled every 5s)
- `src/app/api/outbound/workflows/[id]/prospects/route.ts` — GET prospects table
- `src/app/api/outbound/workflows/[id]/drafts/route.ts` — GET drafts in pending_approval
- `src/app/api/outbound/drafts/[id]/route.ts` — PATCH inline edit
- `src/app/api/outbound/drafts/[id]/approve/route.ts` — POST approve → fires `campaign/email-approved`
- `src/app/api/outbound/drafts/[id]/regenerate/route.ts` — POST regenerate via Claude
- `src/app/api/outbound/drafts/[id]/reject/route.ts` — POST discard
- `src/app/api/outbound/icp/generate/route.ts` — POST AI-generate ICP from product description
- `src/app/api/outbound/chat/route.ts` — POST streaming SSE chat
- `src/app/api/outbound/chat/history/route.ts` — GET thread history
- `src/app/api/outbound/chat/threads/route.ts` — GET user threads
- `src/app/api/outbound/saved-prompts/route.ts` — GET (globals + workspace) + POST
- `src/app/api/outbound/saved-prompts/[id]/route.ts` — PATCH + DELETE

### Pages + components
- `src/app/(dashboard)/outbound/page.tsx` — workflows list (server)
- `src/app/(dashboard)/outbound/loading.tsx`, `error.tsx`
- `src/app/(dashboard)/outbound/new/page.tsx` — server wrapper
- `src/app/(dashboard)/outbound/[id]/page.tsx` — Rox-style detail page (server)
- `src/app/(dashboard)/outbound/[id]/loading.tsx`, `error.tsx`, `not-found.tsx`
- `src/app/(dashboard)/outbound/[id]/edit/page.tsx`
- `src/components/outbound/setup-form.tsx` — ICP/Persona/Product form + Generate ICP button
- `src/components/outbound/workflow-card.tsx` — card on the list page
- `src/components/outbound/stage-pipeline.tsx` — TanStack Query polling 5s
- `src/components/outbound/stage-card.tsx` — one of 6 stage cards
- `src/components/outbound/run-now-button.tsx` — POSTs /run + invalidates queries
- `src/components/outbound/run-status-badge.tsx`
- `src/components/outbound/prospects-list.tsx` — TanStack Query polling 10s
- `src/components/outbound/email-draft-modal.tsx` — Sheet drawer with Approve/Edit/Regenerate/Discard
- `src/components/outbound/chat-toggle.tsx` — opens chat drawer
- `src/components/outbound/chat-panel.tsx` — SSE streaming chat UI
- `src/components/outbound/saved-prompts-bar.tsx` — 4 quick-action chips
- `src/components/layout/app-shell.tsx` — added "Outbound Agent" sidebar entry
- `src/types/outbound.ts` — TypeScript types

### Tests
- `src/lib/services/outbound/__tests__/al-prospecting.service.test.ts` — 14 tests
- `src/lib/services/outbound/__tests__/icp-generator.service.test.ts` — 11 tests
- `src/lib/services/outbound/__tests__/reply-integration.test.ts` — 15 tests
- `tests/e2e/outbound-agent.spec.ts` — Playwright auth-gate smoke

**Total: 40 unit tests passing, all typecheck clean.**

## Local development

```bash
# Required env vars
ANTHROPIC_API_KEY=sk-ant-...      # real Claude (cheapest model used)
AUDIENCELAB_ACCOUNT_API_KEY=...   # ONLY needed when not using mock mode
EMAILBISON_API_KEY=               # leave unset to mock send (no real emails)

# Optional: skip the AL API entirely + skip credit deduction
OUTBOUND_DEV_MOCK_AL=1

# Start the Inngest dev server in one terminal
npx inngest-cli dev

# Start the Next.js dev server in another
pnpm dev
```

Then visit `http://localhost:3000/outbound`.

## Smoke test (with mocks)

1. Sign in. Visit `/outbound/new`.
2. Fill in:
   - **Workflow name:** "Test Workflow"
   - **Product:** "We sell autonomous SDR software to B2B SaaS founders."
3. Click **Generate ICP**. Verify chips populate within ~3s.
4. Click **Create Workflow**. You land on `/outbound/[id]`.
5. Click **Run Now**. Toast appears. Within 30s:
   - Prospecting count → 5 (mock leads)
   - Enriching → 5 → 0 (as enrichment runs)
   - Drafting → 5 (drafts ready for review)
6. Click any prospect row → modal opens with subject + body.
7. Click **Approve & send**. Drafting count drops by 1. Engaging count goes up by 1.
8. Click **Chat** in the header. Click the **Email Draft** saved prompt.
   Verify the assistant streams a response.

## Production rollout

1. **Apply migration** via Supabase dashboard or `supabase db push`:
   ```
   supabase/migrations/20260408000000_outbound_agent_v1.sql
   ```
2. **Verify the migration** by checking that:
   - `agents.outbound_enabled` column exists
   - `outbound_pipeline_counts` view exists and queries return rows
   - 4 default rows exist in `outbound_saved_prompts` (workspace_id IS NULL)
3. **Canary** with one workspace: create a workflow with `cap_per_run: 5`,
   click Run, verify drafts appear, approve one, verify EmailBison sends,
   wait for a real reply, verify the Replying count moves.
4. **Roll out** to all pro+ workspaces (the sidebar nav already gates on
   `requiredPlan: ['pro','admin','owner']`).

## Cost guardrails

| Check | Where | Default |
|---|---|---|
| Per-run lead cap | `agents.outbound_filters.cap_per_run` | 25 |
| Hard cap | `HARD_CAP_PER_RUN` in al-prospecting.service.ts | 100 |
| Pre-run credit check | `/api/outbound/workflows/[id]/run/route.ts` | 0.5 cred/lead |
| Concurrent runs per agent | Inngest `concurrency.key='agent_id'` | 1 |
| Claude rate limit safety | Inngest `throttle` on outboundWorkflowRun | 80/h per workspace |
| Preview blast-radius | `UNFILTERED_PREVIEW_THRESHOLD` in api-client.ts | 50,000 |

## Known limitations / v2 candidates

- **No CSV upload** — AudienceLab has no "people-at-domain" endpoint, so we
  drive prospecting via ICP filters only. Adding a CSV path requires either
  per-row enrichment via `enrich({ filter: { company: ... } })` (low hit rate)
  or integrating a different B2B vendor.
- **No auto-approve** — `agents.outbound_auto_approve` column exists but
  isn't yet wired into the approve route. Toggle is one branch.
- **Polling, not realtime** — TanStack Query polls every 5–10s. Switching
  to Supabase Realtime channels is a ~30 line change in `stage-pipeline.tsx`
  and `prospects-list.tsx`.
- **Meeting detection is regex-based** — `detectSchedulingIntent` in
  `conversation-manager.ts`. Layering a Claude call when `intent_score >= 7`
  would improve accuracy.
- **Org chart / Account detail / Opportunities tabs** from Rox — out of v1
  scope. Would be a new page at `/outbound/[id]/accounts/[accountId]`.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `EmptyPreviewError` from `prospectAndIngest` | ICP filters too narrow for AL's data | Broaden seniority or industries; verify with `/api/audiencelab/database/search` |
| `OverlyBroadFilterError` | preview > 50K matches — filters were ignored | Add at least one state, industry, AND seniority |
| Drafts never appear after Run | `enrichCampaignLead` missing emit at tail | Verify `campaign-enrichment.ts` line 137 emits `campaign/compose-email` |
| Drafts get template error | Compose patch missing | Verify `campaign-compose.ts` checks `isOutboundAgentCampaign` before failing on no templates |
| Replies never count | Webhook didn't write `campaign_id` on `email_replies` | Check `webhooks/emailbison/campaigns/route.ts` reply insert |
| Stats stuck on running forever | `outboundStatsRefresherCron` not running | Check `inngest dashboard` → cron functions |
