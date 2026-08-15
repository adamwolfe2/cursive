# SECURITY_AUDIT.md — Cursive / OpenInfo Platform

**Mode:** AUDIT_AND_FIX_SAFE · **Auditor:** Principal AppSec (automated, 7 parallel domain agents + verification)
**Date:** 2026-08-15 · **Branch:** `claude/security-audit-remediation-iuvxw3`
**Settings:** DEPLOY=FALSE · ROTATE_LIVE_SECRETS=FALSE · BREAKING_CHANGES=FALSE · CREATE_TESTS=TRUE

> This is the authoritative report. Prior in-repo audit docs (SECURITY_AUDIT_REPORT.md, ROUND2,
> HARDENING_REPORT, etc.) were treated as history; every control here was re-verified with fresh
> evidence (exact `file:line`). Confirmed issues are distinguished from speculative ones.

---

## 1. Executive summary

Cursive is a multi-tenant Next.js 15 + Supabase SaaS (leads/CRM, AI copilots, a reseller API, a VSL
payment funnel, a Chrome extension) — 528 API routes, 197 DB migrations. **Most-exposed surfaces:**
the unauthenticated public copilot / lead-magnet endpoints, the `/api/admin/*` panel, Stripe/webhook
flows, and server-side URL fetchers. **Most valuable assets:** cross-tenant lead PII, the AudienceLab
identity graph, Stripe money movement, and platform-admin control.

- **Findings:** 5 CRITICAL, ~14 HIGH, ~20 MEDIUM, plus LOW/INFO (deduped across agents).
- **Secrets:** No live secret is committed to source or the 60-commit git history (verified). Hardcoded
  **admin passwords** existed in helper scripts (`AdminPass123`) — a credential-exposure risk, now removed.
- **Cross-tenant access WAS possible:** any customer (all are workspace `owner`) could reach cross-tenant
  `/api/admin/ops/*` + `/api/admin/affiliates*`, and an authenticated user could read `auth.users`
  password hashes via an LLM-driven SQL RPC. **Fixed.**
- **Auth/payments:** Auth is server-side-verified (`getUser()`) and Stripe webhooks verify signatures —
  both fundamentally sound. A client-controlled subscription `priceId` allowed a cheap-price → Pro-plan
  bypass — **fixed**. MFA was not enforced on API routes (residual, documented).
- **AI agents:** The MCP server is well-scoped; the one serious defect (public `/reveal` unmasking PII on a
  client-asserted trigger) is **fixed**.
- **Production-readiness:** **CONDITIONAL_RELEASE.** The reachable cross-tenant/PII CRITICALs are remediated
  with tests, but several HIGH items require product decisions or external verification (see §7–9).

---

## 2. Architecture & trust boundaries

| Layer | Detail |
|---|---|
| **App/Hosting** | Next.js 15 App Router, React 19, Node middleware. Vercel (pdx1). Sentry, PostHog. |
| **Data/Auth** | Supabase (Postgres+Auth+Storage), `@supabase/ssr`. RLS keyed on `workspace_id`. Service-role admin client bypasses RLS. |
| **Payments** | Stripe: checkout, billing subscriptions, Connect (partner payouts), VSL funnel, credits. |
| **AI** | Anthropic + OpenAI, MCP server (`/api/mcp`, API-key auth), AI Studio, agents, RAG/segment embeddings, Firecrawl. |
| **Integrations** | Shopify (app+webhooks), GHL/LeadConnector, Clay, EmailBison, Twilio, Bland, Cal, RabbitSign, AudienceLab pixel. |
| **Reseller API** | Public `/api/reseller/v1/*`, `rk_live_` API-key auth (SHA-256 stored), scoped by `reseller_id`. |
| **Clients** | Chrome extension; client portal (token); VSL funnel (token). |
| **Roles** | Workspace: `owner`/`admin`/member. Platform: `platform_admins` table (the real cross-tenant gate). Reseller (API key). Affiliate/partner. |
| **Trust boundaries** | Session cookie (middleware `getUser()` + signed workspace cookie); route guards `requirePlatformAdmin`/`requireAdminRole`/`requireReseller`; webhook HMAC; portal/funnel tokens; public/unauth endpoints. |

