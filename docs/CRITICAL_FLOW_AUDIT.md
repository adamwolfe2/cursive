# Critical User Flow Audit Report
**Date:** 2026-02-05
**Platform:** Cursive Lead Marketplace
**Status:** 🟡 NEEDS ATTENTION

## Executive Summary

This audit examined all 5 critical user flows in the Cursive platform. The code is generally well-structured with good security practices, but several issues were identified that could affect user experience and data integrity.

### Overall Status
- ✅ **Working:** 3/5 flows (60%)
- 🟡 **Needs Testing:** 2/5 flows (40%)
- ❌ **Broken:** 0/5 flows (0%)

---

## Flow 1: Lead Purchase with Credits ✅

**Status:** WORKING with minor issues

### Files Reviewed
- `/src/app/api/marketplace/purchase/route.ts` (Lines 1-299)
- `/src/lib/repositories/marketplace.repository.ts`

### What Works
1. ✅ Authentication and workspace validation
2. ✅ Rate limiting (10 requests/minute)
3. ✅ Idempotency key handling to prevent duplicate purchases
4. ✅ Duplicate purchase prevention (checks existing purchases by workspace)
5. ✅ Credit balance verification
6. ✅ Commission calculation with bonuses
7. ✅ Purchase record creation
8. ✅ Email confirmation sending

### Issues Found

#### 🔴 CRITICAL: Race Condition in Credit Purchase
**Location:** Lines 173-250
**Severity:** HIGH

```typescript
// Lines 173-175: Check credits
const balance = credits?.balance || 0
if (balance < totalPrice) {
  return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
}

// Lines 244: Deduct credits (separate transaction)
await repo.deductCredits(userData.workspace_id, totalPrice)
```

**Problem:** Between checking the balance and deducting credits, another request could complete, leading to:
- Negative credit balances
- Overselling leads
- Lost revenue

**Impact:** Users could purchase more leads than they have credits for in concurrent requests

**Recommendation:** Use database-level atomic operations or SELECT FOR UPDATE

#### 🟡 MEDIUM: Non-Atomic Lead Marking
**Location:** Lines 247, Lines 329-335 in repository

```typescript
// Repository method loops through leads
async markLeadsSold(leadIds: string[]): Promise<void> {
  const adminClient = createAdminClient()
  for (const leadId of leadIds) {
    await adminClient.rpc('mark_lead_sold', { p_lead_id: leadId })
  }
}
```

**Problem:** If the process fails midway, some leads are marked sold while others aren't, but credits are already deducted

**Impact:** Data inconsistency, leads may be sold but not marked as sold

**Recommendation:** Wrap in a transaction or use a batch RPC call

#### 🟡 MEDIUM: Email Failure Doesn't Roll Back Purchase
**Location:** Lines 256-275

```typescript
try {
  await sendPurchaseConfirmationEmail(...)
} catch (emailError) {
  console.error('[Purchase] Failed to send confirmation email:', emailError)
  // Don't fail the purchase if email fails
}
```

**Problem:** Purchase completes successfully but user doesn't get confirmation email or download link

**Impact:** Poor user experience, support tickets

**Recommendation:** Queue email in background job instead, add retry mechanism

#### 🟢 MINOR: Magic Number for Download Expiry
**Location:** Line 259

```typescript
downloadExpiresAt.setDate(downloadExpiresAt.getDate() + 90) // 90 days from now
```

**Recommendation:** Extract to configuration constant

---

## Flow 2: Lead Purchase with Stripe ✅

**Status:** WORKING

### Files Reviewed
- `/src/app/api/marketplace/purchase/route.ts` (Lines 300-424)
- `/src/app/api/webhooks/stripe/route.ts`

### What Works
1. ✅ Stripe session creation with proper metadata
2. ✅ Pending purchase record created
3. ✅ Webhook signature verification
4. ✅ Proper event routing (credit vs lead purchases)
5. ✅ Leads marked sold on payment success
6. ✅ Email confirmation sent
7. ✅ Download URL generation

### Issues Found

