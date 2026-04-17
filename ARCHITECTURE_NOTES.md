# Architecture Notes — Phase 0 Reconnaissance

**Date:** 2026-04-16
**Branch:** hardening/2026-04-16
**Project:** Cursive (openinfo-platform) — B2B lead marketplace + outbound platform

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.1.4 (App Router) + React 19 |
| Language | TypeScript 5.7 (strict mode) |
| Package manager | pnpm 10.23.0 |
| DB | Supabase (PostgreSQL) + `@supabase/ssr` |
| Auth | Supabase Auth (middleware-based SSR) |
| Background jobs | Inngest 3.23 (90 functions) |
| State | Zustand 5 + TanStack Query 5.90 |
| UI | TailwindCSS 3.4 + shadcn/ui + Radix UI + Framer Motion |
| Forms | React Hook Form + Zod |
| Payments | Stripe 17.5 |
| Email | Resend 4 + Nodemailer + EmailBison (cold outreach API) |
| AI | Anthropic SDK 0.72 + OpenAI 6.17 |
| Monitoring | Sentry 10.38 + PostHog + Vercel Analytics |
| Testing | Vitest 4 + Playwright 1.49 + Testing Library |
| Deploy | Vercel (pdx1 region) |

---

## Repo Size

- **1,917** TypeScript files in `src/`
- **437** API routes (`src/app/api/**/route.ts`)
- **385** directories under `src/app/{admin,api}`
- **90** Inngest background functions
- **57+** Supabase migrations

---

## Directory Map

```
src/
├── app/                       # Next.js App Router
│   ├── (app)/                # Auth-gated app routes (segment-builder, analytics)
│   ├── (auth)/               # Login, signup, legacy /onboarding → redirects
│   ├── (dashboard)/          # Main dashboard
│   ├── (affiliate)/          # Affiliate portal
│   ├── admin/                # 30+ admin subpages — kanban, monitoring, analytics
│   │   ├── _components/AdminNav.tsx   # Sidebar nav with collapsible groups
│   │   ├── copilot/          # Audience copilot chatbot
│   │   ├── onboarding/       # Client intake pipeline kanban + detail + wizard
│   │   ├── sdr/              # AI SDR inbox manager
│   │   └── autoresearch/     # Karpathy-loop campaign orchestrator
│   ├── client-onboarding/    # Public intake form (Typeform-style wizard)
│   ├── api/                  # 437 route handlers
│   │   ├── automations/      # Onboarding pipeline triggers
│   │   ├── webhooks/         # Stripe, EmailBison, etc.
│   │   ├── inngest/          # Inngest function registration
│   │   └── health/           # Env var health check
│   ├── marketplace/          # Lead marketplace UI
│   └── portal/[token]/       # Client review portal (token-gated)
├── components/
│   ├── ui/                   # 40+ base primitives (Radix + CVA)
│   ├── admin/onboarding/     # Kanban + client detail tabs
│   ├── onboarding/client-intake/  # Wizard steps (10 files)
│   ├── crm/                  # Board, table, drawer views
│   ├── campaigns/            # Campaign wizard + compose + review
│   └── ...                   # ~35 feature dirs
├── lib/
│   ├── supabase/             # SSR client, admin client, middleware client
│   ├── repositories/         # 25+ repository classes (data access layer)
│   ├── services/             # 45+ business logic services
│   │   └── onboarding/       # Claude enrichment, copy gen, Slack, email, CRM
│   ├── validation/           # Zod schemas
│   ├── monitoring/           # Alerts, logger, Sentry
│   ├── middleware/           # Rate limiter, workspace resolver
│   └── integrations/         # EmailBison, Clay, GHL, HubSpot, etc.
├── inngest/
│   ├── client.ts             # Typed event registry
│   └── functions/            # 90 background functions
│       ├── onboarding-*.ts   # 3-step intake pipeline (enrichment → copy → notify)
│       ├── campaign-*.ts     # Send, enrich, compose, schedule
│       └── cleanup-*.ts      # Cron-driven cleanup jobs
├── types/                    # Shared TypeScript types
├── hooks/                    # Custom React hooks
├── __tests__/                # Integration + security tests
└── middleware.ts             # Edge middleware (auth, rate limit, ref cookies)
```

---

## Data Flow

### Request Flow
```
Browser → middleware.ts (rate limit + auth + workspace cookie)
        → page.tsx (server component, direct Supabase query)
        → API route (validated with Zod, uses repository)
        → Supabase (RLS-enforced queries)
        → Response
```

### Onboarding Pipeline Flow (recent big feature)
```
Client fills form at /client-onboarding
  → Server action uploads files to Supabase Storage
  → Inserts row in onboarding_clients (RLS anon-insert-restricted policy)
  → Fires Inngest event 'onboarding/intake-complete'
Inngest pipeline (onboarding-intake-pipeline.ts):
  1. Load client from DB
  2. Claude Sonnet 4 → enriched ICP brief (JSONB)
  3. Claude Sonnet 4 → 3 email sequences (JSONB) [if outbound/bundle]
  4. Auto-generate fulfillment checklist
  5. Slack alert + fallback email if Slack fails
  6. Client confirmation email (Resend)
  7. CRM sync (webhook/API/fallback-log)
  8. Update status → 'setup'
Admin at /admin/onboarding:
  - Kanban drag-drop
  - Client detail with 5 tabs (Overview, Sequences, Checklist, Files, Automation log)
  - Approve/regenerate copy
  - Retry failed steps
```

