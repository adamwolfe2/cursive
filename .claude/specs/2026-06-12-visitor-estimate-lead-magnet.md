# Slice: Visitor-Estimate Lead Magnet (VSL)

**Date:** 2026-06-12 · **Tier:** 1 (PII capture + outbound email/compliance)

## Goal
A single, publicly shareable page on `leads.meetcursive.com/visitor-estimate` where a
prospect estimates how many anonymous visitors / how much revenue they're missing —
pure calculator math, **no real pixel fired** — then captures their email and enrolls
them in a 3-step nurture drip. Results-first (show the leak, then capture).

## Reuse (already exists)
- `RevenueCalculator` (form → loading → leak reveal → comparison → BookDemo + email capture)
- `calculateScenarios()` in `src/lib/superpixel-constants.ts`
- `BookDemoButton` → `cal.com/cursiveteam/30min`
- Resend `sendEmail`, Inngest, `createAdminClient`

## Build
1. **Migration** `visitor_estimate_leads` (+RLS, service-role only). `unsubscribed_at` for compliance.
2. **Page** `src/app/visitor-estimate/page.tsx` — dark VSL frame mounting the calculator with
   `captureEndpoint="/api/visitor-estimate/submit"`.
3. **Thread `captureEndpoint` prop** through RevenueCalculator → ResultsDashboard → LeadCaptureForm
   (default `/api/lead-capture` — marketing pages unchanged).
4. **`POST /api/visitor-estimate/submit`** — public, CORS, rate-limited, Zod. Upsert lead → Slack →
   fire Inngest `visitor-estimate/captured`.
5. **Inngest `visitorEstimateNurture`** — t0 leak recap + Book, +2d case study, +5d breakup.
   Each checks `unsubscribed_at` + includes unsubscribe link.
6. **`/api/unsubscribe`** — sets `unsubscribed_at`. CAN-SPAM.
7. **Middleware** — `/visitor-estimate` public page; `/api/visitor-estimate` + `/api/unsubscribe` public API.

## Invariants
- No pixel provisioned — estimate is formula-only.
- Capture endpoint never throws to client on nurture/Slack failure (best-effort, safe-logged).
- Marketing calculator behavior unchanged (prop defaults preserved).

## Verify
- typecheck/lint/build green · parallel code+security review · Codex review · manual: submit → email arrives → unsubscribe works.
