# Cursive Funnel — Launch-Gate Delivery Plan (S1–S9)

**Created:** 2026-06-10 · **Owner:** Adam · **Driver:** Claude
**Source audit:** `.claude/specs/2026-06-10-codex-launch-audit.md`

---

## 🎯 GOAL (north star)

**The funnel-buyer product can safely take paid traffic** — every confirmed P0/P1
from the pre-launch audit is closed AND proven, with no trust-breaking buyer
workflow and no cross-tenant or money/auth defect.

### Definition of Done (the green-light gate)
The funnel is GREEN only when ALL of these are true and demonstrated:

- [ ] **P0-1 takeover** — an unverified checkout email can never reach a
      pre-existing account's session or workspace. *(S1 — shipped)*
- [ ] **P0-2 attribution** — a net-new buyer's visitors (webhook AND V4 pull)
      reliably become leads AND show as "verified" + populate the portal
      visitor feed + CSV + dashboard. *(S2–S5)*
- [ ] **P0-3 email** — Resend sending domain verified; funnel emails deliver.
      *(cleared — DNS verified 2026-06-10)*
- [ ] **P1-4 webhook auth** — a bare workspace UUID can never authorize
      ingestion. *(S6)*
- [ ] **P1-5 identity isolation** — events from one workspace never read/mutate/
      link another workspace's identity or lead. *(S8)*
- [ ] **P1-6 orphan pixel** — a paid pixel is never provisioned without a bound
      workspace; recovery re-binds. *(S7)*
- [ ] **S9 integrated proof** — all of the above demonstrated together in
      staging, with monitors/alerts wired. → **enable paid traffic.**

**Operating rules:** Tier-1 slices use `safe-feature-slice` (failing test →
minimal fix → invariant proof → dual review: Claude code/security-reviewer +
Codex `$code-review`). Migrations applied via Supabase MCP, **dry-run first**,
idempotent. Each slice ships on its own branch via `cap` and is reviewed before
merge. Never drive paid traffic until the green-light gate is fully checked.

---

## STATUS

| Slice | Title | Branch | State |
|---|---|---|---|
| **S1** | Account-takeover containment | `fix/funnel-s1-account-takeover` | ✅ shipped (pushed, dual-reviewed) |
| **S2** | Canonical attribution contract + migration | `fix/funnel-s2-pixel-attribution` | ✅ shipped; **migration APPLIED to prod** |
| **S3** | Stamp `pixel_row_id` in producer (webhook) | `fix/funnel-s3-stamp-pixel-row` | ✅ shipped (pushed, Claude-reviewed SAFE) |
| **S4** | Wire consumers + V4 install signal | `fix/funnel-s4-canonical-consumers` | ✅ shipped (pushed, dual-reviewed); source-CHECK migration **applied to prod**. Buyer-facing acceptance proven at S9 (needs deploy + S5 backfill). |
| **S5** | Backfill + enforce attribution | _pending_ | ⬜ |
| **S6** | Signed per-pixel webhook credential | _pending_ | ⬜ |
| **S7** | Atomic pixel↔workspace binding | _pending_ | ⬜ |
| **S8** | Workspace-scoped identity/lead dedup | _pending_ | ⬜ |
| **S9** | Integrated release gate | _pending_ | ⬜ |

**Outstanding action items (Adam):** re-run Codex `$code-review` on S1–S3 after
its rate-limit resets; merge S1→S2→S3 (stacked); apply later migrations on deploy.

---

## DEPENDENCY GRAPH

```
S1 ──────────────────────────────────┐ (independent; shipped)
S2 ─→ S3 ─→ S4 ─→ S5 ─→ S6 ─→ S7 ─────┤
S8 ───────────────────────────────────┤ (independent code; migration serialized)
                                       └─→ S9 (needs S1, S5, S7, S8)
```
Required order on the attribution spine: **S2 → S3 → S4 → S5 → S6 → S7**.
S8 may proceed in parallel; its migration serializes with S2/S5.

---

## SLICES

### S4 — Wire consumers to the canonical key + V4 install signal  *(fixes P0-2 surfaces)*
**Tier 1 (data/state).** **Depends on:** S3.
**Invariant:** verify, portal visitor feed/CSV, dashboard stats, and the V4-pull
install signal ALL read the same canonical `pixel_row_id`; webhook- and
pull-sourced events are treated identically.

**Changes:**
- `src/app/api/pixel/verify/route.ts:51` — count `audiencelab_events` by
  `pixel_row_id = pixel.id`, not `pixel.pixel_id`.
