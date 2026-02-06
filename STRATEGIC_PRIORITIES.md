# Strategic Priorities - Post-Race Condition Fixes

**Date:** 2026-02-06
**Status:** Post-deployment analysis

---

## 🚨 TIER 1: CRITICAL (Do This Week)

### 1. **Test the Race Condition Fixes** 🔴 URGENT
**Why Critical:** We just deployed atomic payment functions to production but have ZERO tests proving they work.

**Risk:** If the atomic functions have bugs, we'll only discover them when real money is lost.

**What's Needed:**
- Implement 23 test cases from `tests/flows/critical-flows.test.ts`
- Stress test concurrent purchases (100+ simultaneous requests)
- Verify atomic rollback works correctly
- Test duplicate webhook handling
- Load test with real Stripe test mode webhooks

**Estimated Impact:** Prevents financial disasters
**Time:** 6-8 hours
**Priority:** 🔴 HIGHEST

---

### 2. **Webhook & Email Reliability** 🔴 CRITICAL
**Why Critical:** From the audit, we found:
- Email failures don't trigger retries (users never get purchase confirmations)
- Webhook failures may not retry (user paid but no leads delivered)
- No dead letter queue for failed operations

**Current Issues:**
```typescript
// Email fails silently
try {
  await sendPurchaseConfirmationEmail(...)
} catch (emailError) {
  console.error('[Purchase] Failed to send confirmation email:', emailError)
  // Don't fail the purchase if email fails
}
```

**What's Needed:**
- Move email sending to Inngest with retries (3 attempts, exponential backoff)
- Wrap Stripe webhooks in Inngest for automatic retries
- Add dead letter queue for permanently failed operations
- Alert on email/webhook failures (Slack/email notification)
- Create admin dashboard to view/retry failed operations

**Estimated Impact:** Prevents "paid but no leads" scenarios
**Time:** 8-10 hours
**Priority:** 🔴 HIGHEST

---

### 3. **Monitoring & Observability** 🟡 HIGH
**Why Critical:** We have NO visibility into production issues right now.

**Current State:**
- No error tracking (Sentry not configured)
- No performance monitoring
- No alerting for critical failures
- Console.log is only logging (disappears in Vercel)

**What's Needed:**
- Set up Sentry error tracking
- Add performance monitoring (API response times, DB query times)
- Configure alerts for:
  - Payment failures (>5% error rate)
  - Purchase conflicts (>1% rate)
  - Email failures (>10% failure rate)
  - Database query timeouts
- Create monitoring dashboard (Vercel Analytics + custom metrics)
- Add structured logging (not console.log)

**Estimated Impact:** Catch issues before users report them
**Time:** 6-8 hours
**Priority:** 🟡 HIGH

---

### 4. **Fix Critical Flow Issues** 🟡 HIGH
**Why Critical:** Audit identified 12 issues, we only fixed 4 (the race conditions).

**Remaining Issues:**
- 🟡 Email failure doesn't trigger retry (purchase flow)
- 🟡 Webhook failures may not retry (Stripe)
- 🟡 Rate limiter key shared between credit + lead purchases
- 🟡 Campaign creation flow untested
- 🟡 Onboarding flow untested
- 🟢 Magic numbers for expiry times (90 days hardcoded)
- 🟢 Hardcoded Stripe API version
- 🟢 17 TODO/FIXME comments in codebase

**What's Needed:**
- Implement email retry mechanism (Inngest)
- Separate rate limit keys for different endpoints
- Test campaign creation end-to-end
- Test onboarding flow end-to-end
- Extract magic numbers to constants
- Address TODO/FIXME comments

**Estimated Impact:** Better UX, fewer support tickets
**Time:** 8-10 hours
**Priority:** 🟡 HIGH

---

## ⚡ TIER 2: HIGH PRIORITY (Do This Month)

### 5. **Inngest Job Reliability Audit**
**Why Important:** Background jobs could be failing silently.

**Inngest Functions to Audit:**
- Lead enrichment jobs
- Email sending jobs
- Campaign sequence jobs
- Data sync jobs
- Webhook processing jobs

**What's Needed:**
- Audit all Inngest functions for error handling
- Add retry logic where missing
- Add monitoring/alerting for job failures
- Create job status dashboard
- Add manual retry mechanism for admins

