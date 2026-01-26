# Known Issues

## Low Priority

### 1. Console.log Statements in Webhook Handlers
**Location**: `src/app/api/webhooks/emailbison/`
**Status**: Technical Debt
**Impact**: Low
**Description**: Webhook handlers contain console.log statements for debugging. These are useful during development and debugging webhook issues but should ideally be replaced with a proper logging service (e.g., Pino with structured logging).

**Files Affected**:
- `src/app/api/webhooks/emailbison/campaigns/route.ts`
- `src/app/api/webhooks/emailbison/[agentId]/route.ts`
- `src/app/api/webhooks/stripe/route.ts`

**Recommendation**: Implement a logging service with log levels and conditional debug output.

### 2. Hardcoded Email in Conversation Trigger
**Location**: `supabase/migrations/20260126000008_conversations.sql`
**Status**: Technical Debt
**Impact**: Low
**Description**: The `update_conversation_on_send()` trigger function hardcodes `'noreply@example.com'` as the sender email. This should be dynamic based on workspace configuration.

**Workaround**: The from_email is typically set correctly from the email_sends record.

### 3. Missing Rate Limiting Middleware
**Status**: Enhancement
**Impact**: Medium
**Description**: API routes don't have centralized rate limiting. Currently relies on Inngest throttling for background jobs.

**Recommendation**: Add rate limiting middleware using Vercel KV or similar.

## Medium Priority

### 4. TypeScript Errors in Auth Pages
**Status**: Known Issue
**Impact**: Low (pre-existing)
**Description**: Some auth-related pages may have TypeScript errors that predate the recent development phases. These don't affect functionality.

**Recommendation**: Address during next auth system update.

## Resolved Issues

### Fixed in Phase 29
- [x] Missing ON DELETE clauses on foreign keys (22 fixed)
- [x] Missing explicit FK constraints (8 added)

### Fixed in Phase 30
- [x] Manual validation in `/workspace/webhooks` (replaced with Zod)
- [x] Missing validation in `/partner/auth` (added Zod schema)

## Future Enhancements

### Proposed for Next Sprint
1. **Centralized Logging Service** - Replace console.logs with structured logging
2. **API Rate Limiting** - Add per-endpoint rate limits
3. **Email Preview** - Add email preview before sending
4. **Webhook Retry UI** - UI for managing failed webhook deliveries
5. **Bulk Email Approval** - Approve multiple emails at once

### Technical Debt Backlog
1. Convert remaining manual validations to Zod schemas
2. Add comprehensive E2E tests for campaign flow
3. Implement optimistic updates for all mutations
4. Add real-time updates via Supabase subscriptions
