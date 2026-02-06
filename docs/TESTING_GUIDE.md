# Testing Guide
**Cursive Platform - Race Condition Test Suite**

Last Updated: 2026-02-05

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Test Suite Structure](#test-suite-structure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Understanding Test Results](#understanding-test-results)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

This test suite proves that the atomic payment functions deployed to production work correctly under real-world conditions, including:

- **Race Conditions:** 100+ users trying to buy the same lead simultaneously
- **Transaction Rollbacks:** Partial failures that require complete rollback
- **Webhook Idempotency:** Stripe retrying webhooks multiple times
- **Database Consistency:** No double-selling, negative balances, or orphaned records

### What We're Testing

#### 4 Critical Atomic Functions

1. `validate_and_lock_leads_for_purchase` - Prevents race conditions with SELECT FOR UPDATE
2. `complete_credit_lead_purchase` - Atomic credit deduction + lead marking + completion
3. `complete_stripe_lead_purchase` - Atomic Stripe purchase completion (idempotent)
4. `mark_leads_sold_bulk` - Bulk lead marking in single transaction

#### Critical Files Tested

- `src/app/api/marketplace/purchase/route.ts` - Lead purchase API
- `src/app/api/webhooks/stripe/route.ts` - Stripe webhook handler
- `src/lib/repositories/marketplace.repository.ts` - Marketplace data access
- `supabase/migrations/20260205000001_fix_payment_race_conditions.sql` - Database functions

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm package manager
- Supabase CLI (for local database)
- Access to test database

### Install Dependencies

```bash
pnpm install
```

### Run All Tests

```bash
pnpm test
```

### Run Specific Test Suites

```bash
# Critical flows (purchase flows with atomic functions)
pnpm test tests/flows/critical-flows.test.ts

# Concurrent purchase stress tests
pnpm test tests/stress/concurrent-purchases.test.ts

# Atomic rollback tests
pnpm test tests/integration/atomic-operations.test.ts

# Webhook idempotency tests
pnpm test tests/integration/webhook-idempotency.test.ts
```

### Run with Coverage

```bash
pnpm test:coverage
```

### Watch Mode

```bash
pnpm test:watch
```

---

## Test Suite Structure

```
tests/
├── flows/
│   └── critical-flows.test.ts          # Flow 1 & 2: Purchase flows
├── stress/
│   └── concurrent-purchases.test.ts    # 100+ concurrent purchase attempts
├── integration/
│   ├── atomic-operations.test.ts       # Transaction rollback tests
│   └── webhook-idempotency.test.ts     # Webhook replay protection
├── helpers/
│   └── api-test-utils.ts               # Test utilities and mocks
└── setup.ts                            # Global test setup
```

### Test Categories

| Category | Files | Purpose |
|----------|-------|---------|
| **Critical Flows** | `critical-flows.test.ts` | End-to-end purchase flows using atomic functions |
| **Stress Tests** | `concurrent-purchases.test.ts` | High concurrency race condition prevention |
| **Integration** | `atomic-operations.test.ts` | Transaction rollback and consistency |
| **Integration** | `webhook-idempotency.test.ts` | Webhook replay protection |

---

## Running Tests

### Standard Test Run

```bash
pnpm test
```

This runs all test suites in parallel using Vitest.

### Test a Specific File

```bash
pnpm test tests/stress/concurrent-purchases.test.ts
```

### Test with UI

```bash
pnpm test:ui
```

Opens an interactive UI to explore test results.

### Run E2E Tests

```bash
pnpm test:e2e
```

Runs Playwright end-to-end tests (separate from unit/integration tests).

---

## Test Coverage

### Generate Coverage Report

```bash
pnpm test:coverage
```

This generates an HTML report in `/coverage/index.html`.

### Coverage Goals

| File | Target | Status |
|------|--------|--------|
| `marketplace/purchase/route.ts` | 80%+ | ✅ |
| `webhooks/stripe/route.ts` | 80%+ | ✅ |
| `marketplace.repository.ts` | 80%+ | ✅ |

### View Coverage Report

```bash
open coverage/index.html
```

Or view the text summary in terminal:

```bash
pnpm test:coverage | grep -A 20 "Coverage summary"
```

### Coverage Thresholds

Configured in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    statements: 50,
    branches: 50,
    functions: 50,
    lines: 50,
  },
}
```

---

## Understanding Test Results

### Successful Test Output

```
✓ tests/flows/critical-flows.test.ts (7)
  ✓ Flow 1: Lead Purchase with Credits (4)
    ✓ should successfully purchase leads with credits
    ✓ should reject purchase with insufficient credits
    ✓ should reject duplicate purchase of same leads
    ✓ should handle idempotency correctly
  ✓ Flow 2: Lead Purchase with Stripe (3)
    ✓ should create Stripe checkout session for lead purchase
    ✓ should complete purchase on Stripe webhook
    ✓ should handle webhook signature verification

Test Files  1 passed (1)
     Tests  7 passed (7)
  Start at  10:23:45
  Duration  2.34s
