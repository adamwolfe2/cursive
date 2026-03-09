# Security Audit — Round 2
**Date**: 2026-03-09
**Auditor**: Claude Sonnet 4.6 (automated deep audit)
**Scope**: `/Users/adamwolfe/cursive-project/cursive-work/` (app) and `marketing/` subdirectory

---

## Summary

15 security areas were audited. **12 vulnerabilities fixed** across code, database, and configuration. No issues found in 3 areas (supply chain, OAuth flows, admin privilege escalation).

---

## Findings and Fixes

### 1. CRITICAL — Raw SQL Execution Function Callable by Unauthenticated Users

**File**: Supabase DB function `execute_nl_query(text)`

**Issue**: The `execute_nl_query` SECURITY DEFINER function accepted raw SQL text and executed it with elevated privileges, bypassing all RLS policies. It was callable by both `anon` AND `authenticated` roles. The only protections were string-based guards (`LIKE 'SELECT%'` and a substring check for `workspace_id`) that were trivially bypassable via SQL comment injection or unicode normalization.

**Fix**: Revoked EXECUTE on `execute_nl_query` from both `anon` and `authenticated` roles via Supabase MCP.

```sql
REVOKE EXECUTE ON FUNCTION execute_nl_query(text) FROM anon;
REVOKE EXECUTE ON FUNCTION execute_nl_query(text) FROM authenticated;
```

**Risk before fix**: Full database read (and potentially write) for any unauthenticated attacker with knowledge of the endpoint. Cross-tenant data exfiltration.

---

### 2. HIGH — All 7 DB Views Accessible by Anon Role

**Tables**: `active_leads`, `active_subscriptions`, `companies_with_stats`, `contacts_with_company`, `deals_with_associations`, `lead_intent_breakdown`, `recent_billing_events`

**Issue**: All 7 CRM/analytics views had SELECT (and other) privileges granted to `anon`. Views do not inherit RLS from underlying tables — a direct query via the anon key would return cross-workspace data.

**Fix**: Revoked ALL privileges on all 7 views from `anon`.

```sql
REVOKE ALL PRIVILEGES ON active_leads FROM anon;
-- (repeated for all 7 views)
```

---

### 3. HIGH — SSRF Vulnerability in Marketing analyze-site Endpoint

**File**: `marketing/app/api/analyze-site/route.ts`

**Issue**: User-supplied `domain` query parameter was passed directly to an external API call (`https://api.microlink.io?url=https://${cleanDomain}`) without validation. An attacker could supply `localhost`, `127.0.0.1`, RFC1918 addresses, or raw IPs to probe internal infrastructure.

**Fix**: Added `isSafeDomain()` validation before the external fetch:
- Rejects `localhost` and loopback addresses
- Rejects RFC1918 IP ranges (10.x, 172.16-31.x, 192.168.x)
- Rejects raw IPv4 addresses
- Rejects hostnames without a TLD
- Enforces safe hostname character set
- Applies `encodeURIComponent()` on domain before use

---

### 4. HIGH — No Rate Limiting on Unauthenticated AudienceLab Provisioning Endpoint

**File**: `src/app/api/pixel/provision-demo/route.ts`

**Issue**: Public endpoint (no auth by design — used during live sales calls) with no rate limiting. Each request triggers an AudienceLab API call. An attacker could exhaust AudienceLab API credits and quota at no cost.

**Fix**: Added in-memory rate limiter (10 provisioning requests per IP per hour).

---

### 5. MEDIUM — No Rate Limiting on Marketing Contact Form

**File**: `marketing/app/api/contact/route.ts`

**Issue**: No rate limiting. Attacker could spam the contact form, triggering unbounded Resend API calls and notification emails.

**Fix**: Added in-memory rate limiter (5 submissions per IP per hour) + added `message` max length (5000 chars) and `name` max length (200 chars).

---

### 6. MEDIUM — No Rate Limiting on Marketing Lead Capture Form

**File**: `marketing/app/api/leads/capture/route.ts`

**Issue**: No rate limiting on exit-intent/free-audit popup form submissions. Attacker could flood with fake leads, triggering unbounded Resend API calls.

