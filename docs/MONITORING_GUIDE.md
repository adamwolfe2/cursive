# Monitoring Guide

Comprehensive guide to the Cursive platform monitoring system.

## Overview

The monitoring system provides:
- **Error Tracking**: Sentry integration for catching and tracking errors
- **Performance Monitoring**: Track API response times, database queries, and slow operations
- **Structured Logging**: Centralized logging with context and metadata
- **Alerting**: Automated alerts for critical issues via Slack and Sentry
- **Monitoring Dashboard**: Real-time dashboard showing system health

## Architecture

```
┌─────────────┐
│ Application │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌────────────┐  ┌────────────┐
│   Sentry   │  │   Logger   │
│  (Errors)  │  │  (Logs)    │
└────────────┘  └────────────┘
       │             │
       │             ▼
       │        ┌────────────┐
       │        │  Metrics   │
       │        │ (Database) │
       │        └──────┬─────┘
       │               │
       ▼               ▼
┌────────────────────────┐
│   Alert System         │
│  - Slack               │
│  - Sentry              │
│  - Email               │
└────────────────────────┘
```

## Components

### 1. Sentry Error Tracking

**File**: `src/lib/monitoring/sentry.ts`

Sentry captures all errors and sends them to Sentry.io for analysis.

#### Setup

1. Create a Sentry account at https://sentry.io
2. Create a new Next.js project
3. Copy the DSN and add to environment variables:

```env
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=... # For uploading source maps
```

#### Usage

```typescript
import { captureError, captureMessage, setUser } from '@/lib/monitoring/sentry'

// Capture an error
try {
  await riskyOperation()
} catch (error) {
  captureError(error as Error, {
    tags: { operation: 'purchase' },
    extra: { leadId: '123' },
  })
}

// Set user context
setUser({ id: user.id, email: user.email })

// Capture a message
captureMessage('User performed action', 'info', {
  tags: { action: 'purchase' },
})
```

### 2. Performance Monitoring

**File**: `src/lib/monitoring/performance.ts`

Tracks operation performance and alerts on slow operations.

#### Usage

```typescript
import { measure, startTimer, endTimer } from '@/lib/monitoring/performance'

// Measure async operation
const result = await measure(
  'purchase-leads',
  async () => await purchaseLeads(leadIds),
  { workspace_id: workspaceId, lead_count: leadIds.length }
)

// Manual timing
const timerId = startTimer('complex-operation', { user_id: userId })
// ... do work ...
endTimer(timerId, { success: true })
```

#### Thresholds

Operations are considered slow when they exceed these thresholds:

- API routes: 3-10s depending on complexity
- Database queries: 1s
- Database transactions: 5s
- External API calls: 5s
- Webhooks: 30s
- Background jobs: 30s-120s

### 3. Structured Logging

**File**: `src/lib/monitoring/logger.ts`

Provides consistent logging across the platform.

#### Usage

```typescript
import { logger } from '@/lib/monitoring/logger'

// Log levels
logger.debug('Debug message', { context: 'value' })
logger.info('Info message', { context: 'value' })
logger.warn('Warning message', { context: 'value' })
logger.error('Error message', { context: 'value' }, error)
logger.critical('Critical error', { context: 'value' }, error)

// Specialized logging
logger.apiRequest({
  method: 'POST',
  path: '/api/marketplace/leads',
  status: 200,
  duration: 234,
  userId: 'user-123',
})

logger.job({
  jobName: 'process-purchase',
  status: 'completed',
  duration: 1234,
})

logger.payment({
  event: 'charge.succeeded',
  amount: 5000,
  currency: 'usd',
  status: 'success',
  userId: 'user-123',
})
```

### 4. Alert System

**File**: `src/lib/monitoring/alerts.ts`

Automated alerting for critical issues.

#### Alert Rules

```typescript
export const ALERT_RULES = {
  purchaseFailureRate: {
    threshold: 0.05, // 5%
    window: '1h',
    action: ['slack', 'sentry'],
    severity: 'critical',
  },
  // ... more rules
}
```

#### Running Alert Checks

Set up a cron job or Inngest function to check alerts every 5 minutes:

```typescript
// Inngest function
export const checkAlerts = inngest.createFunction(
  { id: 'check-alerts', retries: 3 },
  { cron: '*/5 * * * *' }, // Every 5 minutes
  async ({ step }) => {
    await step.run('check-alert-rules', async () => {
      const { checkAlertRules } = await import('@/lib/monitoring/alerts')
      return await checkAlertRules()
    })
  }
)
```

#### Testing Alerts

```typescript
import { testAlert } from '@/lib/monitoring/alerts'

// Test a specific alert
await testAlert('purchaseFailureRate')
```

### 5. API Route Monitoring

**File**: `src/lib/utils/api-wrapper.ts`

Automatically monitor all API routes.

#### Usage

```typescript
import { createApiRoute } from '@/lib/utils/api-wrapper'

export const POST = createApiRoute(
  async (req, context) => {
    // Your handler logic
    const data = await req.json()
    // ...
    return NextResponse.json({ success: true })
  },
  { name: 'purchase-leads' }
)
```

This automatically:
- Tracks request duration
- Logs requests and responses
- Captures errors in Sentry
- Records metrics

### 6. Monitoring Dashboard

**URL**: `/admin/monitoring`

Real-time dashboard showing:

#### System Health
- API response times (p50, p95, p99)
- Database query times
- Error rate (last 24h)
- Uptime percentage

#### Purchase Metrics
- Purchases per hour
- Success rate
- Conflict rate (409 responses)
- Average purchase value