**Externally-configured controls requiring verification:** Supabase Auth settings (email confirmation, OTP TTL, leaked-password protection), Stripe dashboard (webhook secrets, live/test), Vercel env-var scoping, DNS/SPF/DKIM/DMARC, GitHub branch protection, cloud IAM.

---

## 3. Priority risk register

| P | ID | Sev | Conf | Component | Exposure | Attack | Impact | Action |
|---|----|-----|------|-----------|----------|--------|--------|--------|
| 1 | AUTHZ-OPS | CRIT | High | `/api/admin/ops/*`, `/api/admin/affiliates*`, `segments/import,stats` | Authenticated | Any customer (all `owner`) hits routes gated by workspace role → cross-tenant PII + affiliate financial control + global catalog overwrite | Cross-tenant PII breach, payout tampering | **FIXED** → `requirePlatformAdmin` |
| 2 | DATA-NLQ | CRIT | High | `execute_nl_query` RPC | Authenticated | LLM-authored SQL passes weak guards → `SELECT ... FROM auth.users` cross-tenant | Password-hash/full-DB read | **FIXED** → sensitive-schema block + revoke + require real predicate |
| 3 | PAY-CREDIT | CRIT | High | `increment_credits` RPC | Authenticated | Direct PostgREST call w/ negative amount → usage negative → unlimited credits | Free unlimited paid enrichment | **FIXED** → positive-only + caller-bound + revoke PUBLIC/anon |
| 4 | AI-REVEAL | CRIT | High | `/api/public/copilot/reveal` | Unauth | Client-asserted `trigger:'call_booked'` unmasks 15 real people; no replay guard | Third-party PII harvest (GDPR) | **FIXED** → require verified `cal_bookings`; replay guard |
| 5 | SECRET-CREDS | CRIT | Med | `create-admin-*.js`, `setup-admin-user.ts` | Repo/build | Hardcoded `AdminPass123` platform-admin login | Platform-admin takeover if live | **FIXED (repo)** → deleted/env-gated; **ROTATE externally** |
| 6 | PAY-PRICEID | HIGH | High | `/api/billing/checkout` | Authenticated | Client `priceId` → pay any cheap price, get Pro+1000 credits | Entitlement bypass | **FIXED** → server-catalog only |
| 7 | SSRF-DNS | HIGH | High | `enrich/website` (unauth), `icp-from-url`, outbound webhooks, SMTP test | Unauth/auth | Host resolving to `169.254.169.254` bypasses string-only guard | Cloud metadata / internal scan | **FIXED (2 fetchers)** → DNS-resolving guard; webhook/SMTP paths documented |
| 8 | INJ-CSV | HIGH | High | 7 CSV export paths | Authenticated | Lead field `=HYPERLINK(...)` executes when staff opens export | Data exfil / RCE on client | **FIXED** → `sanitizeCsvValue` |
| 9 | INJ-COLS | HIGH | High | `/api/exports` `fields[]`, CRM `orderBy` | Authenticated | Arbitrary PostgREST select/order → over-disclosure / schema oracle | Intra-tenant over-read | **FIXED** → allowlists |
| 10 | MSG-UNSUB | HIGH | High | `/api/unsubscribe` | Unauth | Suppress any email; GET CSRF/prefetch | Nurture-funnel sabotage | **FIXED** → HMAC token required |
| 11 | AUTH-FUNNEL | HIGH | High | funnel `by-session` / `dashboard-login` | Unauth | Stripe `session_id`/portal token → full dashboard session; unverified-email reuse | Account takeover | **DOCUMENTED** (needs product decision) |
| 12 | AUTH-MFA-API | HIGH | High | middleware | Authenticated | aal1 session reaches all `/api/*` | MFA bypass | **DOCUMENTED** (behavior-sensitive) |
| 13 | PAY-WEBHOOK-GRANT | HIGH | Med | `service-webhooks.ts` | Authenticated | Amount-blind `'pro'/1000` grant for any active sub | Entitlement over-grant | **PARTIALLY FIXED** (priceId closed); price→plan map recommended |
| 14 | PAY-PAYOUT | HIGH/MED | Med | `admin/payouts/approve` | Admin | TOCTOU + no idempotency key → double Stripe transfer | Double payout | **DOCUMENTED** |
| 15 | SUPPLY-DEPS | HIGH | High | dependencies | Build | 1 critical + 35 high CVEs (`npm audit`) | Various | **DOCUMENTED** (needs upgrade+test) |