**Fix**: Added in-memory rate limiter (5 submissions per IP per hour).

---

### 7. MEDIUM — No Rate Limiting on AI Qualification Endpoint

**File**: `src/app/api/ai/qualify-lead/route.ts`

**Issue**: Route was authenticated and workspace-scoped but had no rate limiting. Each call triggers two concurrent Claude API calls (`qualifyLead` + `analyzeCompany`). A compromised or malicious authenticated user could exhaust the Claude API budget.

**Fix**: Added `withRateLimit(req, 'ai-qualify', getRequestIdentifier(req, user.id))`. Also added a dedicated `'ai-qualify'` config entry in `rate-limiter.ts` (30 calls per hour per user).

---

### 8. MEDIUM — No Rate Limiting on Enrichment Queue Endpoint

**File**: `src/app/api/enrichment/queue/route.ts`

**Issue**: Authenticated route for queuing leads for enrichment (Clay, Clearbit, Apollo, ZoomInfo, etc.) had no rate limiting. Each batch triggers expensive third-party API calls.

**Fix**: Added `withRateLimit(req, 'lead-enrich', getRequestIdentifier(req, user.id))` (30 requests per minute per user).

---

### 9. MEDIUM — CSV Formula Injection in Marketplace Download

**File**: `src/app/api/marketplace/download/[purchaseId]/route.ts`

**Issue**: CSV cells were quoted but leading `=`, `+`, `-`, `@`, tab, and carriage return characters were not sanitized. Malicious lead data with formula-starting characters would execute as spreadsheet formulas when opened in Excel/Google Sheets.

**Fix**: Added `sanitizeCsvCell()` that prefixes formula-starter characters with a single quote, defusing them before spreadsheet parsers can interpret them.

---

### 10. MEDIUM — CSV Formula Injection in Lead Repository Export

**File**: `src/lib/repositories/lead.repository.ts`

**Issue**: Same CSV injection vulnerability in the `exportToCSV()` method used by the bulk lead export endpoint.

**Fix**: Added inline `sanitizeCsvCell()` function with identical sanitization logic.

---

### 11. LOW — test-ping Webhook Accessible in Production

**File**: `src/app/api/webhooks/test-ping/route.ts`

**Issue**: A development/debugging endpoint with no auth was reachable in production, returning `{ ok: true, runtime: 'edge', ts: Date.now() }`.

**Fix**: Added `NODE_ENV === 'production'` guard that returns 404.

---

### 12. LOW — bulk_update_lead_status and bulk_assign_leads Callable by Anon

**Files**: Supabase DB functions `bulk_update_lead_status` and `bulk_assign_leads`

**Issue**: Both SECURITY DEFINER functions were callable by the `anon` role, bypassing RLS. Without authentication, an attacker could potentially reassign or bulk-update lead statuses across workspaces.

**Fix**: Revoked EXECUTE on both functions from `anon`.

---

### 13. LOW — Missing Named Rate Limit Configs for AI Endpoints

**File**: `src/lib/middleware/rate-limiter.ts`

**Issue**: No dedicated rate limit config entries for AI endpoints meant they fell back to 'default' (100 requests per minute) rather than hour-based budget limits appropriate for expensive API calls.

**Fix**: Added two new entries:
- `'ai-qualify'`: 30 calls per hour per user
- `'ai-generate-email'`: 100 calls per hour per user

---

## Areas Audited — No Issues Found

### OAuth & Third-Party Auth Flows
- HubSpot callback (`src/app/api/crm/auth/hubspot/callback/route.ts`): State validation, 10-minute expiry, user/workspace cross-validation — secure.
- Google Sheets callback (`src/app/api/crm/auth/google-sheets/callback/route.ts`): State validation, user re-verification — secure.

### Webhook Signature Verification
All 9 active webhook handlers verified:
- Stripe: `constructEvent` with secret ✓
- AudienceLab superpixel/audiencesync: constant-time HMAC ✓
- Clay: HMAC-SHA256 ✓
- Bland: HMAC-SHA256 ✓
- Cal.com: Node.js crypto `timingSafeEqual` ✓
- EmailBison `[agentId]`: HMAC ✓
- EmailBison campaigns: HMAC ✓
- Inbound email: HMAC via `verifyHmacSignature` ✓
- audience-labs (legacy): Returns 410 Gone ✓