#### Email Metrics
- Emails sent per hour
- Delivery rate
- Failed emails (last 24h)

#### Webhook Metrics
- Webhooks processed per hour
- Success rate
- Retry rate
- Average processing time

#### Recent Errors
- Last 50 errors from logs
- Error frequency by type
- Most common error messages

#### Active Alerts
- Currently triggered alerts
- Alert history (last 7 days)

## Environment Variables

```env
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=... # For uploading source maps
SENTRY_DEV_ENABLED=false # Send events from dev environment

# Slack Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Logging Service (optional)
LOGTAIL_TOKEN=... # For Logtail logging service
```

## Database Tables

### platform_metrics

Stores all performance and business metrics.

```sql
CREATE TABLE platform_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT NOT NULL, -- 'count', 'ms', 'bytes', 'percent', 'dollars'
  tags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platform_metrics_name_created ON platform_metrics(metric_name, created_at DESC);
CREATE INDEX idx_platform_metrics_created ON platform_metrics(created_at DESC);
```

### platform_alerts

Stores triggered alerts.

```sql
CREATE TABLE platform_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_name TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'info', 'warning', 'error', 'critical'
  message TEXT NOT NULL,
  value NUMERIC,
  threshold NUMERIC,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id)
);

CREATE INDEX idx_platform_alerts_triggered ON platform_alerts(triggered_at DESC);
CREATE INDEX idx_platform_alerts_name ON platform_alerts(alert_name);
```

## Alert Response Procedures

### Critical Alerts

**Purchase Failure Rate > 5%**
1. Check Sentry for error details
2. Review recent code deployments
3. Check Stripe dashboard for payment issues
4. Verify database connectivity
5. Roll back if recent deployment

**Stripe Webhook Failure > 5%**
1. Check Stripe webhook dashboard
2. Verify webhook endpoint is accessible
3. Check for signature verification issues
4. Review recent Stripe API changes

**Error Rate > 5%**
1. Check Sentry error dashboard
2. Identify common error patterns
3. Check for external service outages
4. Review recent deployments

### Warning Alerts

**Slow API Response (10+ requests > 5s)**
1. Check database query performance
2. Review N+1 query issues
3. Check external API response times
4. Consider adding caching

**Email Failure Rate > 10%**
1. Check Resend dashboard
2. Verify email templates
3. Check for bounce/spam issues
4. Review email sending limits

## Best Practices

### 1. Always Use Structured Logging

```typescript
// ❌ Bad
console.log('User purchased lead', leadId)

// ✅ Good
logger.info('User purchased lead', {
  user_id: userId,
  workspace_id: workspaceId,
  lead_id: leadId,
  amount: purchaseAmount,
})
```

### 2. Capture Errors with Context

```typescript
// ❌ Bad
catch (error) {
  console.error(error)
}

// ✅ Good
catch (error) {
  captureError(error as Error, {
    tags: { operation: 'purchase', workspace_id: workspaceId },
    extra: { leadIds, creditBalance },
  })
  logger.error('Purchase failed', { workspace_id: workspaceId }, error as Error)
}
```

### 3. Use Performance Tracking

```typescript
// ❌ Bad
const leads = await fetchLeads()

// ✅ Good
const leads = await measure(
  'fetch-leads',
  async () => await fetchLeads(),
  { workspace_id: workspaceId }
)
```

### 4. Set User Context

```typescript
// After user authenticates
setUser({ id: user.id, email: user.email })
setWorkspace(user.workspace_id)
```

### 5. Track Business Metrics

```typescript
import { metrics } from '@/lib/monitoring/metrics'

// Track purchases
metrics.trackPurchase(amount, 'lead')

// Track uploads
metrics.trackUpload(leadCount, partnerId)

// Track payouts
metrics.trackPayout(amount, 'completed')
```

## Troubleshooting

### Sentry Not Capturing Errors

1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set
2. Check if errors are being filtered by `beforeSend`
3. Enable debug mode: Set `debug: true` in Sentry.init()
4. Check browser console for Sentry errors

### Metrics Not Showing in Dashboard

1. Verify `platform_metrics` table exists
2. Check if metrics are being recorded:
   ```sql
   SELECT * FROM platform_metrics ORDER BY created_at DESC LIMIT 10;
   ```
3. Verify API routes are accessible
4. Check browser console for fetch errors

### Slack Alerts Not Sending

1. Verify `SLACK_WEBHOOK_URL` is set
2. Test webhook URL with curl:
   ```bash
   curl -X POST $SLACK_WEBHOOK_URL -d '{"text":"Test"}'
   ```
3. Check alert rules are enabled
4. Verify thresholds are being exceeded

## Adding New Metrics

### 1. Define the Metric

```typescript
// In your service/repository
import { metrics } from '@/lib/monitoring/metrics'

metrics.timing('custom-operation', durationMs, {
  operation_type: 'sync',
  user_id: userId,
})
```

### 2. Add Alert Rule (if needed)

```typescript
// In src/lib/monitoring/alerts.ts
export const ALERT_RULES = {
  // ... existing rules
  customOperationSlow: {
    threshold: 5000,
    window: '5m',
    count: 10,
    action: 'slack',
    severity: 'warning',
    message: 'Custom operation is slow',
    enabled: true,
  },
}
```

### 3. Add to Dashboard (optional)

Update `/admin/monitoring/page.tsx` to display the metric.

## Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Next.js Monitoring Best Practices](https://nextjs.org/docs/advanced-features/measuring-performance)

---

Last Updated: 2026-02-05