- `src/lib/funnel/order.service.ts:301` (`getOrderVisitors`) + CSV — query by
  `pixel_row_id` (resolve the order's pixel row), not `pixel_audiencelab_id`.
- `src/inngest/functions/pixel-v4-sync.ts:360` — when the pull inserts/enriches a
  lead, also write an **idempotent** minimal `audiencelab_events` install-signal
  row stamped with `pixel_row_id` (so verify/stats reflect pull-only buyers).
- `src/app/(dashboard)/dashboard/page.tsx` / stats RPC — confirm
  `hasVerifiedPixel` / `pixel_event_count` derive from canonical events.

**Acceptance / proof:**
- [ ] New buyer, webhook event → `/api/pixel/verify` returns `verified:true`.
- [ ] New buyer, **V4 pull only** (no webhook) → verify `true`, dashboard drops
      "awaiting first event" + amber troubleshoot card.
- [ ] Portal `/api/funnel/[token]/visitors` + `?format=csv` non-empty for a
      buyer with canonical events.
- [ ] No double-count; another pixel/workspace's events never appear.
- [ ] V4 retries don't duplicate install-signal rows (idempotency key).

---

### S5 — Backfill attribution + enforce coverage
**Tier 1 (data).** **Depends on:** S4.
**Invariant:** historical events get `pixel_row_id` only when ownership is
deterministic; ambiguous rows stay null (quarantined), never cross-workspace.

**Changes:**
- Backfill (MCP migration/script, **dry-run first**): set `pixel_row_id` by
  (1) exact `pixel_id`→active pixel row match, else (2) the event's
  `workspace_id` when it maps to exactly one active pixel. Count attributed /
  ambiguous / unknown / conflicting.
- Add a monitor/alert on the unattributable rate.

**Acceptance / proof:**
- [ ] Dry-run report reviewed before any write.
- [ ] No row receives a pixel from another workspace (0 conflicts).
- [ ] Backfill idempotent + resumable.
- [ ] Unattributable production rate drops from the measured 91% to the agreed
      threshold; consumer counts reconcile.

---

### S6 — Signed per-pixel webhook credential  *(fixes P1-4 auth bypass)*
**Tier 1 (webhook/auth).** **Depends on:** S5.
**Invariant:** a webhook request cannot select a pixel/workspace without a valid
credential bound to that pixel; a bare workspace UUID never authorizes ingestion.

**Changes:**
- `src/app/api/webhooks/audiencelab/superpixel/route.ts:271` — replace unsigned
  `?ws=<uuid>` with a signed per-pixel routing credential → resolves canonical
  `pixel_row_id`; workspace derived from the pixel row.
- `src/lib/audiencelab/api-client.ts` + pixel provision routes — register AL
  webhooks with signed URLs (retryable); credential versioning/rotation state.
- Preserve the unauthenticated reachability probe (GET/HEAD) without allowing
  ingestion.

**Acceptance / proof:**
- [ ] Forged/sans-credential `?ws=` → 401.
- [ ] Credential for pixel A cannot route to pixel/workspace B.
- [ ] Rotation invalidates the old credential.
- [ ] Real AL delivery + test button succeed with signed URLs.

---

### S7 — Atomic, retryable pixel↔workspace binding  *(fixes P1-6 orphan pixel)*
**Tier 1 (money/state).** **Depends on:** S6.
**Invariant:** a funnel order never advances past pixel provisioning until its
pixel is durably bound to the order's workspace with valid routing.

**Changes:**
- `src/lib/funnel/order.service.ts` (`provisionFunnelPixel` ~:760) +
  `workspace-provision.ts` — transactional RPC: provision workspace before pixel
  or stop without advancing order status; failed binding retryable.
- `src/app/api/funnel/[token]/pixel/route.ts`, `dashboard-login/route.ts` —
  recovery backfills an existing order's pixel binding + re-registers signed
  webhook; ambiguous orphans blocked + alerted (no ownership guessing).

**Acceptance / proof:**
- [ ] Forced provisioning failure → no orphan pixel; order status not advanced.
- [ ] Concurrent retries → exactly one bound pixel.
- [ ] Recovery binds a deterministic orphan + routes events.

---

### S8 — Workspace-scoped identities + lead dedup  *(fixes P1-5)*
**Tier 1 (isolation).** **Depends on:** none (parallel); migration serialized.
**Invariant:** identity lookup, identity updates, lead lookup, and identity→lead
links never cross workspace boundaries.

**Changes:**
- `src/lib/audiencelab/edge-processor.ts:170-207` — scope every identity lookup
  by `workspace_id`; `:370-385` — never link a cross-workspace lead; scope hash/
  email lead dedup by workspace.
- Migration: replace global identity unique indexes with workspace-composite;
  resolve existing cross-workspace links **before** the index swap.

**Acceptance / proof:**
- [ ] Same `profile_id`/`hem`/email in two workspaces → independent identities +
      leads.
- [ ] An event in workspace B never updates/links workspace A's identity or lead.
- [ ] Same-workspace dedup still works; pre/post-migration integrity verified.

---

### S9 — Integrated paid-traffic release gate  *(not code → the green-light)*
**Depends on:** S1, S5, S7, S8.
**Required proof (staging end-to-end):**
- [ ] Attacker checkout with an existing customer email cannot obtain that
      customer's session.
- [ ] Forged routing credential creates no events/leads.
- [ ] Real webhook AND V4 pull both reach the correct buyer's verify screen,
      portal feed, CSV, stats, and leads.
- [ ] Checkout cannot advance with an orphan pixel.
- [ ] Duplicate identities/leads remain workspace-local.
- [ ] Backfill reconciliation shows zero cross-workspace conflicts.
- [ ] Alerts exist for: unknown attribution, invalid credentials, orphan pixels,
      provisioning retries, unattributable-rate spikes.

→ **All checked = GREEN-LIGHT: enable paid traffic.**

---

## VERIFICATION CADENCE (per slice)
1. `safe-feature-slice`: failing test first → minimal fix → invariant proof.
2. `tsc --noEmit` 0 errors · relevant vitest suites green.
3. Dual review: Claude (code-reviewer + security-reviewer for Tier-1) **and**
   Codex `$code-review`. Resolve all MAJOR/HIGH before commit.
4. Migrations: MCP `apply_migration`, dry-run/verify-no-violation first.
5. `cap` on the slice branch; do not merge to main without review sign-off.
6. Update this spec's STATUS table + acceptance checkboxes.
