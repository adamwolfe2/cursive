# Testing Documentation

**Generated**: 2026-01-28
**Scope**: Lead Marketplace Testing Suite

---

## 1. Overview

The testing suite covers the critical business logic and integration points of the two-sided lead marketplace.

### Test Categories

| Category | Purpose | Location |
|----------|---------|----------|
| Unit Tests | Core business logic | `src/__tests__/unit/` |
| Integration Tests | Cross-component flows | `src/__tests__/integration/` |
| Security Tests | Data boundary enforcement | `src/__tests__/security/` |

---

## 2. Running Tests

### All Tests
```bash
pnpm test
```

### Watch Mode (Development)
```bash
pnpm test -- --watch
```

### Coverage Report
```bash
pnpm test -- --coverage
```

### Specific Test File
```bash
pnpm test src/__tests__/unit/pricing.test.ts
```

### Specific Test Suite
```bash
pnpm test -- -t "Marketplace Pricing"
```

---

## 3. Unit Tests

### 3.1 Deduplication Tests

**File**: `src/__tests__/unit/deduplication.test.ts`

Tests the hash calculation for lead deduplication.

**Key Test Cases**:
- Email normalization (lowercase, trim, Gmail dot-blindness)
- Phone normalization (digits only, US +1 removal)
- Hash key calculation (canonical matching)
- Non-matching inputs (different people)
- Edge cases (null values, malformed inputs)

**Example**:
```typescript
// Same person, different formatting = same hash
const hash1 = calculateHashKey('John.Doe@Company.com', 'company.com', '(555) 123-4567')
const hash2 = calculateHashKey('john.doe@company.com', 'COMPANY.COM', '5551234567')
expect(hash1).toBe(hash2)
```

**Coverage Targets**:
- [x] Email case normalization
- [x] Gmail dot-blindness
- [x] Phone format normalization
- [x] Domain extraction from email
- [x] Hash uniqueness for different leads
- [x] Hash consistency for same lead

---

### 3.2 Pricing Tests

**File**: `src/__tests__/unit/pricing.test.ts`

Tests the marketplace pricing formula at boundary values.

**Formula**:
```
Price = BasePrice × IntentMultiplier × FreshnessMultiplier + PhoneBonus + VerificationBonus

Where:
- BasePrice = $0.05
- IntentMultiplier: 1x (cold <34), 1.5x (warm 34-66), 2.5x (hot 67+)
- FreshnessMultiplier: 0.5x (stale <30), 1x (30-79), 1.5x (fresh 80+)
- PhoneBonus = +$0.03 if has phone
- VerificationBonus = +$0.02 if status = 'valid' (NO modifier for catch_all)
```

**Boundary Test Cases**:

| Score | Boundary | Multiplier |
|-------|----------|------------|
| Intent 33 | Cold max | 1x |
| Intent 34 | Warm min | 1.5x |
| Intent 66 | Warm max | 1.5x |
| Intent 67 | Hot min | 2.5x |
| Freshness 29 | Stale max | 0.5x |
| Freshness 30 | Medium min | 1x |
| Freshness 79 | Medium max | 1x |
| Freshness 80 | Fresh min | 1.5x |

**Price Range**:
- Minimum: $0.025 (cold + stale)
- Maximum: $0.2375 (hot + fresh + phone + verified)

---

### 3.3 Scoring Tests

**File**: `src/__tests__/unit/scoring.test.ts`

Tests intent score and freshness score calculations.

**Intent Score Components** (Max 100):
| Component | Max Points | Test Cases |
|-----------|------------|------------|
| Seniority | 25 | c_suite(25), vp(20), director(15), manager(10), ic(5) |
| Company Size | 25 | 500+(25), 201-500(20), 51-200(15), 11-50(10), 1-10(5) |
| Email Quality | 15 | work+domain(15), work(10), personal(0), generic(-5), none(-10) |
| Phone | 20 | has(20), none(0) |
| Completeness | 15 | proportional to optional fields |

**Freshness Score**:
- Sigmoid decay function
- Midpoint at 30 days (~50 score)
- Floor at 15 (never below)
- Monotonically decreasing

---

### 3.4 Commission Tests

**File**: `src/__tests__/unit/commission.test.ts`

Tests commission calculation and referral math.

**Commission Structure**:
```
Base: 30%
+ Fresh Sale Bonus: +10% (if sold within 7 days)
+ Verification Bonus: +5% (if partner has 90%+ verification rate)
+ Volume Bonus: +5% (if partner has 500+ leads/month)
= Cap: 50% maximum
```

**Test Scenarios**:
- Base commission only
- Individual bonuses
- Combined bonuses
- Cap enforcement
- Edge cases (zero price, negative days)

**Referral Rewards**:

| Type | Milestone | Reward |
|------|-----------|--------|
| Buyer | Signup | 50 credits to referrer |
| Buyer | First Purchase | 200 credits referrer + 100 referee |
| Buyer | $500 Spend | 500 credits to referrer |
| Partner | 1K Verified Leads | $50 to referrer |
| Partner | $500 Commissions | $100 to referrer |
| Partner | $2000 Commissions | $250 to referrer |

