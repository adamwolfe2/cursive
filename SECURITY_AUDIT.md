# SECURITY_AUDIT.md — Cursive / OpenInfo Platform

**Status:** IN PROGRESS
**Mode:** AUDIT_AND_FIX_SAFE
**Auditor:** Principal AppSec (automated)
**Started:** 2026-08-15
**Branch:** claude/security-audit-remediation-iuvxw3

> Working ledger. Findings, evidence, fixes, and tests are recorded as the audit proceeds.
> Prior audit docs in-repo (SECURITY_AUDIT_REPORT.md, ROUND2, HARDENING_REPORT, etc.) are treated
> as history, not verified truth — every control is re-checked with fresh evidence.

## Architecture (discovered)

- **Stack:** Next.js 15 (App Router), React 19, TypeScript, Node.js runtime middleware. pnpm.
- **Hosting:** Vercel (region pdx1). Sentry, PostHog, Vercel Analytics.
- **DB/Auth:** Supabase (Postgres + Auth + Storage). SSR `@supabase/ssr`. 197 migrations. RLS-based multi-tenant isolation keyed on `workspace_id`.
- **Payments:** Stripe (checkout, billing, connect, funnel VSL). Stripe webhooks.
- **AI:** Anthropic + OpenAI SDKs, MCP server (`/api/mcp`), AI Studio, agents, RAG/segments embeddings, Firecrawl.
- **Integrations:** Shopify (app + webhooks), GHL/LeadConnector, Clay, EmailBison, Twilio, Bland, Resend/Nodemailer, Cal, RabbitSign, AudienceLab/superpixel pixel.
- **Reseller API:** public `/api/reseller/v1/*` authenticated by API key (`rk_live_...`), separate from Supabase sessions.
- **Clients:** Chrome extension (`chrome-extension/`), client portal (token-based), VSL funnel (token-gated).
- **Scale:** 528 API route files, 2196 TS/TSX files.

## Tenancy & trust boundaries

- Middleware (`src/middleware.ts`) enforces session + coarse role gates + MFA + signed workspace cookie.
- Route-level guards: `requireAdmin`/`requirePlatformAdmin` (platform), `requireAdminRole` (workspace), `requireReseller` (API key), `requireAffiliate`/partner.
- Public/unauthenticated surfaces: affiliate apply/track, lead-capture, visitor-estimate, unsubscribe, pixel provision-demo, public segment-search, MCP (bearer), portal (token), funnel (token), reseller v1 (API key), webhooks, cron, inngest.

## Findings ledger

(Populated below as the audit proceeds.)
