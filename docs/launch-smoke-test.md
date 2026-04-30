# EmailBison Push Pipeline — Launch Smoke Test

Run this top-to-bottom before copying real clients.

---

## 0. Prerequisites

**Vercel deploy**
- Confirm latest `main` is live: `gh deployment list --repo adamwolfe2/cursive --limit 1`

**Migrations** — run `supabase db push` (or confirm remote is current via `supabase migration list`):
```
20260428000000_onboarding_workspace_assignment.sql
20260429000000_onboarding_eb_workspace.sql
20260429000200_webhook_dead_letter.sql
```
Check for anything newer:
```bash
ls supabase/migrations/ | grep -E "20260429|20260430"
```

**EmailBison webhooks** — in each launching workspace (Cursive, Olander, etc.) confirm:
- Webhook URL: `https://leads.meetcursive.com/api/webhooks/emailbison/campaigns`
- Secret: matches `EMAILBISON_WEBHOOK_SECRET` in Vercel

**RabbitSign webhook URL** — must include `?secret=<RABBITSIGN_WEBHOOK_SECRET>`. Confirm in RabbitSign settings.

---

## 1. Test Client Setup

Test client: `9e00ba30-7e4e-48ef-b20a-26ddaa0cd914` ("Cursor (TEST)")

Confirm `is_test_client = true` via Supabase dashboard or:
```bash
pnpm seed:portal
```

If the client is in a bad state, reset:
```bash
pnpm seed:portal -- --reset
pnpm seed:portal
```

The seed script sets `is_test_client=true`, which makes all EB pushes run dry-run (no real API calls).

---

## 2. Pick EB Workspace

1. Go to `https://leads.meetcursive.com/admin/onboarding/9e00ba30-7e4e-48ef-b20a-26ddaa0cd914`
2. Click the **Email Sequences** tab
3. Locate the **EmailBison destination workspace** picker
4. Confirm the dropdown lists real workspaces (Cursive, Olander, JustSearched, etc.) — not a blank list
5. Select any non-test workspace
6. Confirm a **"Workspace set"** badge appears next to the picker

---

## 3. Approve Copy (Test Client — Dry Run)

1. Click **Approve All**
2. Wait ~5s
3. Verify `DeploymentStatusCard` shows **Deployed** with synthesized campaign IDs (format: `dryrun-<uuid>`)
4. Check `AutomationLog` timeline — should show `emailbison_push: complete`
5. Open EB UI under the workspace you selected — **no real campaigns should appear** (because `is_test_client=true`)

If the card stays stuck in "Pending" after 30s, check Vercel runtime logs for `/api/admin/onboarding/[id]/push-emailbison`.

---

## 4. Real Client Sanity (Staging Onboarding Client)

Use your second test client or spin up a fresh staging onboarding entry. Pick a real EB workspace.

1. Approve copy
2. In EB UI under that workspace, confirm:
   - Campaigns exist (one per sequence)
   - Each campaign has the correct senders attached
   - All campaigns are in **DRAFT** status (not auto-launched)
3. If an `existing_list` file was attached to the client, confirm leads appear in each campaign

---

## 5. Failure Recovery Checks

**No workspace set → refuse push**
```bash
# Clear the workspace assignment for the test client via Supabase, then:
curl -X POST https://leads.meetcursive.com/api/admin/onboarding/9e00ba30-7e4e-48ef-b20a-26ddaa0cd914/push-emailbison \
  -H "x-automation-secret: $AUTOMATION_SECRET"
# Expect: 400 {"error":"EmailBison workspace must be assigned before push."}
```

**Double-click idempotency (atomic lock)**
```bash
# Fire two simultaneous pushes — second should 409
curl -s -o /dev/null -w "%{http_code}" -X POST \
  https://leads.meetcursive.com/api/admin/onboarding/9e00ba30-7e4e-48ef-b20a-26ddaa0cd914/push-emailbison \
  -H "x-automation-secret: $AUTOMATION_SECRET" &
curl -s -o /dev/null -w "%{http_code}" -X POST \
  https://leads.meetcursive.com/api/admin/onboarding/9e00ba30-7e4e-48ef-b20a-26ddaa0cd914/push-emailbison \
  -H "x-automation-secret: $AUTOMATION_SECRET" &
wait
# Expect: one 200, one 409
```

**Re-trigger after mid-push abort (idempotency)**
```bash
# Force re-push on an already-deployed client
curl -X POST "https://leads.meetcursive.com/api/admin/onboarding/9e00ba30-7e4e-48ef-b20a-26ddaa0cd914/push-emailbison?force=1" \
  -H "x-automation-secret: $AUTOMATION_SECRET"
# Expect: 200, no duplicate campaigns created — existing ones returned
```

---

## 6. Webhook Smoke

1. In EB UI, manually trigger a **test bounce** event on any sender in the target workspace
2. Tail Vercel runtime logs for `/api/webhooks/emailbison/campaigns`
3. Expect a `200` response with log line: `signature verified`
4. If you see `401 Invalid signature`: the secret in EB UI does not match `EMAILBISON_WEBHOOK_SECRET` in Vercel — fix in EB webhook settings, then re-test

---

## 7. Rollback Plan

**Last known good commits** (update before launch day):
```bash
git log --oneline -5
# bc53bf2a fix(rabbitsign): accept webhook secret via query string
# b9758019 feat(emailbison): super-admin workspace targeting + remaining P0 fixes
# 79c614d5 fix: pre-launch P0 — multi-tenant isolation, server-action auth, EB workspace
```

To roll back Vercel to a previous deploy:
```bash
vercel rollback --scope am-collective   # picks the previous successful deploy
```

**Kill switch — disable EB push entirely:**
1. Vercel dashboard → `leadme` project → Environment Variables
2. Add `ONBOARDING_PIPELINE_DISABLED=1`
3. Redeploy (or `vercel env pull && vercel deploy --prod`)
4. All push requests will return `503` with no side effects
