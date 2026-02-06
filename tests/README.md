# Test Suite
**Cursive Platform - Atomic Payment Functions**

This directory contains comprehensive tests for the atomic payment functions that prevent race conditions in the marketplace purchase flow.

---

## Quick Start

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

---

## Test Directory Structure

```
tests/
├── flows/                              # Critical user flow tests
│   └── critical-flows.test.ts          # Purchase flows with atomic functions
├── stress/                             # Stress and concurrency tests
│   └── concurrent-purchases.test.ts    # 100+ concurrent purchase attempts
├── integration/                        # Integration tests
│   ├── atomic-operations.test.ts       # Transaction rollback tests
│   └── webhook-idempotency.test.ts     # Webhook replay protection
├── helpers/                            # Test utilities
│   └── api-test-utils.ts               # Mocks, factories, helpers
├── utils/                              # Additional utilities
│   └── mocks.ts                        # Reusable mock objects
├── setup.ts                            # Global test setup
└── README.md                           # This file
```

---

## Test Categories

### 1. Critical Flows (`flows/`)

Tests end-to-end purchase flows using atomic database functions:

- ✅ Credit purchase with atomic completion
- ✅ Stripe purchase with webhook handling
- ✅ Idempotency key handling
- ✅ Error scenarios and rollbacks

**Run:**
```bash
pnpm test tests/flows/critical-flows.test.ts
```

### 2. Stress Tests (`stress/`)

Tests system behavior under high concurrency:

- ✅ 100+ concurrent purchase attempts
- ✅ Race condition prevention
- ✅ Database consistency verification
- ✅ Performance metrics

**Run:**
```bash
pnpm test tests/stress/concurrent-purchases.test.ts
```

### 3. Integration Tests (`integration/`)

Tests database transaction behavior and webhook processing:

- ✅ Atomic transaction rollbacks
- ✅ Webhook idempotency
- ✅ Database consistency
- ✅ Error recovery

**Run:**
```bash
pnpm test tests/integration/
```

---

## What We Test

### 4 Atomic Database Functions

1. **validate_and_lock_leads_for_purchase**
   - Uses SELECT FOR UPDATE to prevent race conditions
   - Tested with 10-200 concurrent attempts
   - Location: `supabase/migrations/20260205000001_fix_payment_race_conditions.sql`

2. **complete_credit_lead_purchase**
   - Atomic credit deduction + lead marking + completion
   - All-or-nothing transaction behavior
   - Tested with rollback scenarios

3. **complete_stripe_lead_purchase**
   - Idempotent webhook processing
   - Prevents duplicate processing
   - Tested with 5+ duplicate webhooks

4. **mark_leads_sold_bulk**
   - Bulk lead marking in single transaction
   - Replaces loop-based marking
   - Tested with multiple leads

---

## Test Statistics

| Category | Files | Tests | Duration |
|----------|-------|-------|----------|
| Critical Flows | 1 | 7 | < 5s |
| Stress Tests | 1 | 7 | < 30s |
| Integration | 2 | 14 | < 30s |
| **Total** | **4** | **28** | **< 65s** |

---

## Running Specific Tests

### All Tests
```bash
pnpm test
```

### Specific File
```bash
pnpm test tests/flows/critical-flows.test.ts
```

### Specific Test
```bash
pnpm test tests/flows/critical-flows.test.ts -t "should successfully purchase leads"
```

### With Coverage
```bash
pnpm test:coverage
```

### Watch Mode
```bash
pnpm test:watch
```

---

## Test Helpers

### Mock Factories

```typescript
import { createMockUser, createMockWorkspace, generateTestUuid } from './helpers/api-test-utils'

const user = createMockUser({ id: 'user-1', workspace_id: 'workspace-1' })
const workspace = createMockWorkspace({ id: 'workspace-1', name: 'Test Workspace' })
const leadId = generateTestUuid()
```

### Supabase Mocking

```typescript
import { createMockSupabase } from './helpers/api-test-utils'

const mockSupabase = createMockSupabase()

// Configure mock responses
mockSupabase._mocks.single.mockResolvedValueOnce({
  data: { id: 'purchase-1', status: 'completed' },
  error: null,
})
```

