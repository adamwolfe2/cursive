# Release Checklist

This document provides the complete checklist for validating and releasing the Lead Marketplace feature branch.

## Quick Validation

Run the full validation pipeline with a single command:

```bash
./scripts/validate.sh
```

This runs:
1. TypeScript compilation check
2. ESLint linting
3. Unit tests (391 tests)
4. Production build
5. Migration file validation
6. Environment variables check
7. Security check for hardcoded secrets

Expected output: `ALL CHECKS PASSED!`

## Manual Validation Steps

If you need to run steps individually:

### 1. TypeScript Compilation
```bash
pnpm typecheck
```
Expected: No errors

### 2. Linting
```bash
pnpm lint
```
Expected: No errors or warnings

### 3. Tests
```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test suites
pnpm test src/__tests__/unit/
pnpm test src/__tests__/integration/
pnpm test src/__tests__/security/
```
Expected: 391 tests passing

### 4. Production Build
```bash
pnpm build
```
Expected: Build completes without errors

## Test Suite Breakdown

| Suite | Tests | Description |
|-------|-------|-------------|
| Unit - Deduplication | 22 | Hash calculation, canonicalization |
| Unit - Pricing | 30 | Marketplace pricing formula |
| Unit - Scoring | 35 | Intent and freshness scoring |
| Unit - Commission | 30 | Partner commission calculations |
| Unit - Toast | 14 | Toast notification component |
| Unit - Design System | 32 | Utility functions |
| Unit - Button | 22 | Button component |
| Unit - Card | 17 | Card component |
| Integration - Deduplication | 10 | Scale testing |
| Integration - Payout | 15 | Payout flow lifecycle |
| Integration - Webhook | 12 | Webhook idempotency |
| Security - Partner Invisibility | 12 | Data boundary enforcement |

## Flaky Test Resolution

### Previous Issue: Toast Component Tests

**Root Cause:** The Toast component uses `requestAnimationFrame` for progress bar animation. Vitest's fake timers don't advance RAF by default, causing tests to timeout.

**Resolution:**
- Added global RAF mock in `tests/setup.ts` that converts RAF calls to setTimeout
- Tests now use `act()` wrapper when advancing timers
- Verified deterministic with 10 consecutive runs

**File:** `tests/setup.ts:85-111`
```typescript
// Mock requestAnimationFrame to use setTimeout so fake timers work
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn((callback: FrameRequestCallback): number => {
    // Convert to setTimeout for fake timer compatibility
    ...
  }),
})
```

### Test Stability Verification

To verify tests are not flaky, run them multiple times:

```bash
for i in {1..10}; do
  echo "Run $i"
  pnpm test 2>&1 | grep -E "passed|failed"
done
```

Expected: All 10 runs show `391 passed`

## Pre-Merge Security Checklist

- [ ] No hardcoded API keys or secrets
- [ ] RLS policies active on all marketplace tables
- [ ] Partner data invisible to buyers
- [ ] Buyer identity invisible to partners
- [ ] Webhook idempotency in place
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints

## Database Migrations

New migrations added in this branch:

| Migration | Purpose |
|-----------|---------|
| `20260128100000_lead_marketplace_schema.sql` | Core marketplace schema |
| `20260128110000_fix_freshness_floor.sql` | Freshness floor of 15 |
| `20260128120000_payout_enhancements.sql` | Payout tracking fields |
| `20260128130000_webhook_idempotency.sql` | Webhook event tracking |
| `20260128140000_rate_limiting.sql` | Token bucket rate limiting |
| `20260128150000_upload_scalability.sql` | Large upload support |

Apply migrations:
```bash
# If using Supabase CLI
supabase db push

# Or manually via SQL
psql $DATABASE_URL -f supabase/migrations/20260128*.sql
```

## Environment Variables

Required variables (must be in `.env`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CONNECT_CLIENT_ID=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Email Verification
MILLIONVERIFIER_API_KEY=
```

## Post-Merge Verification

After merging to main:

1. **Verify deployment**
   - Check Vercel/deployment logs
   - Confirm build succeeds

2. **Verify Inngest**
   - Check Inngest dashboard for job registration
   - Verify cron schedules active

3. **Verify Stripe webhooks**
   - Check webhook endpoint configured
   - Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

4. **Smoke test**
   - Upload a test CSV via partner portal
   - Browse marketplace as buyer
   - Complete a test purchase
   - Verify commission recorded

## Rollback Plan

If issues are detected post-merge:

1. **Revert commit**
   ```bash
   git revert <merge-commit-sha>
   git push
   ```

2. **Database rollback** (if needed)
   - Migrations are additive and backward-compatible
   - No rollback SQL required for this release

3. **Feature flag** (optional)
   - Set `ENABLE_MARKETPLACE=false` in environment
   - Marketplace routes will return 503

## Support

For issues during release:
- Check `/docs/JOBS_RUNBOOK.md` for background job issues
- Check `/docs/MONEY_IDEMPOTENCY.md` for payment issues
- Check `/docs/UPLOAD_PIPELINE.md` for upload issues