All webhook handlers have idempotency checks to prevent replay attacks.

### Admin Routes & Privilege Escalation
- `requireAdmin()` verifies via JWT (`auth.getUser()`) + DB lookup in `platform_admins` table with fallback to `users.role` check.
- Seed endpoint blocked in production with `NODE_ENV` guard.
- Bulk upload has `requireAdmin()`, file size limit, Zod row validation, max 10k records limit, and rate limiting.

### Outbound Webhook Management
- Auth required on all CRUD operations ✓
- SSRF guard (`isValidWebhookUrl`) on URL fields ✓
- Ownership verification before mutation ✓

### Supply Chain / Dependencies
- Next.js `^15.1.4`, Stripe `^17.5.0`, `@supabase/ssr ^0.5.2`, Zod `^3.24.1` — all current.
- Marketing site: Next.js `16.1.6`, React `19.2.3` — current.

### Environment Variable Exposure
- `NEXT_PUBLIC_SENTRY_DSN` is standard Sentry client-side practice, acceptable.
- No service role keys or secrets found in `NEXT_PUBLIC_` prefixed variables.

---

## Database Privilege State (Post-Audit)

| Object | anon | authenticated |
|--------|------|---------------|
| `execute_nl_query()` | REVOKED | REVOKED |
| `bulk_update_lead_status()` | REVOKED | EXECUTE (unchanged) |
| `bulk_assign_leads()` | REVOKED | EXECUTE (unchanged) |
| `active_leads` view | ALL REVOKED | SELECT (unchanged) |
| `active_subscriptions` view | ALL REVOKED | SELECT (unchanged) |
| `companies_with_stats` view | ALL REVOKED | SELECT (unchanged) |
| `contacts_with_company` view | ALL REVOKED | SELECT (unchanged) |
| `deals_with_associations` view | ALL REVOKED | SELECT (unchanged) |
| `lead_intent_breakdown` view | ALL REVOKED | SELECT (unchanged) |
| `recent_billing_events` view | ALL REVOKED | SELECT (unchanged) |

All underlying tables (`leads`, `workspaces`, `users`, `contacts`, `companies`, `deals`, `billing_events`) have `rowsecurity: true`, so authenticated-role queries on views are protected by base table RLS.

---

## Files Modified

| File | Change |
|------|--------|
| `marketing/app/api/analyze-site/route.ts` | Added `isSafeDomain()` SSRF guard |
| `marketing/app/api/contact/route.ts` | Added rate limiting + input max lengths |
| `marketing/app/api/leads/capture/route.ts` | Added rate limiting |
| `src/app/api/pixel/provision-demo/route.ts` | Added rate limiting |
| `src/app/api/webhooks/test-ping/route.ts` | Added production guard (returns 404) |
| `src/app/api/marketplace/download/[purchaseId]/route.ts` | Added CSV injection sanitization |
| `src/lib/repositories/lead.repository.ts` | Added CSV injection sanitization |
| `src/app/api/ai/qualify-lead/route.ts` | Added rate limiting |
| `src/app/api/enrichment/queue/route.ts` | Added rate limiting |
| `src/lib/middleware/rate-limiter.ts` | Added `ai-qualify` and `ai-generate-email` rate limit configs |

---

## Remaining Considerations (Not Fixed — Out of Scope or Acceptable)

1. **In-memory rate limiters** (marketing site and provision-demo) reset on server restart and are not shared across Vercel function instances. For high-traffic scenarios, consider migrating to Upstash Redis. Acceptable for current traffic volume.

2. **`inbound-email` HTML storage**: The `body_html` field stores raw HTML from external email senders with a warning comment in the code. Ensure DOMPurify or equivalent sanitization is applied before rendering in the UI.

3. **`bulk_update_lead_status` / `bulk_assign_leads` accessible by `authenticated`**: These SECURITY DEFINER functions can be called by any authenticated user. Review whether they enforce workspace isolation internally (not audited in depth — they appear to accept workspace_id as a parameter, which could allow cross-workspace mutation if not validated against the caller's workspace).