---

## Common Test Patterns

### Testing Atomic Functions

```typescript
it('should complete atomically or rollback', async () => {
  const adminClient = createAdminClient()

  const { data: result, error } = await adminClient.rpc(
    'complete_credit_lead_purchase',
    {
      p_purchase_id: purchaseId,
      p_workspace_id: workspaceId,
      p_credit_amount: 10,
    }
  )

  expect(result[0].success).toBe(true)
  expect(await getCredits(workspaceId)).toBe(90) // Started with 100
})
```

### Testing Concurrent Operations

```typescript
it('should prevent race conditions', async () => {
  const attempts = Array.from({ length: 100 }, (_, i) =>
    purchaseLead(leadId, `workspace-${i}`)
  )

  const results = await Promise.allSettled(attempts)
  const successes = results.filter(r => r.status === 'fulfilled')

  expect(successes).toHaveLength(1) // Only 1 succeeds
  expect(lead.sold_count).toBe(1) // Sold exactly once
})
```

### Testing Idempotency

```typescript
it('should handle duplicate webhooks', async () => {
  for (let i = 0; i < 5; i++) {
    await processWebhook(sameEventId)
  }

  expect(purchase.status).toBe('completed')
  expect(lead.sold_count).toBe(1) // Not 5!
})
```

---

## Coverage Goals

| File | Target | Status |
|------|--------|--------|
| `marketplace/purchase/route.ts` | 80%+ | ⏳ To be measured |
| `webhooks/stripe/route.ts` | 80%+ | ⏳ To be measured |
| `marketplace.repository.ts` | 80%+ | ⏳ To be measured |

**Generate coverage:**
```bash
pnpm test:coverage
open coverage/index.html
```

---

## Documentation

Complete documentation available in `/docs`:

- **TESTING_GUIDE.md** - How to run and understand tests
- **TEST_COVERAGE_REPORT.md** - Coverage analysis and gaps
- **ATOMIC_PAYMENT_TESTS_SUMMARY.md** - Executive summary

---

## Troubleshooting

### Tests Failing

1. Check database connection:
   ```bash
   echo $SUPABASE_URL
   curl $SUPABASE_URL/rest/v1/
   ```

2. Clear test data:
   ```bash
   # Tests should clean up automatically, but if needed:
   pnpm test:cleanup
   ```

3. Run with verbose output:
   ```bash
   pnpm test --reporter=verbose
   ```

### Slow Tests

1. Reduce concurrency in stress tests
2. Check database performance
3. Use transaction rollback for cleanup

### Flaky Tests

1. Ensure unique test data (use `generateTestUuid()`)
2. Clean database state in `beforeEach`
3. Avoid timeouts with proper async/await

---

## Best Practices

### ✅ Do

- Use unique IDs per test (`generateTestUuid()`)
- Clean up in `beforeEach` and `afterEach`
- Test both success and failure paths
- Use descriptive test names
- Mock external services
- Assert specific values

### ❌ Don't

- Share state between tests
- Use real Stripe API
- Hard-code UUIDs or IDs
- Skip cleanup
- Make tests dependent on order
- Use vague assertions (`toBeTruthy()`)

---

## Adding New Tests

### 1. Create Test File

```typescript
// tests/integration/new-feature.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createAdminClient } from '@/lib/supabase/admin'

describe('New Feature', () => {
  beforeEach(async () => {
    // Setup
  })

  it('should do something', async () => {
    // Test implementation
  })
})
```

### 2. Run Your Test

```bash
pnpm test tests/integration/new-feature.test.ts
```

### 3. Check Coverage

```bash
pnpm test:coverage
```

---

## CI/CD

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request
- Before deployment

See `.github/workflows/test.yml` for configuration.

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Supabase Testing](https://supabase.com/docs/guides/testing)
- [TESTING_GUIDE.md](../docs/TESTING_GUIDE.md)

---

**Ready to test? Run `pnpm test`**