**Estimated Impact:** Reliable background operations
**Time:** 6-8 hours
**Priority:** 🟡 HIGH

---

### 6. **Data Consistency Verification**
**Why Important:** After deploying migrations, we should verify no data corruption.

**What's Needed:**
- Audit workspace_credits for consistency:
  ```sql
  -- Check for negative balances (shouldn't exist)
  SELECT * FROM workspace_credits WHERE balance < 0;

  -- Check credit math is correct
  SELECT * FROM workspace_credits
  WHERE balance != (total_purchased + total_earned - total_used);
  ```
- Audit leads for duplicate sold_count
- Audit marketplace_purchases for orphaned records
- Audit partner commissions for calculation errors
- Create automated consistency checks (run daily)

**Estimated Impact:** Trust in financial data
**Time:** 4-6 hours
**Priority:** 🟡 HIGH

---

### 7. **RLS Policy Verification**
**Why Important:** Multi-tenant security is critical.

**What's Needed:**
- Verify every table has RLS policies
- Test policies with different workspaces
- Ensure no data leaks between workspaces
- Add automated RLS tests
- Document which tables are shared vs isolated

**Estimated Impact:** Security confidence
**Time:** 4-6 hours
**Priority:** 🟡 HIGH

---

### 8. **API Rate Limiting (Platform-Wide)**
**Why Important:** Only purchase endpoint has rate limiting.

**What's Needed:**
- Add rate limiting to all POST/PUT/DELETE endpoints
- Separate rate limits by action type:
  - Reads: 100/min
  - Writes: 30/min
  - Purchases: 10/min
  - Credit purchases: 5/min
- Add rate limit headers to responses
- Create admin override mechanism

**Estimated Impact:** Prevent abuse, API stability
**Time:** 4-6 hours
**Priority:** 🟡 HIGH

---

## 📊 TIER 3: MEDIUM PRIORITY (Nice to Have)

### 9. **Caching Layer (Redis)**
**What:** Add Redis for hot data
- Lead counts by workspace
- Marketplace stats (top leads, trending)
- User session data
- API response caching

**Estimated Impact:** 50-70% reduction in DB queries for hot paths
**Time:** 8-10 hours

---

### 10. **Query Optimization Round 2**
**What:** Fix remaining N+1 queries
- Partner dashboard (commission calculations)
- Campaign analytics (aggregate queries)
- Admin dashboard (multiple counts)

**Estimated Impact:** 30-50% faster dashboard loads
**Time:** 6-8 hours

---

### 11. **Better Error Messages**
**What:** User-friendly error messages
- "Insufficient credits" → "You need 50 more credits to complete this purchase. [Buy Credits]"
- "Purchase failed" → "This lead was just purchased by another user. Try another lead."
- Add error codes for debugging

**Estimated Impact:** Better UX, fewer support tickets
**Time:** 4-6 hours

---

### 12. **Admin Tools**
**What:** Internal tools for operations
- Retry failed emails/webhooks manually
- View purchase history with filters
- Adjust workspace credits (with audit trail)
- View Inngest job status
- Reconcile partner commissions

**Estimated Impact:** Faster support resolution
**Time:** 10-12 hours

---

## 🎨 TIER 4: LOWER PRIORITY (Future)

### 13. **A/B Testing Framework**
**What:** Test value prop variants
**Time:** 8-10 hours

### 14. **Role-Based Dashboards**
**What:** Different views for Admin, Partner, Buyer
**Time:** 12-15 hours

### 15. **Advanced Analytics**
**What:** Better insights for users
**Time:** 10-12 hours

### 16. **API Documentation**
**What:** OpenAPI/Swagger docs
**Time:** 6-8 hours

---

## 🚀 RECOMMENDED AGENT DEPLOYMENT

### **Agent Sprint 1: Verification & Reliability** (HIGHEST PRIORITY)

Deploy 4 agents in parallel to handle TIER 1 items:

#### **Agent 1: Test Implementation**
**Task:** Implement comprehensive test suite
- Implement 23 test cases from skeleton
- Add stress tests for concurrent purchases (100+ users)
- Test atomic rollback scenarios
- Test duplicate webhook handling
- Add test coverage reporting
- Document test results

