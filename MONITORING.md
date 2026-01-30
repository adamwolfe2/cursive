# Production Monitoring & Alerting Guide

This document outlines the monitoring and alerting strategy for the OpenInfo/Cursive platform.

## Health Check Endpoint

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "healthy" | "unhealthy",
  "checks": {
    "database": true,
    "timestamp": "2026-01-31T12:00:00Z",
    "uptime": 86400,
    "memory": {
      "rss": 123456789,
      "heapTotal": 98765432,
      "heapUsed": 87654321,
      "external": 1234567
    }
  },
  "responseTime": 123
}
```

**Monitoring:** Set up uptime monitoring to ping this endpoint every 1-5 minutes.

## Critical Metrics to Monitor

### 1. System Health
- **Health check endpoint** - Should return 200 OK
- **Response time** - Should be < 1000ms
- **Database connectivity** - Check `checks.database` = true

**Alert Threshold:** 3 consecutive failures or response time > 2000ms

### 2. Webhook Processing
Monitor webhook success rates and processing times.

**Metrics:**
- Webhook processing success rate (target: > 99%)
- Webhook processing time (target: < 2000ms)
- Webhook retry queue depth (alert if > 100)

**SQL Queries:**
```sql
-- Failed webhooks in last hour
SELECT 
  source,
  COUNT(*) as failed_count
FROM processed_webhook_events
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND EXISTS (
    SELECT 1 FROM webhook_retry_queue 
    WHERE stripe_event_id = event_id
  )
GROUP BY source;

-- Webhook processing times (average)
SELECT
  source,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_seconds
FROM processed_webhook_events
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY source;
```

**Alert Threshold:** Failure rate > 1% or avg processing time > 5 seconds

### 3. Partner Uploads
Monitor upload success rates and duplicate rates.

**Metrics:**
- Upload success rate (target: > 95%)
- Duplicate rate (baseline: track trend)
- Average rows per upload
- Upload validation errors

**SQL Queries:**
```sql
-- Upload statistics for last 24 hours
SELECT
  status,
  COUNT(*) as upload_count,
  AVG(valid_rows) as avg_valid_rows,
  AVG(invalid_rows) as avg_invalid_rows,
  AVG(duplicate_rows) as avg_duplicate_rows
FROM partner_upload_batches
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Upload errors
SELECT
  partner_id,
  file_name,
  error_message,
  created_at
FROM partner_upload_batches
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

**Alert Threshold:** Failure rate > 5% or spike in validation errors

### 4. Payment Processing
Monitor payment success rates and failed payment tracking.

**Metrics:**
- Subscription payment failure rate
- Workspaces disabled due to payment failures
- Failed payment recovery rate

**SQL Queries:**
```sql
-- Failed payments in last 7 days
SELECT
  w.name as workspace_name,
  s.failed_payment_count,
  s.last_payment_failed_at,
  s.status
FROM subscriptions s
JOIN workspaces w ON w.id = s.workspace_id
WHERE s.failed_payment_count > 0
  AND s.last_payment_failed_at > NOW() - INTERVAL '7 days'
ORDER BY s.failed_payment_count DESC;

-- Workspaces disabled due to payment failures
SELECT
  id,
  name,
  access_disabled_reason,
  access_disabled_at
FROM workspaces
WHERE access_disabled = TRUE
  AND access_disabled_reason = 'subscription_payment_failed';
```

**Alert Threshold:** > 5 workspaces disabled or payment failure rate > 10%

### 5. Partner Payouts
Monitor pending payouts and payout processing.

**Metrics:**
- Pending payout amount (track total)
- Failed payout count
- Average payout processing time

**SQL Queries:**
```sql
-- Pending payout summary
SELECT
  SUM(amount) as total_pending,
  COUNT(*) as pending_count,
  AVG(amount) as avg_payout_amount
FROM partner_payouts
WHERE status = 'pending';

-- Failed payouts in last 7 days
SELECT
  p.name as partner_name,
  pp.amount,
  pp.error_message,
  pp.created_at
FROM partner_payouts pp
JOIN partners p ON p.id = pp.partner_id
WHERE pp.status = 'failed'
  AND pp.created_at > NOW() - INTERVAL '7 days'
ORDER BY pp.created_at DESC;
```

**Alert Threshold:** Failed payout count > 3 or pending amount > $10,000

### 6. Lead Deduplication
Monitor fuzzy matching effectiveness and duplicate rates.

**Metrics:**
- Duplicate detection rate (exact vs fuzzy)
- Lead merge operations
- Soft-deleted lead count

**SQL Queries:**
```sql
-- Leads created in last 24 hours
SELECT
  source,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE is_deleted = FALSE) as active_leads,
  COUNT(*) FILTER (WHERE is_deleted = TRUE) as deleted_leads,
  COUNT(*) FILTER (WHERE deleted_reason = 'merged_duplicate') as merged_leads
FROM leads
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY source;
```

**Alert Threshold:** Merged lead rate > 20% (may indicate data quality issues)

## Recommended Monitoring Tools

### Uptime Monitoring
- **Better Uptime** - Simple uptime and response time monitoring
- **UptimeRobot** - Free tier for basic health checks
- **Checkly** - API monitoring with detailed reporting