```

### Stress Test Output

```
✓ tests/stress/concurrent-purchases.test.ts
  ✓ should allow only 1 of 100 concurrent purchases to succeed
    ✓ Concurrency 100: 1 success, 99 conflicts (99% conflict rate)
  ✓ should ensure sold_count is exactly 1 after concurrent attempts
    ✓ Lead abc-123 sold_count: 1 (expected: 1)
```

### Failed Test Output

```
✗ tests/integration/atomic-operations.test.ts
  ✗ should rollback credit deduction if lead marking fails
    AssertionError: expected 90 to be 100
    at /tests/integration/atomic-operations.test.ts:45:7

    Expected balance after rollback: 100
    Actual balance: 90

    This indicates the rollback did NOT occur!
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test:coverage
        env:
          SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Required Environment Variables

```bash
# Test Database (separate from production!)
SUPABASE_URL=https://test-project.supabase.co
SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key

# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Troubleshooting

### Common Issues

#### 1. Tests Timing Out

**Symptom:** Tests fail with "Test timeout" error

**Cause:** Database operations taking too long or tests waiting indefinitely

**Solution:**
```typescript
it('should complete purchase', async () => {
  // Increase timeout for this specific test
  expect(true).toBe(true)
}, 60000) // 60 second timeout
```

Or in `vitest.config.ts`:
```typescript
test: {
  testTimeout: 30000, // 30 seconds global
}
```

#### 2. Database Connection Errors

**Symptom:** `Failed to connect to Supabase` or `ECONNREFUSED`

**Cause:** Test database not running or wrong credentials

**Solution:**
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Test connection
curl $SUPABASE_URL/rest/v1/
```

#### 3. Mock Not Working

**Symptom:** Real API calls instead of mocked responses

**Cause:** Mock setup incorrect or not imported before test

**Solution:**
```typescript
// Mock BEFORE importing the module under test
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockClient),
}))

// THEN import
const { POST } = await import('@/app/api/marketplace/purchase/route')
```

#### 4. Flaky Concurrent Tests

**Symptom:** Stress tests pass sometimes but fail other times

**Cause:** Race conditions in test setup or database state

**Solution:**
```typescript
beforeEach(async () => {
  // Clean database state before each test
  await cleanupTestData()

  // Use unique IDs per test
  testLeadId = generateTestUuid()
})
```

#### 5. Coverage Lower Than Expected

**Symptom:** Coverage report shows < 80% on critical files

**Cause:** Missing test cases or untested error paths

**Solution:**
```bash
# View uncovered lines
pnpm test:coverage
open coverage/index.html

# Check specific file
open coverage/src/app/api/marketplace/purchase/route.ts.html
```

Add tests for:
- Error handling paths
- Edge cases (0 credits, invalid IDs)
- Different payment methods

---

## Best Practices

### 1. Isolate Tests

Each test should be independent and not rely on other tests:

```typescript
beforeEach(async () => {
  // Fresh state for each test
  testData = await setupTestData()
})

afterEach(async () => {
  // Clean up after each test
  await cleanupTestData()
})
```

### 2. Use Descriptive Test Names

```typescript
// ❌ Bad
it('works', () => { ... })

// ✅ Good
it('should allow only 1 of 100 concurrent purchases to succeed', () => { ... })
```

### 3. Test Both Success and Failure

```typescript
describe('Purchase Flow', () => {
  it('should succeed with valid inputs', () => { ... })
  it('should fail with insufficient credits', () => { ... })
  it('should fail with invalid lead ID', () => { ... })
})
```

### 4. Mock External Services

```typescript
vi.mock('@/lib/stripe/client', () => ({
  getStripeClient: vi.fn(() => mockStripe),
}))

// Don't make real Stripe API calls in tests!
```

### 5. Assert Specific Values

```typescript
// ❌ Bad
expect(data).toBeTruthy()

// ✅ Good
expect(data.purchase.status).toBe('completed')
expect(data.creditsRemaining).toBe(50)
expect(data.leads).toHaveLength(2)
```

---

## Performance Benchmarks

Expected test execution times:

| Test Suite | Tests | Expected Time |
|------------|-------|---------------|
| critical-flows | 7 | < 5s |
| concurrent-purchases | 7 | < 30s |
| atomic-operations | 8 | < 15s |
| webhook-idempotency | 6 | < 15s |
| **Total** | **28** | **< 65s** |

If tests are slower than expected:
1. Check database performance
2. Reduce concurrency levels in stress tests
3. Use transaction rollback instead of delete for cleanup

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Stripe Webhook Testing](https://stripe.com/docs/webhooks/test)

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check test output for specific error messages
2. Review the test file source code for comments
3. Run tests with `--reporter=verbose` for detailed output
4. Check Supabase logs for database errors

---

## Summary

This test suite provides **confidence** that our atomic payment functions work correctly under real-world conditions:

- ✅ Only 1 concurrent purchase succeeds (no race conditions)
- ✅ Transactions rollback on failure (no partial state)
- ✅ Webhooks are idempotent (no duplicate processing)
- ✅ Database stays consistent (no double-selling)

**Run tests before deploying payment changes!**

```bash
pnpm test:coverage
```
