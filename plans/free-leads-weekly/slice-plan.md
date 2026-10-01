# Slice plan: free leads -> weekly leads (self-serve, Tier 1)

Brief. Actor: a signed-in free-leads workspace owner. Action: start "25 new leads every Monday" (14 days free, then
$197/mo, existing `audience_197` price + `FUNNEL_TRIAL_DAYS`), then receive 25 new leads each Monday in the same workspace.

Invariant: a paid order is bound only to the workspace of the authenticated user who started checkout; nothing in the
request body chooses the workspace, the price or the email. Weekly pulls happen at most once per order per ISO week,
only while the subscription is trialing/active, and never duplicate a lead already in the workspace.

Previous behaviours preserved: pay-first funnel checkout (/api/funnel/checkout) unchanged; provisionFunnelWorkspace
still refuses to link an unverified checkout email to a non-funnel workspace (P0 takeover guard); repeat-buyer trial
end unchanged; free claim flow unchanged.

Unsafe outcomes: order linked to someone else's workspace; paid with nothing delivered and no alert; double weekly pull
(double spend); pulls after cancel; leads leaking across workspaces; provider name shown.

Assumptions: Stripe Checkout metadata is server-set and cannot be altered by the buyer (true: only our secret key
creates sessions). Weekly cadence = Monday 14:00 UTC. A free-leads order skips the manual audience ops queue.

| # | Slice | Tier | Status | Depends |
|---|---|---|---|---|
| 1 | POST /api/start/checkout (session-auth, owner of a free_leads workspace) -> Stripe session, metadata.free_leads_workspace_id; webhook binds order to that workspace after verifying owner email == order email | 1 | done (41e1238a) | - |
| 2 | Free-leads home shows the subscription (trialing/active, next Monday) and the weekly CTA starts checkout instead of booking | 3 | done (41e1238a) | 1 |
| 3 | Weekly delivery job: for bound audience orders that are trialing/active, pull 25 new contacts from the claim's filters, dedup, insert, once per ISO week (unique key) | 1 | done (migration applied to prod 2026-10-01; no live pull, unit-tested lock/cursor/dedupe) | 1 |
| 4 | Monday email: "Your 25 new leads are in" with link | 2 | pending | 3 |

Exit evidence: failing test first per slice; vitest + tsc green; slice 1 local checkout session created against Stripe
test mode or a stubbed client (never live charge); slice 3 one real pull against the E2E test workspace only.
