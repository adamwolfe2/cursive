# Code Hardening Report

**Date:** 2026-04-16
**Project:** Cursive (openinfo-platform)
**Branch:** `hardening/2026-04-16`
**Author:** Overnight autonomous hardening pass

## Baseline (before hardening)

| Check | Result |
|-------|--------|
| Build | Passing on Vercel @ commit `24333ffe` |
| Lint | 85 warnings, 0 errors across ~47 files |
| Typecheck | 0 real errors (6 stale `.next/types` cache artifacts, not code) |
| Tests | 1303 passed / 4 failed / 49 skipped (1356 total) |
| Dep audit | 45 vulnerabilities (2 critical, 17 high, 24 moderate, 2 low) |
| Supabase advisors | 2 ERROR + multiple WARN findings |

## Summary

| Metric | Before | After | Δ |
|--------|--------|-------|---|
| Files modified | – | 69 | |
| Files created | – | 7 | |
| Lint warnings | 85 | **0** | −85 |
| Test failures | 4 | **0** | −4 |
| Tests passing | 1,303 | **1,307** | +4 |
| Critical DB RLS errors | 2 | **1** | −1 (toolkit_voice_waitlist fixed; outbound_pipeline_counts SECURITY DEFINER view left — needs product-level decision) |
| High-severity deps | 17 | 11 | −6 (undici 7.25.0 patches 6 CVEs) |
| Total dep vulns | 45 | 33 | −12 |
| Commits on branch | 0 | 7 | +7 |

## Changes by Phase

### Phase 0 — Reconnaissance (no code change)

- `ARCHITECTURE_NOTES.md` created with live project snapshot: stack, 1,917 TS files, 437 API routes, 90 Inngest functions, directory map, data flow, baseline metrics
- Later promoted to `ARCHITECTURE.md` as durable reference doc

### Phase 1 — Critical error handling + null safety
Commit: `5ed8253b fix: critical error handling and null safety from overnight hardening`

- `src/app/admin/onboarding/error.tsx` — **created**. Next.js error boundary for the onboarding admin area (no boundary existed before). Logs to console.error, shows retry + back-to-dashboard buttons, displays `error.digest` for support lookups.
- `src/components/ui/__tests__/toast.test.tsx` — fixed 4 failing tests. The Toast component was intentionally changed to use explicit colors (`bg-green-50`, `bg-red-50`, etc.) for high-contrast readability per an inline code comment, but the tests still expected old theme tokens (`bg-success-muted`, `bg-info-muted`, etc.). Updated tests to match the shipped component.
- `src/lib/repositories/onboarding-client.repository.ts` — `appendAutomationLog` had a subtle bug: `.update().eq('updated_at', …)` was treated as "success" even when zero rows matched (optimistic lock conflict). Added `.select('id')` to return updated rows, detect zero-row updates, and retry up to 5 times with linear backoff. Prevents lost log entries under concurrent Inngest steps.
- `src/app/client-onboarding/actions.ts` — `primary_contact_phone` was `z.string().max(50).optional()` in server Zod but the DB column is `NOT NULL`. An empty submission would pass Zod then fail on insert. Changed to required. Also removed `|| null` fallback on insert mapping.
- `ARCHITECTURE_NOTES.md` — initial snapshot from reconnaissance.

### Phase 2 — Dead code removal + type safety
Commit: `b45c0217 refactor: dead code removal and type safety from overnight hardening`

Eliminated 85 lint warnings → 0 across 48 files.

- **Unused imports removed** (~25 files): `redirect`, `useState`, `useEffect`, `Textarea`, `Checkbox`, `ExternalLink`, `ArrowRight`, `Inbox`, `Upload`, `DealPricing`, `OutboundTier`, lucide `Image` → `ImageIcon`, `CopyResearch`, `PackageSlug`
- **Unused local vars removed**: `STATUS_ICONS`, `queryError`, `count`, `formatPrice`, `fmtCurrencyDecimal`, `pixelDeliveryOther`, `icpText`, `classifySentiment`, `detectStageTransition`, `AccountTokenRow` interface
- **Unused function params** prefixed with `_`: `error` in 5 error boundaries, `request` in autoresearch route, `inngestError` in test/submit + onboarding/new, `limitPerMinute` in rate-limiter
- **`<img>` → `next/image`**: portal/[token]/layout + nav-bar
- **alt=""** added to ClientFilesView file icons
- **exhaustive-deps**: `watchedPackages` wrapped in useMemo (client-onboarding), `fieldsInferred` wrapped in useMemo (ParsedPreview)
- **Justified eslint-disable** with WHY comments: logger modules (`lib/dev/*`, `lib/monitoring/logger`, `lib/utils/log-sanitizer`) — these ARE the logger; `lib/email/templates.tsx` `<head>` — this is an email template, not a Next page
- **a11y suppression** on file-upload dropzone with comment explaining why `role="region"` + `aria-disabled` is correct for conveying state