---

## 4. Integration Tests

### 4.1 Deduplication at Scale

**File**: `src/__tests__/integration/deduplication-scale.test.ts`

Tests deduplication performance and accuracy with large datasets.

**Performance Benchmarks**:
- 10,000 hash calculations: < 1 second
- 100,000 rows (chunked): < 5 seconds
- Memory: consistent ~128 bytes per hash

**Test Cases**:
- Batch hash calculation performance
- Hash uniqueness verification
- Duplicate detection accuracy
- Cross-partner deduplication
- Collision resistance

---

### 4.2 Partner Payout Flow

**File**: `src/__tests__/integration/payout-flow.test.ts`

Tests the end-to-end payout process.

**Flow**:
```
Commission Created (pending_holdback)
    ↓ [7 days]
Commission Released (payable)
    ↓ [aggregation]
Payout Created (pending)
    ↓ [Stripe transfer]
Commission Marked Paid
```

**Test Cases**:
- Holdback period enforcement
- Status transitions
- Payout aggregation
- Minimum threshold ($25)
- Idempotency key generation
- Weekly job simulation
- Error handling

---

### 4.3 Webhook Idempotency

**File**: `src/__tests__/integration/webhook-idempotency.test.ts`

Tests Stripe webhook idempotency handling.

**Key Requirements**:
- Record event ID before processing
- Return 200 even on error (prevent Stripe retries)
- Detect duplicates by event ID
- Handle concurrent duplicates
- 30-day event retention

**Test Cases**:
- Event recording
- Duplicate detection
- Concurrent processing
- Different event types
- Purchase status verification
- Event cleanup

---

## 5. Security Tests

### 5.1 Partner Invisibility

**File**: `src/__tests__/security/partner-invisibility.test.ts`

Tests data boundary enforcement between buyers and partners.

**Forbidden Fields (Buyer Endpoints)**:
```typescript
const FORBIDDEN_BUYER_FIELDS = [
  'partner_id',
  'upload_batch_id',
  'partner_name',
  'partner_email',
  'file_name',
  'verification_response',
  'partner_commission',
  'commission_rate',
  'internal_score_breakdown',
]
```

**Forbidden Fields (Partner Endpoints)**:
```typescript
const FORBIDDEN_PARTNER_FIELDS = [
  'buyer_id',
  'buyer_email',
  'buyer_name',
  'buyer_company',
  'buyer_workspace_id',
]
```

**Test Cases**:
- No partner data in browse API
- No buyer data in partner dashboard
- Obfuscation functions work correctly
- RLS policy documentation

---

## 6. Test Utilities

### Custom Matchers

```typescript
// Check value is within range
expect(score).toBeWithinRange(45, 55)

// Check array contains object with properties
expect(results).toContainObject({ status: 'completed' })
```

### Mock Supabase Client

```typescript
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    })),
  })),
}))
```

### Time Mocking

```typescript
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-28T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})
```

---

## 7. Coverage Thresholds

Current thresholds in `vitest.config.ts`:

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

**Target Goals**:
- Phase 1: 50% (current)
- Phase 2: 70%
- Phase 3: 80%

---

## 8. CI/CD Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Pre-merge check

### GitHub Actions Workflow

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v2
    - run: pnpm install
    - run: pnpm test -- --coverage
    - uses: codecov/codecov-action@v3
```

---

## 9. Writing New Tests

### Test File Naming

- Unit tests: `src/__tests__/unit/{feature}.test.ts`
- Integration tests: `src/__tests__/integration/{flow}.test.ts`
- Security tests: `src/__tests__/security/{concern}.test.ts`

### Test Structure

```typescript
describe('Feature Name', () => {
  describe('Sub-feature', () => {
    it('should do expected behavior', () => {
      // Arrange
      const input = ...

      // Act
      const result = functionUnderTest(input)

      // Assert
      expect(result).toBe(expected)
    })
  })
})
```

### Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **One assertion per test when possible**
4. **Test edge cases and boundaries**
5. **Mock external dependencies**
6. **Avoid test interdependence**

---

## 10. Debugging Failed Tests

### Verbose Output
```bash
pnpm test -- --reporter=verbose
```

### Single Test
```bash
pnpm test -- -t "should calculate 30% base commission"
```

### Debug Mode
```bash
DEBUG=1 pnpm test -- --no-threads
```

### Check Coverage Gaps
```bash
pnpm test -- --coverage
# Open coverage/index.html in browser
```

---

## 11. Future Test Plans

### E2E Tests (Playwright)

- [ ] Buyer searches and filters leads
- [ ] Buyer purchases leads with credits
- [ ] Buyer purchases leads with Stripe
- [ ] Buyer downloads purchased leads
- [ ] Partner uploads CSV
- [ ] Partner views dashboard
- [ ] Partner initiates payout

### Performance Tests

- [ ] Upload 100k rows benchmark
- [ ] Marketplace browse under load
- [ ] Concurrent purchase handling

### Chaos Tests

- [ ] Network failure during upload
- [ ] Database timeout during purchase
- [ ] Stripe webhook retry scenarios

---

*End of Testing Documentation*