#### 🟡 MEDIUM: No Webhook Retry Mechanism for Failed Lead Marking
**Location:** `/src/app/api/webhooks/stripe/route.ts` Lines 154-172

```typescript
const { data: purchaseItems, error: itemsError } = await adminClient
  .from('marketplace_purchase_items')
  .select('lead_id')
  .eq('purchase_id', purchase_id)

if (itemsError) {
  safeError('[Stripe Webhook] Failed to get purchase items', { error: itemsError.message })
  throw new Error(`Failed to get purchase items: ${itemsError.message}`)
}
```

**Problem:** If marking leads sold fails, webhook throws error but Stripe may not retry

**Impact:** User paid but leads not marked sold, manual intervention needed

**Recommendation:** Use Inngest or similar for webhook processing with retries

#### 🟢 MINOR: Hardcoded Stripe API Version
**Location:** `/src/app/api/webhooks/stripe/route.ts` Line 20

```typescript
apiVersion: '2024-12-18.acacia',
```

**Recommendation:** Move to environment variable

---

## Flow 3: Credit Purchase Flow ✅

**Status:** WORKING

### Files Reviewed
- `/src/app/api/marketplace/credits/purchase/route.ts`
- `/src/app/api/webhooks/stripe/route.ts` (Lines 65-129)

### What Works
1. ✅ Package validation prevents price tampering
2. ✅ Credit purchase record creation
3. ✅ Stripe checkout session creation
4. ✅ Webhook handles credit addition
5. ✅ Email confirmation sent
6. ✅ Balance updated correctly

### Issues Found

#### 🟢 MINOR: Rate Limiter Key Inconsistency
**Location:** Line 44-47

```typescript
const rateLimitResult = await withRateLimit(
  request,
  'marketplace-purchase',  // Same key as lead purchase
  `user:${user.id}`
)
```

**Problem:** Credit purchases share rate limit with lead purchases

**Impact:** User hitting lead purchase limit can't buy credits

**Recommendation:** Use separate rate limit key like `'credit-purchase'`

---

## Flow 4: Campaign Creation Flow 🟡

**Status:** NEEDS COMPREHENSIVE TESTING

### Files Reviewed
- `/src/app/api/campaigns/route.ts`

### What Works
1. ✅ Authentication and workspace validation
2. ✅ Tier feature gate (campaigns require paid plan)
3. ✅ Tier limit enforcement
4. ✅ Schema validation with Zod
5. ✅ Campaign record creation

### Issues Found

#### 🟡 MEDIUM: Incomplete Flow - No Lead Import/Email APIs Found
**Severity:** MEDIUM

**Problem:** The campaign creation API exists but subsequent steps are unclear:
- No clear API endpoint for importing leads into campaign
- No API endpoint for email composition
- No API endpoint for sending emails

**Files Expected but Not Found:**
- `/src/app/api/campaigns/[id]/leads/route.ts`
- `/src/app/api/campaigns/[id]/emails/compose/route.ts`
- `/src/app/api/campaigns/[id]/send/route.ts`

**Files That DO Exist:**
- `/src/app/api/campaigns/[id]/emails/[emailId]/route.ts` (individual email operations)
- `/src/app/api/campaigns/[id]/emails/approve/route.ts` (bulk approve)

**Recommendation:**
- Document the complete campaign flow in user docs
- Add API endpoint documentation
- Create integration tests for full flow

#### 🟢 MINOR: Error Response Inconsistency

Different error response formats:

```typescript
// Tier errors (Lines 129-151)
return NextResponse.json({
  error: error.message,
  code: 'FEATURE_NOT_AVAILABLE',
  feature: error.feature,
  currentTier: error.currentTier,
}, { status: 403 })

// Regular errors (Line 153)
return handleApiError(error)
```

**Recommendation:** Standardize error response format

---

## Flow 5: Partner Upload Flow ✅

**Status:** WORKING with minor issues

### Files Reviewed
- `/src/app/api/partner/upload/route.ts`