### Auth Flow
- `@supabase/ssr` SSR client with cookie-based sessions
- `middleware.ts` rate-limits + refreshes session + caches `workspace_id` cookie
- Admin routes require `role IN ('owner', 'admin')` in `users` table
- Public routes: `/login`, `/signup`, `/welcome`, `/onboarding`, `/client-onboarding`, webhooks, crons

---

## Environment Variables (40+)

Documented in `.env.example` (8044 bytes). Major categories:
- Supabase (URL, anon key, service role)
- AI (Anthropic, OpenAI, Gemini, FAL)
- Data enrichment (Clay, BuiltWith, AudienceLab, Firecrawl, Tavily)
- Email (Resend, EmailBison)
- Payments (Stripe)
- Background jobs (Inngest event/signing keys)
- Integrations (GHL, Autonoma)
- Monitoring (Sentry, PostHog)
- Security (CRON_SECRET, AUTOMATION_SECRET, webhook secrets)

---

## Baseline State (at start of Phase 0)

### Build
- Fresh build pending (still in progress at time of notes; pre-existing build passes on Vercel at commit `24333ffe`)

### Lint (`pnpm lint`)
- **20 warnings, 0 errors** across 9 files
- Warnings fall into buckets:
  - `no-console` (13): pre-existing `console.log` in `lib/dev/logger.ts`, `lib/monitoring/logger.ts`, `lib/utils/log-sanitizer.ts`
  - `no-unused-vars` (5): `PackageSlug` in onboarding-wizard types, `AccountTokenRow`, `markNeedsReconnect`, `CopyResearch`, `limitPerMinute`
  - `no-head-element` (1): `lib/email/templates.tsx` uses raw `<head>` instead of `next/head`
  - `no-console` in `lib/services/onboarding/crm-sync.ts` (1): was already fixed — `console.warn`

### Typecheck (`pnpm typecheck`)
- **0 real errors**; 6 TS6053 errors all from stale `.next/types/**/*.ts` files (cache artifacts from a prior incremental build). Running `rm -rf .next && pnpm typecheck` clears these.

### Tests (`pnpm test`)
- **1,303 pass, 4 fail, 49 skipped** across 58 test files
- All 4 failures in **`src/components/ui/__tests__/toast.test.tsx`**: test expects CSS class `bg-info-muted` but component renders `bg-blue-50` (tests out of sync with component refactor)

---

## Notable Architecture Patterns Observed

1. **Repository pattern**: Every table accessed through a dedicated class in `lib/repositories/` — clean separation, easy to mock
2. **Inngest for orchestration**: 90 typed background functions, registered in `src/app/api/inngest/route.ts` via a single serve() call
3. **Service role vs anon client**: Public routes use `createAdminClient()` (bypasses RLS); authenticated routes use cookie-based server client
4. **Event registry in `src/inngest/client.ts`**: All Inngest events typed via `EventSchemas().fromRecord<Events>()`
5. **RLS hardening**: Anon INSERT on `onboarding_clients` enforces safe default values (status, flags) via column-level `WITH CHECK`
6. **Admin nav is collapsible sidebar** (not top nav): `src/app/admin/_components/AdminNav.tsx`
7. **Middleware does heavy lifting**: rate limiting, session refresh, workspace resolution, ref-cookie capture, route classification
8. **Middleware skips `/api/webhooks`, `/api/cron`, `/api/inngest`** — service-to-service routes don't need auth middleware
9. **Sentry wraps `next.config.js`** for auto-instrumentation

---

## Third-Party Integrations

Inbound webhooks: Stripe, EmailBison (opens/clicks/replies), AudienceLab (identified visitors), GHL.
Outbound APIs: Anthropic, OpenAI, Clay, BuiltWith, EmailBison, GHL, HubSpot, Salesforce, ScaledMail, Twilio, Resend.

---

## Critical Runtime Dependencies

- **Supabase**: all DB, auth, and file storage
- **Inngest**: all background jobs (no fallback if Inngest is down)
- **Anthropic**: onboarding enrichment, copy gen, copilot chat
- **Stripe**: payments, subscriptions, Stripe Connect for partner payouts
- **Resend**: all transactional email (notifications, confirmations, drips)
- **Vercel**: hosting + cron scheduler
- **Sentry**: error tracking (non-blocking)

---

## What This Hardening Pass Will Target

Based on the baseline, the top-priority areas are:

| Area | Gap |
|------|-----|
| Lint warnings | 20 warnings in 9 files — clean up to 0 |
| Test failures | 4 broken toast tests — fix component/test alignment |
| Dead code | Unused imports (`CopyResearch`, `PackageSlug`, etc.) |
| Accessibility | TagInput, FileUpload missing ARIA roles |
| Loading states | Admin kanban and sequence review need skeletons |
| Error handling | Inline banners instead of `alert()` (already done in client-onboarding but check admin) |
| Performance | Admin kanban fetches all clients — no pagination |
| DX | Missing `ARCHITECTURE.md` (this doc fills it), inline docs for services |
| Security | Double-check RLS on `onboarding_clients` + storage bucket config |
| Polish | Toast system (sonner already installed but unused), copy-to-clipboard on IDs, confirmation modals on destructive admin actions |

These become the scoped work for Phases 1–7.