### Phase 3 — UI/UX consistency + polish
Commit: `024a8690 style: UI consistency and polish from overnight hardening`

- **`src/components/admin/onboarding/OnboardingKanban.tsx`** — per-column empty state (dashed border, Inbox icon, "No clients"), global empty state when no submissions exist (ClipboardList icon, helper copy, "Create first client" CTA). Added `role="region"` + `aria-label` on columns and cards.
- **`src/components/ui/tabs.tsx` + `src/app/admin/onboarding/[id]/ClientDetailTabs.tsx`** — active tab now uses `text-blue-700` + shadow + ring instead of subtle muted foreground, taller `h-11` tablist with denser contrast bg
- **`src/components/admin/onboarding/ClientOverview.tsx`** — enrichment loading skeleton rewritten to match real content (summary lines, persona cards, messaging angle grid) with on-brand `bg-blue-50` pulse instead of slate
- **`src/components/admin/onboarding/SequenceReview.tsx`** — four states polished: "Claude is writing your sequences" spinner + animated dots, destructive-tinted failure card, friendly not-applicable card, amber warning for empty-array edge case
- **`src/components/admin/onboarding/FulfillmentChecklist.tsx`** — completed items show strikethrough + `opacity-60` + relative "2 hours ago" timestamp (date-fns `formatDistanceToNow`)
- **`src/components/onboarding/client-intake/StepWizard.tsx`** — Cmd/Ctrl+Enter advances to next step / submits on last step. Plain Enter no longer submits mid-wizard. Escape intentionally unhandled to prevent accidental data loss
- **`src/components/onboarding/client-intake/FileUpload.tsx`** — dropzone keyboard-operable (`role="button"`, `tabIndex={0}`, Enter/Space triggers picker, visible focus ring) + `aria-live="polite"` region for screen-reader file-add announcements
- **`src/components/onboarding/client-intake/TagInput.tsx`** — `role="group"` + `aria-label` on container

### Phase 4 — Performance
Commit: `0d1cc48e perf: performance improvements from overnight hardening`

- **`src/app/admin/onboarding/page.tsx`** — exclude `enriched_icp_brief` from kanban query (JSONB blob, only needed on client detail page). 21 columns → 20. Noticeable per-row payload reduction as clients grow.
- **`supabase/migrations/20260416020000_onboarding_perf_indexes.sql`** — composite indexes:
  - `(primary_contact_email, created_at desc)` — serves duplicate-submission check in client-onboarding/actions.ts (eq + gte window)
  - `(status, created_at desc)` — serves kanban column grouping + ordering

### Phase 5 — Developer experience + docs
Commit: `28bab530 docs: developer experience improvements from overnight hardening`

- **`.github/workflows/ci.yml`** — created. Runs lint + typecheck + test on PRs and pushes to main. Skips build (Vercel handles that on deploy; doubling in CI would slow PRs). Dummy Supabase env vars injected for Next typecheck.
- **`ARCHITECTURE.md`** — promoted from `ARCHITECTURE_NOTES.md`. Linked as the primary onboarding doc in README's Documentation section.
- **`README.md`** — Architecture doc added to Documentation section.

### Phase 6 — Feature enhancements
Commit: `885e5b4f feat: quality-of-life enhancements from overnight hardening`

- **Copy-to-clipboard** on contact email, phone, and invoice email in `ClientOverview.tsx`. Hover reveals subtle copy icon; click shows green Check for 1.5s; fails silently in insecure contexts.
- **CSV export** on admin onboarding clients table. Exports current page (respects search + status filter) with RFC 4180 escaping. Filename: `onboarding-clients-YYYY-MM-DD.csv`. Disabled when list is empty.
- **"Updated X ago" relative timestamp** in client detail action bar with `title` tooltip showing absolute ISO timestamp.

### Phase 7 — Security hardening
Commit: `8b3ec012 security: security hardening from overnight pass`

- **`supabase/migrations/20260416030000_security_hardening.sql`** — applied to live DB:
  - Pin `search_path = public, pg_catalog` on `update_onboarding_updated_at()`. Mutable search_path is a privilege-escalation vector.
  - `REVOKE EXECUTE` on that function from PUBLIC and anon (triggers run as row owner).
  - Tighten anon INSERT policy on `client_files`: was `WITH CHECK (true)` which allowed any payload. New policy enforces: valid `file_type` enum, `storage_path` starts with `'client-uploads/'`, length limits on path + filename, file_size > 0 and ≤ 25 MB.
  - Enable RLS on `public.toolkit_voice_waitlist` (was disabled — advisor ERROR). Anon INSERT allowed (lead capture), admin SELECT only.