### Application Performance Monitoring (APM)
- **Sentry** - Error tracking and performance monitoring
- **New Relic** - Full APM with distributed tracing
- **Datadog** - Infrastructure + APM monitoring

### Database Monitoring
- **Supabase Dashboard** - Built-in metrics for Postgres
- **pgMonitor** - Open-source Postgres monitoring
- **CloudWatch** - For AWS-hosted databases

## Alert Configuration

### Critical Alerts (Page immediately)
1. Health check endpoint down for > 5 minutes
2. Database connectivity lost
3. Webhook processing failure rate > 5%
4. Payment processing completely broken (100% failure)
5. > 10 workspaces disabled due to payment failures

### Warning Alerts (Email/Slack)
1. Health check response time > 2000ms
2. Webhook retry queue depth > 100
3. Upload failure rate > 5%
4. Payment failure rate > 10%
5. Failed payout count > 3
6. Pending payout amount > $10,000

### Informational Alerts (Daily digest)
1. Upload statistics summary
2. Payment processing summary
3. Partner payout summary
4. Lead deduplication summary

## Setup Instructions

### 1. Uptime Monitoring
```bash
# Using Better Uptime (example)
curl -X POST https://betteruptime.com/api/v2/monitors \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "monitor_type": "status",
    "url": "https://yourdomain.com/api/health",
    "check_frequency": 60,
    "request_timeout": 30,
    "recovery_period": 0,
    "confirmations": 3,
    "call": true,
    "sms": true,
    "email": true
  }'
```

### 2. Sentry Error Tracking
```typescript
// src/app/layout.tsx
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

### 3. Custom Alerts (Postgres Functions)
```sql
-- Create function to check pending payouts
CREATE OR REPLACE FUNCTION check_pending_payouts_alert()
RETURNS TABLE (
  alert_level VARCHAR,
  message TEXT,
  total_amount NUMERIC
) AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT SUM(amount) INTO v_total
  FROM partner_payouts
  WHERE status = 'pending';

  IF v_total > 10000 THEN
    RETURN QUERY SELECT 
      'warning'::VARCHAR,
      'Pending payouts exceed $10,000: $' || v_total::TEXT,
      v_total;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (if available)
SELECT cron.schedule('check-pending-payouts', '0 9 * * *', 
  $$SELECT * FROM check_pending_payouts_alert()$$
);
```

### 4. Vercel Deployment Monitoring
Vercel automatically provides:
- Build status notifications
- Deployment error alerts
- Function execution metrics

Configure via Vercel Dashboard > Settings > Notifications.

## Testing Alerts

Before going live, test each alert:

1. **Health check** - Stop database connection and verify alert fires
2. **Webhook failures** - Send malformed webhook and verify retry logic
3. **Upload errors** - Upload invalid CSV and verify error handling
4. **Payment failures** - Test with Stripe test mode failed payment
5. **Payout failures** - Test payout approval with invalid Stripe account

## Incident Response Runbook

### Scenario 1: Health Check Failing
1. Check Vercel deployment status
2. Check Supabase database status
3. Review recent deployments in Vercel
4. Check error logs in Sentry
5. Rollback if necessary: `vercel rollback`

### Scenario 2: Webhook Processing Failures
1. Check webhook retry queue depth
2. Review webhook error logs
3. Verify webhook signature secrets are correct
4. Check Stripe/Audience Labs webhook configuration
5. Manually replay failed webhooks if needed

### Scenario 3: Payment Processing Broken
1. Check Stripe API status (status.stripe.com)
2. Verify Stripe API keys are correct
3. Review recent Stripe webhook events
4. Check subscription status changes in database
5. Contact Stripe support if API issue

### Scenario 4: Partner Payout Failures
1. Check partner Stripe Connect account status
2. Verify Stripe transfer API is working
3. Review payout error messages in database
4. Check partner pending balance is accurate
5. Contact partner to verify Stripe account setup

## Compliance & Audit

### Data Retention
- Webhook events: 30 days (auto-cleanup)
- Error logs: 90 days
- Health check logs: 7 days
- Payment records: 7 years (legal requirement)

### Access Logs
Monitor admin actions:
- Payout approvals/rejections
- Partner account suspensions
- Workspace access disabling

```sql
-- Audit log query
SELECT
  u.email as admin_email,
  pp.status,
  pp.amount,
  pp.approved_at,
  pp.rejected_at,
  pp.rejection_reason
FROM partner_payouts pp
LEFT JOIN users u ON u.id = pp.approved_by_user_id OR u.id = pp.rejected_by_user_id
WHERE pp.approved_at > NOW() - INTERVAL '30 days'
  OR pp.rejected_at > NOW() - INTERVAL '30 days'
ORDER BY COALESCE(pp.approved_at, pp.rejected_at) DESC;
```

## Performance Baselines

Establish these baselines during first week of production:

- Average webhook processing time
- Average upload processing time
- Average lead routing time
- Average API response time
- Database query performance

Use these baselines to detect performance regressions.

---

**Last Updated:** 2026-01-31
**Next Review:** 2026-02-28