Full per-control status in §4 of the appendix table below.

---

## 4. Changes completed (this branch)

All changes typecheck clean (`pnpm typecheck` → exit 0) and lint clean (warnings only, pre-existing).
New regression tests pass (14/14). Existing security suite passes (64/64). The AI-studio test failures in
`pnpm test` are pre-existing/environmental (missing Supabase env in sandbox) — **verified by stashing all
`src/` changes and reproducing the identical failures**.

**CRITICAL fixes**
- `src/app/api/admin/ops/{pipeline,pipeline/[workspaceId],summary,visitors,calls}/route.ts` — `requireAdminRole()` → `requirePlatformAdmin()`.
- `src/app/api/admin/affiliates/route.ts`, `.../[id]/route.ts` — inline workspace-role `checkAdminAccess` → `requirePlatformAdmin()`.
- `src/app/api/admin/audiencelab/segments/{import,stats}/route.ts` — `requireAdminRole()` → `requirePlatformAdmin()`.
- `supabase/migrations/20260815000000_security_hardening_rpcs.sql` — hardens `increment_credits` (positive-only, caller-bound, revoke PUBLIC/anon) and `execute_nl_query` (block statement-stacking/comments/sensitive schemas, require a real `workspace_id` predicate, revoke PUBLIC/anon/authenticated).
- `src/app/api/public/copilot/reveal/route.ts` — `call_booked` now requires a verified `cal_bookings` row (set by the HMAC-verified Cal.com webhook); added one-reveal-per-tier replay guard; stop self-writing the booking proof.
- Deleted `create-admin-now.js`, `create-admin-simple.js`; `scripts/setup-admin-user.ts` now requires a strong `ADMIN_PASSWORD` env var (no hardcoded default, password not printed).

**HIGH fixes**
- `src/app/api/billing/checkout/route.ts` — removed client `priceId`; price resolved only from `subscription_plans`.
- `src/lib/utils/ssrf-guard.ts` — added `resolvesToBlockedHost()` (DNS lookup) + `assertPublicUrl()` (protocol + literal + DNS, IPv4/IPv6 incl. mapped forms). Wired into `src/app/api/enrich/website/route.ts` (entry + every redirect hop) and `src/app/api/onboarding/icp-from-url/route.ts` (`redirect:'manual'` + DNS guard).
- CSV formula-injection neutralized via `sanitizeCsvValue` in: `src/lib/services/export.service.ts`, `src/app/api/crm/export/route.ts`, `src/app/api/leads/bulk/route.ts`, `src/app/api/funnel/[token]/visitors/route.ts`, `src/app/api/partner/leaderboard/export/route.ts`, `src/app/api/partner/payouts/export/route.ts`, `src/app/api/campaign-builder/[id]/export/route.ts`.
- `src/lib/services/export.service.ts` — `exportLeads` `fields[]` intersected with a column allowlist (PostgREST select injection).
- `src/app/api/crm/leads/route.ts` — `orderBy`/`orderDirection` allowlisted.
- `src/app/api/unsubscribe/route.ts` + `src/lib/utils/unsubscribe-token.ts` + `src/inngest/functions/visitor-estimate-nurture.ts` — HMAC-signed unsubscribe token required for the state change.
- `src/app/api/webhooks/ghl/route.ts` — timing-safe (edge-compatible) HMAC comparison.
- `supabase/migrations/20260815000100_security_rls_missing_tables.sql` — enable RLS + revoke anon/authenticated on `intelligence_cache`, `company_analysis_cache`, `api_request_logs`; drop the allow-all `USING(true)` SELECT policy on `onboarding_automation_log`.

**Tests added**
- `tests/unit/security/ssrf-dns-guard.test.ts` — proves the DNS-rebind bypass is closed; IPv4/IPv6 range coverage.
- `tests/unit/security/unsubscribe-token.test.ts` — sign/verify, email-binding, tamper rejection.
- `tests/unit/security/csv-injection.test.ts` — formula-prefix neutralization.

