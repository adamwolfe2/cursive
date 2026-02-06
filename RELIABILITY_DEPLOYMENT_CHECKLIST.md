# Reliability System - Deployment Checklist

## Pre-Deployment Verification

### 1. Code Review ✅
- [x] Email retry function created
- [x] Webhook retry function created
- [x] Failed operations table migration created
- [x] Admin UI pages created
- [x] API routes created
- [x] Monitoring utilities created
- [x] Slack alerting implemented
- [x] Health monitoring cron created
- [x] Purchase route updated
- [x] Webhook route updated
- [x] Inngest functions exported
- [x] Inngest route registered functions
- [x] Documentation complete

### 2. Configuration Check
- [ ] `INNGEST_EVENT_KEY` set in environment
- [ ] `INNGEST_SIGNING_KEY` set in environment
- [ ] `RESEND_API_KEY` verified working
- [ ] `STRIPE_SECRET_KEY` verified working
- [ ] `STRIPE_WEBHOOK_SECRET` verified working
- [ ] `SLACK_WEBHOOK_URL` set (optional but recommended)
- [ ] `NEXT_PUBLIC_APP_URL` set correctly

### 3. Database Migration
- [ ] Review migration: `supabase/migrations/20260205234158_create_failed_operations.sql`
- [ ] Apply migration: `supabase db push`
- [ ] Verify table created: `SELECT * FROM failed_operations LIMIT 1;`
- [ ] Verify indexes created: `\d failed_operations`
- [ ] Test RLS policy (should require admin)

## Deployment Steps

### Step 1: Database Setup
```bash
# Apply migration
cd /Users/adamwolfe/cursive-project/cursive-work
supabase db push

# Verify
supabase db execute --query "SELECT COUNT(*) FROM failed_operations;"
```

### Step 2: Build & Type Check
```bash
# Type check
npm run typecheck

# Build
npm run build
```

### Step 3: Deploy to Production
```bash
# Deploy (adjust for your deployment method)
vercel deploy --prod
# OR
git push production main
```

### Step 4: Verify Inngest Registration
1. Go to https://app.inngest.com
2. Navigate to Functions
3. Verify these functions appear:
   - [x] `send-purchase-email`
   - [x] `send-credit-purchase-email`
   - [x] `process-stripe-webhook`
   - [x] `handle-webhook-failure`
   - [x] `monitor-operations-health`

### Step 5: Configure Slack (Optional)
1. Create Slack incoming webhook: https://api.slack.com/messaging/webhooks
2. Add to environment: `SLACK_WEBHOOK_URL=https://hooks.slack.com/...`
3. Redeploy or update env vars

## Post-Deployment Testing

### Test 1: Email Retry (Credit Purchase)
```
1. Login to application
2. Go to marketplace
3. Purchase leads using credits
4. Wait 5 seconds
5. Check email inbox
6. Verify purchase confirmation received

Expected Result:
✅ Email arrives within 5-10 seconds
✅ Contains download link
✅ Download link works

If failed:
1. Go to /admin/failed-operations
2. Find operation by purchase ID
3. Check error message
4. Retry manually if needed
```

### Test 2: Webhook Retry (Stripe Purchase)
```
1. Login to application
2. Go to marketplace
3. Purchase leads using Stripe
4. Complete checkout
5. Wait 10 seconds
6. Verify purchase shows in history
7. Check email for confirmation

Expected Result:
✅ Purchase marked complete in database
✅ Leads marked as sold
✅ Email confirmation received
✅ Download link works

If failed:
1. Check Stripe webhook logs
2. Go to /admin/failed-operations
3. Filter by "webhook"
4. Check error message
5. Retry manually if needed
```

### Test 3: Admin UI Access
```
1. Login as admin user
2. Go to /admin/failed-operations
3. Verify page loads
4. Check stats cards show counts
5. Go to /admin/operations-health
6. Verify metrics display

Expected Result:
✅ Both pages load without errors
✅ Data displays correctly
✅ No console errors
```

### Test 4: Manual Retry
```
1. Create a failed operation (temp break SMTP)
2. Go to /admin/failed-operations
3. Click "View Details" on failed operation
4. Click "Retry"
5. Restore SMTP configuration
6. Check that operation succeeds

Expected Result:
✅ Retry button triggers new attempt
✅ Operation succeeds after fix
✅ No longer shows in unresolved list
```

### Test 5: Slack Alerting (If Configured)
```
1. Temporarily set invalid SMTP credentials
2. Complete 3+ purchases (trigger failures)
3. Wait for alerts to fire
4. Check Slack channel for alert
5. Restore credentials

Expected Result:
✅ Slack alert received
✅ Contains purchase details
✅ Links to admin UI
✅ Shows error message
```

### Test 6: Health Monitoring Cron
```
1. Wait for next hour (cron runs hourly)
2. Check Inngest dashboard for execution
3. Verify function completed successfully
4. If failures present, check for Slack alerts

Expected Result:
✅ Cron executes every hour
✅ Completes successfully
✅ Sends alerts if thresholds exceeded
```

## Monitoring Setup

### Daily Monitoring (First Week)
```
Daily at 9am:
1. Check /admin/operations-health
2. Note email delivery rate
3. Note webhook success rate
4. Check failed operations count
5. Review any Slack alerts from overnight

Log results:
- Date: ____
- Email Rate: ____%
- Webhook Rate: ____%
- Failed Count: ____
- Issues: _________
```