### What Works
1. ✅ Partner authentication and approval check
2. ✅ File type validation (CSV only)
3. ✅ File size limit (10MB)
4. ✅ Row limit (10,000 rows)
5. ✅ CSV parsing with error handling
6. ✅ Comprehensive deduplication logic:
   - Same partner: Updates existing lead
   - Cross-partner: Rejects (first uploader wins)
   - Platform-owned: Rejects
7. ✅ State and industry validation
8. ✅ Intent score calculation
9. ✅ Freshness score calculation
10. ✅ Marketplace price calculation
11. ✅ Batch insert with proper error handling
12. ✅ Rejection log generation
13. ✅ Upload batch tracking

### Issues Found

#### 🟡 MEDIUM: Batch Insert Failure Doesn't Clean Up Batch Record
**Location:** Lines 424-444

```typescript
if (leadsToInsert.length > 0) {
  const { error: insertError } = await adminClient
    .from('leads')
    .insert(leadsToInsert as never[])

  if (insertError) {
    console.error('Failed to insert leads:', insertError)
    await adminClient
      .from('partner_upload_batches')
      .update({
        status: 'failed',
        error_message: insertError.message,
      })
      .eq('id', batchId)

    return NextResponse.json({
      success: false,
      error: `Failed to insert leads: ${insertError.message}`,
    }, { status: 500 })
  }
}
```

**Problem:** Batch record is created but if insert fails, the batch shows as "failed" but might have partial data

**Recommendation:** Use database transaction to ensure atomicity

#### 🟢 MINOR: Industry Mapping Incomplete

Only 25 industries mapped in `INDUSTRY_MAP`. Many real-world industries will be rejected.

**Recommendation:**
- Expand industry mapping
- Allow custom industries with admin approval
- Provide clear error message listing valid industries