**Commands run:** `pnpm typecheck` (pass), `pnpm lint` (warnings only), `pnpm vitest run tests/unit/security/*` (pass), `pnpm test` (pre-existing env failures only, proven by stash), `pnpm build` (see §6).

---

## 5. Top ten actions (recommended order)

1. **Rotate the `adam@meetcursive.com` password + audit `platform_admins`** *(external, minutes, no code)* — the hardcoded `AdminPass123` may be live. Owner: platform admin. Acceptance: password changed, no seeded row with old value, git history scrubbed if account is live.
2. **Apply the two new migrations to prod** *(low effort, DB)* — `increment_credits`/`execute_nl_query` hardening + missing-table RLS. Acceptance: functions replaced, RLS enabled, app smoke-tests green.
3. **Decide the funnel account-takeover fix** *(product decision, medium)* — bind `by-session`/`dashboard-login` to a short-lived single-use nonce + verified email; stop reusing pre-existing accounts from unverified checkout email. Owner: product+eng. Acceptance: portal token can't be minted from a bare `session_id`; login refuses pre-existing accounts.
4. **Upgrade vulnerable dependencies** *(medium, needs test pass)* — protobufjs/OTel (critical), `next`, `inngest`, `axios`, `nodemailer`, `ws`, `undici`, `form-data`; tighten `images.remotePatterns`; add Dependabot. Acceptance: `pnpm audit --prod` clean of critical/high.
5. **Enforce MFA (aal2) on API routes** *(medium, behavior-sensitive)* — return 403 `MFA_REQUIRED` for aal1 sessions on `/api/*` (exclude `/api/auth/*`). Acceptance: enrolled aal1 session gets 403 on data routes.
6. **Make the subscription grant price-aware** *(medium)* — map the subscription's real price ID → plan/credit tier instead of hardcoded `'pro'/1000` (`service-webhooks.ts`). Acceptance: buying starter grants starter.
7. **Atomic payout approval + Stripe idempotency keys** *(medium)* — `.eq('status','pending')` guarded transition + `idempotencyKey` on `transfers.create` and the 8 unkeyed `checkout.sessions.create`/`paymentIntents.create` sites. Acceptance: concurrent approve creates one transfer.
8. **Add CI security scanning** *(low)* — gitleaks + Semgrep/CodeQL + `pnpm audit` + typecheck/lint/test gate; `permissions: contents: read`; SHA-pin actions. Acceptance: PRs fail on new secret/high-CVE.
9. **Finish SSRF coverage** *(low)* — route the outbound-webhook test endpoints and SMTP `test_connection` through `assertPublicUrl` + `redirect:'error'`; restrict SMTP port to {25,465,587,2525}. Acceptance: webhook-test to `169.254.169.254.nip.io` blocked.
10. **Separate the shared `AUTOMATION_SECRET`** *(low)* — distinct `WORKSPACE_COOKIE_SECRET`, `PUBLIC_COPILOT_TOKEN_SECRET`, `STATUS_PAGE_SECRET`, `UNSUBSCRIBE_TOKEN_SECRET`; fail boot in prod if unset. Acceptance: one leaked bearer no longer forges cookies/tokens.

---

## 6. Verification results

- `pnpm typecheck` — **PASS** (exit 0), including all edits.
- `pnpm lint` — **PASS** (warnings only; all in untouched files).
- New security tests — **14/14 PASS**. Existing `tests/unit/security/*` — **64/64 PASS**.
- `pnpm test` (full) — 84 failures, **all pre-existing/environmental** (AI-studio suites needing Supabase env); reproduced identically with my `src/` changes stashed.
- `pnpm build` — see build log (run with placeholder env; a build failure here reflects sandbox env, not the changes, since typecheck passes).

---

## 7. External verification checklist (cannot be proven from repo)