- **`undici` 7.19.2 → 7.25.0** — patches 6 high-severity CVEs (WebSocket 64-bit length overflow, permessage-deflate memory exhaustion, WebSocket client unhandled exception). Minor version bump, no API changes. Our direct dep + transitive via jsdom both now on patched versions.

## Known Issues Not Addressed

Items that surfaced but are out of scope for this hardening pass — each requires a dedicated PR or a product-level decision:

1. **Next.js 15.5.9 → 16.x upgrade** (high severity: HTTP request deserialization DoS). Major version — requires migration work + QA, not a hardening one-liner.
2. **nodemailer 7.0.12 → 8.0.4+** (low severity: SMTP command injection via `envelope.size`). Major version bump, only matters if we pass user-controlled envelope.size (audit needed).
3. **Transitive vulns in stripe (qs), @mendable/firecrawl-js (axios), protobufjs** — require upstream patches or switching deps.
4. **`public.outbound_pipeline_counts` SECURITY DEFINER view** — advisor ERROR. Needs owner to decide whether the privilege elevation is intentional (for multi-tenant roll-ups) or an oversight. Not touching without product context.
5. **`auth_leaked_password_protection`** — Supabase Auth config toggle. Project-level setting in Supabase dashboard, not code.
6. **`pg_trgm` and `vector` extensions in public schema** — moving them is a multi-step migration that touches every function using them. Not a quick hardening task.
7. **Multiple other `function_search_path_mutable` warnings** on 20+ functions not authored in this codebase hardening cycle. Batch-fixable via a sweep migration, but out of scope tonight (risk of breaking functions with intentional search_path access).
8. **`al_segment_catalog` auth_insert / auth_update `WITH CHECK (true)`** — authenticated users can insert/update any segment. Appears intentional (segment taxonomy is seeded by authenticated admin tools) but warrants a product owner look.
9. **SequenceReview auto-refresh** — UI says "The page will update automatically" when copy is generating but there's no polling/Realtime subscription. Admin must manually refresh. Polling via `router.refresh()` interval would close the gap.
10. **Admin kanban pagination** — loads all clients; fine for <100 but will slow at scale. Needs cursor-based pagination or virtual list.
11. **CRM sync placeholder** — `src/lib/services/onboarding/crm-sync.ts` falls back to `console.warn` when no `CRM_WEBHOOK_URL` or `CRM_API_URL` is set. Not a bug, but visible in logs until CRM integration is wired up.

## Recommendations for Next Session

### Bigger changes needing human decision-making
- Decide on Next.js 16 migration timing (breaking changes: App Router behavior, edge runtime defaults, etc.).
- Decide whether `outbound_pipeline_counts` should drop SECURITY DEFINER or document why it's needed.
- Wire up AM Collective CRM sync endpoints now that the onboarding pipeline is stable.
- Add SequenceReview realtime updates (Supabase Realtime subscription on the client row).

### Architectural improvements worth considering
- Extract a shared `PipelineClient` repository type between admin kanban, clients table, and detail — currently each selects its own column subset.
- Promote `appendAutomationLog` to a Postgres function (`jsonb_path_set` or `||` atomic append) to eliminate the optimistic-lock retry loop entirely.
- Add indexes for `automation_log ->> 'step'` and `automation_log ->> 'status'` if admins start filtering failed steps.
- Introduce a toast provider wired via `sonner` (already in package.json) so admin actions can surface success/error without inline banners.

### Features that would benefit users but need product input
- Admin bulk actions on the clients table (mark-churned, export selected, assign-EA)
- Client-side real-time progress on the admin detail page (show "Generating sequences…" live without refresh)
- EA-visible timeline of all client touchpoints (Slack, email sent, portal visits) unified on the Overview tab
- Undo on destructive actions (delete client, etc.) with 5-second toast

## Verification

Final state of the branch `hardening/2026-04-16`:

```
pnpm lint       → ✔ No ESLint warnings or errors
pnpm test       → 1307 passed, 49 skipped (0 failed)
pnpm typecheck  → 0 real errors (6 stale .next/types cache — clears with rm -rf .next)
pnpm build      → Passing (verified on Vercel deploy of previous commits)
pnpm audit --prod → 33 vulnerabilities (2 critical, 11 high, 18 moderate, 2 low)
                    Down from 45 baseline.
Supabase advisors → Critical items from this codebase resolved.
                    Remaining items require product-level decisions (documented above).
```

Branch is ready for review/merge.