**Deliverables:**
- `tests/flows/critical-flows.test.ts` (fully implemented)
- `tests/stress/concurrent-purchases.test.ts` (new)
- `tests/integration/webhook-idempotency.test.ts` (new)
- Test coverage report
- Test execution guide

**Priority:** 🔴 CRITICAL
**Estimated Time:** 6-8 hours

---

#### **Agent 2: Webhook & Email Reliability**
**Task:** Make email and webhooks bulletproof
- Move email sending to Inngest (with retries)
- Wrap Stripe webhooks in Inngest (with retries)
- Add dead letter queue for failed operations
- Create admin UI to retry failed operations
- Add Slack alerts for failures

**Deliverables:**
- `src/inngest/functions/send-purchase-email.ts` (new)
- `src/inngest/functions/process-stripe-webhook.ts` (new)
- `src/app/admin/failed-operations/page.tsx` (new)
- Dead letter queue table migration
- Alert configuration

**Priority:** 🔴 CRITICAL
**Estimated Time:** 8-10 hours

---

#### **Agent 3: Monitoring & Observability**
**Task:** Set up comprehensive monitoring
- Configure Sentry error tracking
- Add performance monitoring (API times, DB queries)
- Create alerting rules (Slack/email)
- Build monitoring dashboard
- Add structured logging (replace console.log)

**Deliverables:**
- Sentry configuration
- `src/lib/monitoring/sentry.ts` (new)
- `src/lib/monitoring/performance.ts` (new)
- `src/app/admin/monitoring/page.tsx` (new)
- Alert configuration docs
- Logging migration guide

**Priority:** 🟡 HIGH
**Estimated Time:** 6-8 hours

---

#### **Agent 4: Critical Flow Bug Fixes**
**Task:** Fix remaining 8 issues from audit
- Separate rate limit keys for endpoints
- Extract magic numbers to constants
- Add retry logic for email failures
- Test campaign creation flow
- Test onboarding flow
- Address TODO/FIXME comments

**Deliverables:**
- Updated rate limiting configuration
- `src/lib/constants/timeouts.ts` (new)
- Campaign creation tests
- Onboarding tests
- Clean codebase (no TODOs)
- Bug fix documentation

**Priority:** 🟡 HIGH
**Estimated Time:** 8-10 hours

---

## 📊 Success Metrics

### After Agent Sprint 1:
- ✅ Test coverage: 0% → 80%+ for critical flows
- ✅ Email delivery: 90% → 99%+ (with retries)
- ✅ Webhook reliability: 95% → 99.9%+ (with retries)
- ✅ Error visibility: 0% → 100% (Sentry catches all)
- ✅ Time to detect issues: Hours → Seconds (alerts)
- ✅ Critical bugs: 12 → 4 (fixed 8 issues)

### Platform Confidence:
- 🔒 Money-safe: Tested atomic operations
- 🔔 Observable: Real-time error tracking
- 🛡️ Reliable: Automatic retries for failures
- 🐛 Clean: No critical bugs in core flows

---

## 💡 Strategic Reasoning

**Why This Order?**

1. **Tests First** - We deployed critical financial code without tests. This is the biggest risk.
2. **Reliability Second** - Users paying but not getting leads is catastrophic for trust.
3. **Monitoring Third** - We're flying blind without error tracking.
4. **Bug Fixes Fourth** - Address remaining issues while context is fresh.

**Why Parallel Agents?**
- All 4 tasks are independent
- All 4 are critical for production confidence
- Parallel execution saves 2-3 days vs sequential
- Different areas of expertise (testing, infrastructure, debugging)

---

## 🎯 Recommendation

**Deploy Agent Sprint 1 NOW.**

These 4 tasks are the foundation for a production-ready platform:
1. Tests prove the race condition fixes work
2. Retries prevent "paid but no leads" disasters
3. Monitoring catches issues before users complain
4. Bug fixes eliminate known pain points

After Sprint 1 completes, we can tackle TIER 2 (Inngest audit, data consistency, RLS verification) with confidence that our core payment flows are solid.

---

**Ready to deploy agents when you are.** 🚀