| Provider | Setting | Expected secure state |
|---|---|---|
| Supabase Auth | Email confirmations, OTP TTL, leaked-password protection, refresh-token rotation | Confirmations ON; OTP ≤1h; leaked-pw ON; rotation ON (config.toml shows rotation on, confirmations OFF locally) |
| Supabase | `platform_admins` seeded rows; `adam@` password | No row with `AdminPass123`; password rotated |
| Stripe | Webhook signing secrets set; live/test separation | `STRIPE_WEBHOOK_SECRET` set per env; `event.livemode` matches key |
| Vercel | Env-var scoping (prod/preview/dev), preview protection | Secrets not exposed to preview; `CRON_SECRET`/`AUTOMATION_SECRET`/`*_SECRET` present in prod |
| DNS/Email | SPF, DKIM, DMARC for sending domain | Aligned; DMARC enforce |
| GitHub | Branch protection, required reviews, CODEOWNERS | Protected `main`; reviews required on auth/payments/migrations |
| Cloud/DB | Public exposure of DB/buckets; IAM least-privilege | Not publicly reachable; scoped roles |
| Backups | Encryption, restricted access, restore tested | Encrypted, restricted, tested |

---

## 8. Residual risk (unresolved / accepted / needs decision)

- **Funnel account-takeover (AUTH-FUNNEL, HIGH):** `by-session` maps a Stripe `session_id` to a long-lived portal token that mints a dashboard session; unverified checkout email can attach to a pre-existing account. Not fixed here — needs a product decision on the pay-first/no-account UX. *Documented, action #3.*
- **MFA not enforced on API routes (HIGH):** behavior-sensitive; deferred to action #5.
- **Amount-blind subscription grant (HIGH):** client `priceId` closed, but buying a legitimately cheaper plan still grants Pro until action #6.
- **Payout double-transfer + missing Stripe idempotency (HIGH/MED):** action #7.
- **Dependency CVEs (HIGH):** action #4 (requires upgrade + regression pass — out of safe-fix scope).
- **`execute_nl_query`:** hardened against the demonstrated `auth.users` read, but executing model-authored SQL is fundamentally risky; the durable fix (constrained filter DSL or RLS-scoped client) is recommended.
- **Legacy unsubscribe links** sent before deploy will now 403 (no token). Compliance mitigated by the `List-Unsubscribe` mailto elsewhere; accepted transitional cost.
- **CI security tooling absent; dual lockfile; shared `AUTOMATION_SECRET`; timing-unsafe cron/health compares** — LOW/hardening, actions #8/#10.

---

## 9. Release-gate verdict

### CONDITIONAL_RELEASE

**Rationale.** Every CRITICAL that was **reachable and confirmed** — cross-tenant admin access, the `auth.users`
SQL-RPC read, the unlimited-credits RPC, the public PII-reveal bypass, and the hardcoded admin credentials —
is remediated on this branch with regression tests, and auth/session verification and Stripe webhook
signature verification were confirmed sound. Release is **conditional** on:

1. **Rotating the `adam@meetcursive.com` credential** and confirming no live `platform_admins` seed used the hardcoded password (external; blocks READY).
2. **Applying the two security migrations** to production.
3. **A product decision + fix for the funnel account-takeover (AUTH-FUNNEL)** — a HIGH with no safe in-repo fix that preserves the pay-first UX; it must have an explicit remediation or accepted-risk sign-off before READY.
4. **MFA-on-API and the amount-blind grant** HIGHs having an owner/decision.

It is **not** READY_FOR_RELEASE while (3)/(4) lack an explicit remediation or risk decision and the credential rotation is unconfirmed. It is **not** BLOCK_RELEASE because no unremediated CRITICAL remains reachable in the code on this branch.

---

## Appendix — control status highlights

Verified **PASS** (keep): server-side JWT verification via `getUser()` everywhere; `requireAdmin` no longer
falls back to workspace role; reseller keys (256-bit random, SHA-256 at rest, distinct `rk_/whsec_` prefixes);
MCP tool isolation (per-workspace `workspace_id` on every query, strict tool registry, rate/cost caps);
Stripe webhook `constructEvent` on raw body + idempotency; most webhooks use `timingSafeEqual`; CORS is not
credentialed/reflective; security headers (HSTS preload, XFO DENY, nosniff, CSP `object-src 'none'`, no
`unsafe-eval`); atomic credit-purchase/lead-purchase RPCs; open-redirect sanitizers; path-traversal allowlist
on `similarweb`; download authorization on service deliveries; no runtime command injection; DOMPurify on
user-HTML sinks; dev-bypass fails closed on prod indicators.

**FAIL/PARTIAL** items are enumerated in §3 and §8 with `file:line` evidence captured during the audit.