### Weekly Review (First Month)
```
Weekly on Monday:
1. Review full week metrics
2. Analyze failure patterns
3. Check retry success rates
4. Identify recurring errors
5. Update runbooks if needed

Actions:
- [ ] Review error patterns
- [ ] Adjust retry counts if needed
- [ ] Resolve old failed operations
- [ ] Update documentation
- [ ] Share metrics with team
```

## Rollback Plan

### If Critical Issues Arise

#### Quick Rollback (Emergency)
```bash
# Revert to previous deployment
vercel rollback
# OR
git revert HEAD
git push production main
```

This restores:
- Direct email sending (no retries)
- Direct webhook processing (no retries)
- No dead letter queue
- No admin UI

#### Partial Rollback (Preserve Infrastructure)

**Option 1: Disable Email Queueing**
In `/src/app/api/marketplace/purchase/route.ts`:
```typescript
// Comment out Inngest send
// await inngest.send({ name: 'purchase/email.send', ... })

// Restore direct send
await sendPurchaseConfirmationEmail(...)
```

**Option 2: Disable Webhook Queueing**
In `/src/app/api/webhooks/stripe/route.ts`:
```typescript
// Comment out Inngest send
// await inngest.send({ name: 'stripe/webhook.received', ... })

// Restore direct processing
await handleCheckoutSessionCompleted(event)
```

## Success Criteria

### Week 1
- [ ] Zero complete system outages
- [ ] Email delivery rate >95%
- [ ] Webhook success rate >98%
- [ ] <5 items in dead letter queue
- [ ] All alerts acknowledged within 1 hour

### Week 2-4
- [ ] Email delivery rate >99%
- [ ] Webhook success rate >99.5%
- [ ] <3 items in dead letter queue
- [ ] Retry success rate >80%
- [ ] Zero user complaints about missing emails

### Month 1
- [ ] Email delivery rate >99.5%
- [ ] Webhook success rate >99.9%
- [ ] Average time to success <5 minutes
- [ ] Zero manual interventions required
- [ ] System runs autonomously

## Troubleshooting

### Emails Not Sending
```
Symptom: No emails received after purchase

Diagnosis:
1. Check /admin/failed-operations
2. Filter by "email" type
3. Look for recent failures

Common Causes:
- Resend API key invalid/expired
- Rate limiting hit (50/min)
- SMTP service outage
- Invalid recipient email

Resolution:
- Verify Resend API key
- Check Resend dashboard
- Wait for rate limit reset
- Manually retry from admin UI
```

### Webhooks Not Processing
```
Symptom: Stripe payment succeeded but purchase not completed

Diagnosis:
1. Check Stripe webhook logs
2. Verify 200 response returned
3. Check /admin/failed-operations
4. Filter by "webhook" type

Common Causes:
- Database connection timeout
- Stripe metadata missing
- Idempotency key collision
- Network issues

Resolution:
- Check database status
- Verify Stripe event payload
- Review error in admin UI
- Manually retry from admin UI
```

### High Failure Rate
```
Symptom: Many operations failing

Diagnosis:
1. Check /admin/operations-health
2. Note which type failing (email/webhook)
3. Check recent error messages
4. Look for patterns

Common Causes:
- External service outage
- Configuration change
- Code deployment bug
- Infrastructure issue

Resolution:
- Check external service status
- Review recent deployments
- Rollback if needed
- Contact service support
```

### Dead Letter Queue Growing
```
Symptom: >10 unresolved operations

Diagnosis:
1. Go to /admin/failed-operations
2. Group by error message
3. Identify if systematic

Common Causes:
- Persistent service outage
- Invalid configuration
- Code bug
- Data corruption

Resolution:
- Fix root cause
- Bulk retry all operations
- Mark as resolved if unfixable
- Update runbooks
```

## Communication Plan

### Internal
**Slack Channels:**
- `#engineering` - Deployment notifications
- `#alerts` - Automated failure alerts (if configured)
- `#ops` - Daily health check results

**Email:**
- Weekly summary to engineering team
- Monthly metrics to leadership

### External (If Issues)
**Customer Support:**
- Template for missing email: "We're aware of email delivery delays. Your purchase was successful and we're working to deliver your download link shortly."
- Template for webhook issues: "We're experiencing temporary processing delays. Your payment was received and we're completing your order now."

## Documentation Links

- **Full System Documentation**: `/docs/RELIABILITY_SYSTEM.md`
- **Implementation Summary**: `/RELIABILITY_IMPLEMENTATION_SUMMARY.md`
- **This Checklist**: `/RELIABILITY_DEPLOYMENT_CHECKLIST.md`

## Sign-Off

### Pre-Deployment
- [ ] Agent 2: Implementation complete
- [ ] Engineering Lead: Code reviewed
- [ ] DevOps: Infrastructure ready
- [ ] QA: Tests passed

### Post-Deployment
- [ ] Agent 2: Deployment verified
- [ ] On-Call: Monitoring active
- [ ] Support: Runbooks updated
- [ ] Team: Training complete

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Verification Completed**: _____________
**Status**: _____________
