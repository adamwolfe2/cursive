# Funnel Offer — Delivery Runbook (current state, 2026-06-09)

The exact, repeatable process to fulfill a client. Reflects everything shipped
through commit 32f78adc. Supersedes 2026-06-06-fulfillment-runbook.md.

## What the client bought (and only this)
1. A pixel that identifies their website visitors → synced to their dashboard.
2. A custom audience, refreshed weekly → synced to the same dashboard.
Every lead delivered is **email-verified** (quality gate, both paths).

---

## The automated happy path (no manual step)
1. **Pay** (VSL `/get-leads` → Stripe) → webhook creates the order, auto-
   provisions the workspace + owner user, emails the portal link.
2. **Portal** (`/funnel/<token>`): client installs the pixel snippet + submits
   their ICP (who they want).
3. **On ICP submit** → `pushFunnelAudienceToWorkspace` fires
   `provisionWorkspaceAudience`:
   - builds the audience via AL API (`/audiences` → poll → `/audiences/{id}`),
   - **drops any record without an AL-verified email** (quality gate),
   - inserts the verified leads (stamped `validated` + `verification_status=verified`),
   - registers `al_audiences` (refresh_enabled=true) → **weekly refresh** every
     Monday 08:00 UTC via `alAudienceRefresh`,
   - sets `funnel_orders.audience_delivered_at` → the dashboard "building"
     banner clears itself.
4. **Visitors** flow continuously: pixel fires → webhook (and the 4-hourly V4/V3
   pull) → verified visitors inserted as leads → appear in the dashboard +
   "Live Visitor Leads". First identified visitor triggers the "aha" email.
5. Client logs in (portal "Open your dashboard", or `/login` → "Email me a login
   link") to a clean, verified dashboard.

---

## Manual fallback (one clean admin action — use if automation is uncertain)
AL's API is occasionally flaky. If an order's audience didn't auto-build:

1. Go to **`/admin/funnel-orders`** → find the order (status `awaiting_delivery`).
2. Click **"View ICP + AL builder values"** → **"Build in Audience Builder"**
   (deep-links the copilot pre-filled with the client's ICP), OR build the
   segment directly in the AudienceLab dashboard.
3. Export / confirm the verified list.
4. Click **"Mark delivered"** + paste the Google Sheet URL →
   `POST /api/admin/funnel-orders/[id]/deliver`:
   - flips status → `delivered`, sends the delivery email,
   - fires the Phase-4 push (`pushFunnelAudienceToWorkspace`) → leads land in
     the workspace (verified-only), banner clears.

That single "Mark delivered" action is the only manual step, ever.

---

## Quality guarantees (enforced in code) — Quality Gate v2
Single shared assessor `assessLeadQuality(record)` (src/lib/services/
lead-quality.service.ts) runs on EVERY path that writes a lead:
1. **Not a bad email** — requires an AL-verified email AND rejects an explicitly
   bad `email_validation_status` (invalid / catch-all / spamtrap) when AL gives one.
2. **Fully filled out** — verified-but-sparse records (missing name/company/title)
   are topped-up via `/enrich` (`maybeEnrichTopUp`, fills missing fields only,
   never overwrites, never blocks on failure). Kill-switch: env `LEAD_ENRICH_TOPUP=off`.
3. Inserted leads are stamped `validated` + `verification_status='verified'`.

Wired into: audience pull (provisionWorkspaceAudience), visitor pull
(pixel-v4-sync), weekly refresh + DFY onboarding (bulkInsertALRecords). The
real-time webhook→processor path already enforces an equal-or-stricter bar
(isLeadWorthy verified + meetsQualityBar name/company/email/phone/location);
any sparse visitor it drops is re-captured + topped-up by the 4-hourly pull.

Yields measured live: ~48% of audience records, ~72% of visitor events carry a
verified email → build/expect ~2x the desired delivered count. Quality over
volume, by design.

NOTE: AudienceLab has no public REST email-validation endpoint (the dashboard
"Email Validation" is a batch UI tool). The gate uses AL's per-record verified
flags + the working `/enrich` lookup, which is the reliable path.

## Known external dependency (AL-side)
- `/pixels/{id}/v4` returns 500 (AL bug). Our **V3 fallback** (`/pixels/{id}`)
  is live-verified and covers it. Visitor sync still works.
- AL list endpoints inconsistent casing (`Data` vs `data`) — handled in code.

## Pre-demo checklist (do before showing a client)
- [ ] Pre-load the demo workspace: build + verify its audience so the dashboard
      is full on first login. (Needs the test workspace email + site/ICP.)
- [ ] Confirm the pixel is installed on the demo site and has fired at least once.
- [ ] Log in via the magic link and confirm: clean dashboard, verified leads,
      no marketplace chrome, no empty states.
- [ ] Have `/admin/funnel-orders` open as the fulfillment control panel.

## Still waiting on Adam (unblocks the demo)
- Test workspace **email** + the **site/ICP** to pre-load + verify the demo account.
- A real pixel on a real site with traffic for live visitor proof.