#### 🟢 MINOR: Magic Numbers

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB in bytes
const MAX_ROWS = 10000
```

**Recommendation:** Extract to configuration constants

---

## Security Analysis

### ✅ Security Strengths

1. **Multi-tenant Isolation:** All queries filter by `workspace_id`
2. **RLS Policies:** Enabled on all marketplace tables
3. **Input Validation:** Comprehensive Zod schemas
4. **Rate Limiting:** Implemented on all critical endpoints
5. **Idempotency:** Prevents duplicate purchases
6. **Authentication:** Proper auth checks on all endpoints
7. **Admin Client Usage:** Uses admin client only when needed, regular client for workspace isolation
8. **Duplicate Purchase Prevention:** Checks before allowing purchase
9. **Price Tampering Prevention:** Credit packages validated against predefined values
10. **Partner Attribution:** Properly tracked for commission calculation

### 🔴 Security Concerns

1. **Race Condition:** Credit checking is not atomic (see Flow 1)
2. **Webhook Signature:** Uses environment variable correctly but no rotation mechanism documented

---

## Performance Analysis

### ✅ Performance Optimizations Found

1. **Estimated Counts:** Uses `count: 'estimated'` for analytics (marketplace.repository.ts:657, 694)
2. **Batch Operations:** Duplicate checking done in batches
3. **Indexes:** Comprehensive indexes on marketplace tables
4. **Pagination:** Properly implemented with limit/offset
5. **Rate Limiting:** Prevents abuse and overload

### 🟡 Performance Concerns

1. **Sequential Lead Marking:** Loops through leads one-by-one instead of batch operation
2. **Large CSV Processing:** In-memory processing of 10k row CSVs could cause memory issues
3. **Partner Data Fetching:** Fetches partner data for each lead individually (could batch)

---

## Testing Status

### Current Test Coverage
- ✅ E2E Test File Exists: `/tests/e2e/critical-flows.spec.ts`
- ❌ Unit Tests: NOT FOUND
- ❌ Integration Tests: Skeleton created but not implemented

### Test Recommendations

Created test skeleton at `/tests/flows/critical-flows.test.ts` with:
- Flow 1: 4 test cases needed
- Flow 2: 3 test cases needed
- Flow 3: 3 test cases needed
- Flow 4: 5 test cases needed
- Flow 5: 8 test cases needed

**Total:** 23 test cases to implement

---

## Error Handling Analysis

### ✅ Good Error Handling

1. **Try-Catch Blocks:** All async operations wrapped
2. **Error Logging:** Uses safe logging to prevent sensitive data exposure
3. **User-Friendly Messages:** Generally good error messages
4. **Idempotency Updates:** Marks idempotency keys as failed on errors

### 🟡 Error Handling Gaps

1. **Email Failures:** Silently fail without retry mechanism
2. **Partial Failures:** Some operations can fail midway without rollback
3. **Webhook Processing:** No dead letter queue for failed webhooks

---

## Recommendations

### Immediate (P0 - Fix Now)

1. **Fix Credit Purchase Race Condition**
   - Implement atomic credit check and deduction
   - Use PostgreSQL `SELECT FOR UPDATE` or stored procedure
   - File: `/src/app/api/marketplace/purchase/route.ts`

2. **Make Lead Marking Atomic**
   - Change loop to batch RPC call or single transaction
   - File: `/src/lib/repositories/marketplace.repository.ts`

### High Priority (P1 - Fix This Sprint)

3. **Add Webhook Retry Mechanism**
   - Use Inngest or similar for webhook processing
   - Implement exponential backoff
   - Add dead letter queue

4. **Implement Email Queue**
   - Don't send emails synchronously in API routes
   - Use background job system (Inngest)
   - Add retry logic

5. **Complete Campaign Flow Documentation**
   - Document complete lead import process
   - Document email composition flow
   - Add API endpoint documentation

### Medium Priority (P2 - Fix Next Sprint)

6. **Add Comprehensive Tests**
   - Implement all 23 test cases in test skeleton
   - Add integration tests for critical paths
   - Test race conditions and edge cases

7. **Improve Partner Upload**
   - Use database transactions
   - Expand industry mapping
   - Add better validation error messages

8. **Standardize Error Responses**
   - Use consistent error format across all endpoints
   - Add error codes for client handling

### Low Priority (P3 - Technical Debt)

9. **Extract Magic Numbers to Config**
   - Download expiry days
   - File size limits
   - Row limits
   - Commission holdback period

10. **Performance Optimizations**
    - Batch partner data fetching
    - Stream large CSV processing
    - Optimize marketplace queries

---

## API Endpoint Documentation

### Working Endpoints

#### Lead Purchase
- `POST /api/marketplace/purchase` - Purchase leads (credits or Stripe)
- `GET /api/marketplace/purchase?purchaseId={id}` - Get purchase details

#### Credit Purchase
- `POST /api/marketplace/credits/purchase` - Buy credits

#### Webhooks
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

#### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign

#### Partner Upload
- `POST /api/partner/upload` - Upload leads CSV

### Needs Documentation
- Campaign lead import endpoints
- Campaign email composition endpoints
- Campaign sending endpoints

---

## Code Quality Assessment

### Strengths
1. ✅ Follows CLAUDE.md guidelines
2. ✅ Uses repository pattern consistently
3. ✅ Comprehensive input validation
4. ✅ Good separation of concerns
5. ✅ Detailed comments and documentation
6. ✅ Consistent code style
7. ✅ TypeScript types properly defined

### Areas for Improvement
1. 🟡 Some functions are too long (200+ lines)
2. 🟡 Could use more helper functions to reduce duplication
3. 🟡 Some hardcoded values should be in config

---

## Conclusion

The Cursive platform has a solid foundation with good security practices and well-structured code. The majority of critical flows are working, but there are important issues that need to be addressed:

1. **Race conditions** in credit purchases could lead to data integrity issues
2. **Non-atomic operations** in lead marking could cause inconsistencies
3. **Missing documentation** for complete campaign flow
4. **No retry mechanisms** for failed operations

**Priority:** Focus on fixing the race condition and adding atomic operations first, as these affect data integrity and revenue.

**Estimated Effort:**
- P0 fixes: 2-3 days
- P1 fixes: 1 week
- P2 fixes: 1-2 weeks
- P3 fixes: Ongoing

---

## Appendix: Test Cases to Implement

See `/tests/flows/critical-flows.test.ts` for test skeleton with 23 test cases across all 5 flows.
