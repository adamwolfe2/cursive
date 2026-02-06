# Monitoring Quick Setup Guide

Get monitoring up and running in 10 minutes.

## Step 1: Install Dependencies (Already Done ✅)

```bash
pnpm add @sentry/nextjs
```

## Step 2: Set Up Sentry (5 minutes)

### 2.1 Create Sentry Account
1. Go to https://sentry.io
2. Sign up or log in
3. Click "Create Project"
4. Select "Next.js"
5. Name it "Cursive Platform"
6. Copy the DSN (looks like `https://xxx@xxx.ingest.sentry.io/xxx`)

### 2.2 Add Environment Variables

Add to Vercel environment variables (or `.env.local` for local development):

```env
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

That's it! Sentry will auto-initialize on next deployment.

## Step 3: Set Up Slack Alerts (3 minutes)

### 3.1 Create Slack Webhook
1. Go to https://api.slack.com/messaging/webhooks
2. Click "Create your Slack app"
3. Choose "From scratch"
4. Name it "Cursive Monitoring"
5. Select your workspace
6. Click "Incoming Webhooks"
7. Toggle "Activate Incoming Webhooks" to ON
8. Click "Add New Webhook to Workspace"
9. Select the channel for alerts (e.g., #cursive-alerts)
10. Copy the webhook URL

### 3.2 Add Environment Variable

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

## Step 4: Apply Database Migration (2 minutes)

### Option A: Using Supabase CLI (Recommended)

```bash
supabase db push
```

### Option B: Manual (Supabase Dashboard)

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy contents of `supabase/migrations/20260205_monitoring_tables.sql`
4. Paste and run

## Step 5: Test Everything (3 minutes)

### 5.1 Test Sentry

Add this to any API route and call it:

```typescript
throw new Error('Test Sentry error tracking')
```

Check Sentry dashboard - error should appear within seconds.

### 5.2 Test Slack Alerts

Run this in a server component or API route:

```typescript
import { testAlert } from '@/lib/monitoring/alerts'
await testAlert('purchaseFailureRate')
```

Check Slack channel - alert should appear immediately.

### 5.3 Test Dashboard

1. Navigate to `/admin/monitoring`
2. Verify metrics are loading
3. Check for any console errors

## Step 6: Deploy

```bash
git add .
git commit -m "Add comprehensive monitoring system"
git push
```

Vercel will auto-deploy.

## Verify Deployment

After deployment:

1. **Check Sentry:** Trigger an error and verify it appears in Sentry
2. **Check Slack:** Trigger an alert and verify it appears in Slack
3. **Check Dashboard:** Navigate to `/admin/monitoring` and verify metrics load
4. **Check Logs:** Look for structured logs in Vercel logs

## Optional: Configure Source Maps

For better error tracking in Sentry:

```env
SENTRY_AUTH_TOKEN=your-auth-token
```

Get auth token from: https://sentry.io/settings/account/api/auth-tokens/

## Common Issues

### Sentry Not Capturing Errors

**Solution:** Verify `NEXT_PUBLIC_SENTRY_DSN` is set in Vercel environment variables.

### Slack Alerts Not Sending

**Solution:**
1. Verify `SLACK_WEBHOOK_URL` is set
2. Test webhook with curl:
   ```bash
   curl -X POST $SLACK_WEBHOOK_URL -d '{"text":"Test message"}'
   ```

### Dashboard Not Loading

**Solution:**
1. Verify migration was applied: `SELECT * FROM platform_metrics LIMIT 1;`
2. Check browser console for errors
3. Verify admin access

### Metrics Not Recording

**Solution:**
1. Check if `platform_metrics` table exists
2. Verify RLS policies allow service role to insert
3. Check Vercel logs for errors

## Next Steps

### Week 1: Monitor Baseline

- Watch the dashboard to understand normal metrics
- Adjust alert thresholds if needed
- Test alert response procedures

### Week 2: Migrate Critical Routes

Start using the monitoring in critical API routes:

```typescript
import { createApiRoute } from '@/lib/utils/api-wrapper'

export const POST = createApiRoute(
  async (req, context) => {
    // Your logic
  },
  { name: 'endpoint-name' }
)
```

### Week 3: Full Migration

Migrate all routes and services to use structured logging and performance tracking.

## Quick Reference

### Import Monitoring Tools

```typescript
// Error tracking
import { captureError, setUser } from '@/lib/monitoring/sentry'

// Performance
import { measure } from '@/lib/monitoring/performance'

// Logging
import { logger } from '@/lib/monitoring/logger'

// Metrics
import { metrics } from '@/lib/monitoring/metrics'

// API wrapper
import { createApiRoute } from '@/lib/utils/api-wrapper'
```

### Log an Error

```typescript
logger.error('Operation failed', { workspace_id }, error)
```

### Track Performance

```typescript
const result = await measure('operation-name', async () => {
  return await doWork()
})
```

### Capture Error in Sentry

```typescript
captureError(error, {
  tags: { operation: 'purchase' },
  extra: { leadId, workspaceId }
})
```

### Track Business Metric

```typescript
metrics.increment('purchase.count', 1, { type: 'lead' })
```

## Support

- **Documentation:** `/docs/MONITORING_GUIDE.md`
- **Examples:** `/docs/MONITORING_MIGRATION_EXAMPLES.md`
- **Summary:** `/MONITORING_COMPLETE.md`

---

**Total Setup Time:** ~15 minutes
**Impact:** 0% → 100% error visibility
**Detection Time:** Hours → Seconds

✅ You're now monitoring production!
