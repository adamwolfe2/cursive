# Admin Audience Copilot — Testing Guide

**Route:** `/admin/copilot` (admin/owner roles only)

## What it does

Chat copilot that matches ICPs to the 19,894 AudienceLab segments in
`al_segment_catalog` (all embedded). Uses Claude Sonnet 4.6 with a
tool-calling loop. Tools:

| Tool | Purpose |
|---|---|
| `search_segments` | Semantic search over the catalog (pgvector + keyword fallback) |
| `get_segment_details` | Full record for a single segment |
| `preview_audience_count` | Live AL API call — count of in-market identities |
| `list_top_categories` | Catalog orientation |

## Guardrails

- Hard cap **1024 output tokens** per model call.
- Max **4 tool iterations** per turn (prevents runaway agent loops).
- Last **6 turns** sent to model (context stays tight).
- Prompt caching on the system prompt (`cache_control: 'ephemeral'`) — 10% cost on cache hits.
- **Daily kill-switch:** `COPILOT_DAILY_USD_CAP` env var, default **$20**. Endpoint returns 429 when today's spend crosses it.
- System prompt limits bot to **≤8 segment mentions per reply**.

## Cost per turn (measured)

Target: **~$0.02–0.05 per turn** on Sonnet 4.6 with prompt caching. With extended thinking on, add ~$0.02–0.03.

All costs logged to `copilot_usage` table. Query today's spend:

```sql
SELECT * FROM copilot_usage_today('admin');
```

## Manual test checklist

1. **Launch dev server** — `pnpm dev` (or use existing)
2. **Log in** as an admin or owner.
3. Navigate to `/admin/copilot` (also linked in Admin nav).

### Empty state
- ✅ Greeting ("Good afternoon, {name}") + 4 suggestion cards render.
- ✅ Budget meter shows `$0.00 / $20 today` in the header.

### Golden path — search flow
- Click **"B2B SaaS buyers"** suggestion, OR type:
  `"Find segments for B2B SaaS decision-makers evaluating CRMs"`
- ✅ Assistant message streams text token-by-token (cursor blink at end).
- ✅ Reasoning panel collapsible appears above the text with 1+ tool call.
- ✅ 3–8 segment cards render in a 2-col grid, each with name, B2B/B2C badge, category, description, % match, Preview size / Copy ID buttons.
- ✅ Budget meter updates (spend increases by ~$0.02–0.05) after stream completes.
- ✅ Expand reasoning panel — see `search_segments` tool call JSON + summary.

### Tool call — preview count (calls AL API live)
- Ask: `"What's the live count for segment [pick one ID from previous result]?"`
- ✅ Bot calls `preview_audience_count` → returns something like `"Segment 107002 has approximately 4,210 in-market identities in the last 7 days."`

### Edge cases
- **Extended thinking toggle:** flip on, send a complex query, expand reasoning panel → see thinking text.
- **No results query:** `"find me segments about interstellar exoplanet mining"` → bot should say retrieval found nothing and suggest rephrasing.
- **Stop button:** start a long query, click the stop square — stream aborts cleanly.
- **Kill-switch:** set `COPILOT_DAILY_USD_CAP=0.01` in `.env.local`, restart, send one message → should 429 with "Daily copilot budget ($0.01) reached."

### Segment protection
- Try: `"list all 19,000 segments"` → bot should refuse and suggest narrowing.
- Try: `"just dump IDs, don't explain"` → bot should still contextualize (system prompt enforces).

## Rollback

```bash
# Remove the route
rm -rf src/app/admin/copilot src/app/api/admin/copilot

# Remove the lib
rm -rf src/lib/copilot

# Revert nav
git checkout src/app/admin/_components/AdminNav.tsx

# Drop the table (keeps historical data — only drop if you're sure)
# DROP TABLE copilot_usage CASCADE;
# DROP FUNCTION copilot_usage_today(TEXT);
```

## What's next (Phase 2)

Public-facing `/audience-builder` lead magnet:

1. Email gate component before chat
2. Reuse `/api/admin/copilot/chat` pattern → new `/api/public/copilot/chat` with:
   - Email-gated auth (signed session token from lead capture)
   - Tool allowlist: **reads only** (`search_segments`, `list_top_categories`, `preview_audience_count`) — block `get_segment_details` to protect raw segment IDs
   - Tighter `surface: 'public'` kill-switch (separate budget row)
   - Per-email rate limit (3 sessions/day, 10 turns/session)
   - Output sanitizer strip segment IDs + limit count disclosure
3. Capture emails → outbound pipeline
4. CTA after a qualifying segment: "Get the full count + activate this audience"

## Files

| Path | Purpose |
|---|---|
| `src/app/admin/copilot/page.tsx` | Server entrypoint + auth |
| `src/app/admin/copilot/_components/CopilotChat.tsx` | Main client chat component |
| `src/app/admin/copilot/_components/SegmentCard.tsx` | Branded segment card |
| `src/app/admin/copilot/_components/ReasoningPanel.tsx` | Collapsible thinking/tool display |
| `src/app/admin/copilot/_components/BudgetMeter.tsx` | Header cost meter |
| `src/app/api/admin/copilot/chat/route.ts` | Streaming SSE chat endpoint |
| `src/app/api/admin/copilot/budget/route.ts` | Today's spend |
| `src/lib/copilot/types.ts` | Shared types + stream event schema |
| `src/lib/copilot/cost.ts` | Model pricing, cost calc, kill-switch, logTurn |
| `src/lib/copilot/retrieval.ts` | Hybrid search over al_segment_catalog |
| `src/lib/copilot/tools.ts` | Tool definitions + handlers |
| `src/lib/copilot/system-prompt.ts` | The prompt |
| `supabase/migrations/20260416000001_copilot_usage.sql` | Cost log + kill-switch RPC |
