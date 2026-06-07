# Fulfillment Runbook — automated + manual floor

**Purpose:** guarantee every paid funnel order gets fulfilled, even if automation hiccups.

## The two deliverables

### 1. Audience (offers: audience_197, bundle_247)
**Automated:** buyer submits ICP → `pushFunnelAudienceToWorkspace` → `provisionWorkspaceAudience` → createAudience → poll → fetchAudienceRecords → leads inserted into workspace → `audience_delivered_at` set → dashboard "building" banner clears.

**Manual floor (always works):**
1. AudienceLab dashboard → build the segment from the buyer's ICP (admin panel shows ICP at `/admin/funnel-orders` → "View ICP").
2. Export the Google Sheet.
3. `/admin/funnel-orders` → "Mark delivered" → paste Sheet URL.
4. Buyer sees the Sheet in their portal + gets the delivery email. ✅ This path is independent of the AL API.

### 2. Website visitors (offers: pixel_97, bundle_247)
**Automated (after this branch deploys):**
- **Real-time:** AL pushes pixel events → our webhook (now accepts on known `pixel_id`, no secret needed) → leads inserted live.
- **Backfill:** `pixel-v4-sync` cron pulls `GET /pixels/{id}/v4`, falls back to `GET /pixels/{id}` (V3) when V4 500s → inserts any missed visitors. Dedupe makes it additive.

**Manual floor:** AudienceLab dashboard lists identified visitors per pixel → export → (future: one-click "import CSV to workspace" admin tool, or hand the buyer the CSV).

## External dependencies (not in our code)
- AL must actually **push** webhook events / have resolved visitor data. We've removed every blocker on our side.
- AL's **V4 endpoint is 500-ing** (their bug) — mitigated by the V3 fallback. Report to AL but not blocking.

## Launch posture
- **Money + portal:** proven, safe.
- **Audience:** safe to launch (manual floor + auto).
- **Visitors:** safe once this branch is merged + deployed (webhook auth + V3 fallback). Until deployed, prod has the old broken behavior.

## If something breaks at launch
1. Check `/admin/funnel-orders` for the order state.
2. Audience stuck "building" → fulfill manually (steps above); `audience_delivered_at` set → banner clears.
3. Visitors not appearing → check AL dashboard for the pixel; if AL has them but we don't, the webhook/pull is the issue (check Inngest logs for `[PixelV4Sync]` / `[AL Superpixel]`); manual export as last resort.
