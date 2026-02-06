# Monitoring Migration Examples

Examples of how to migrate existing API routes and code to use the new monitoring system.

## API Route Migration

### Before (No Monitoring)

```typescript
// src/app/api/marketplace/leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { leadIds } = await req.json()

    // Purchase leads
    const { data, error } = await supabase
      .from('marketplace_purchases')
      .insert({ lead_ids: leadIds })

    if (error) {
      console.error('Purchase failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### After (With Monitoring)

```typescript
// src/app/api/marketplace/leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiRoute } from '@/lib/utils/api-wrapper'
import { logger } from '@/lib/monitoring/logger'
import { measure } from '@/lib/monitoring/performance'
import { metrics } from '@/lib/monitoring/metrics'

async function handler(req: NextRequest) {
  const supabase = createClient()
  const { leadIds } = await req.json()

  // Log the request
  logger.info('Purchase leads request', {
    lead_count: leadIds.length,
  })

  // Measure performance
  const result = await measure(
    'purchase-leads',
    async () => {
      const { data, error } = await supabase
        .from('marketplace_purchases')
        .insert({ lead_ids: leadIds })

      if (error) throw error
      return data
    },
    { lead_count: leadIds.length }
  )

  // Track business metric
  metrics.increment('purchase.count', 1, { type: 'lead' })

  logger.info('Purchase completed', {
    lead_count: leadIds.length,
    purchase_id: result.id,
  })

  return NextResponse.json({ data: result })
}

// Wrap with automatic monitoring
export const POST = createApiRoute(handler, { name: 'purchase-leads' })
```

**Benefits:**
- Automatic error capture in Sentry
- Performance tracking
- Request/response logging
- Business metrics
- No need for try/catch (handled by wrapper)

## Background Job Migration

### Before (No Monitoring)

```typescript
// src/inngest/process-purchase.ts
export const processPurchase = inngest.createFunction(
  { id: 'process-purchase' },
  { event: 'marketplace/purchase.created' },
  async ({ event }) => {
    console.log('Processing purchase:', event.data.purchaseId)

    const leads = await fetchLeads(event.data.leadIds)
    await sendEmailNotification(event.data.userId)

    console.log('Purchase processed')
  }
)
```

### After (With Monitoring)

```typescript
// src/inngest/process-purchase.ts
import { logger } from '@/lib/monitoring/logger'
import { measure } from '@/lib/monitoring/performance'
import { metrics } from '@/lib/monitoring/metrics'

export const processPurchase = inngest.createFunction(
  { id: 'process-purchase', retries: 3 },
  { event: 'marketplace/purchase.created' },
  async ({ event, step }) => {
    const { purchaseId, leadIds, userId } = event.data

    logger.job({
      jobName: 'process-purchase',
      status: 'started',
      context: { purchaseId, leadCount: leadIds.length },
    })

    const startTime = Date.now()

    try {
      // Step 1: Fetch leads
      const leads = await step.run('fetch-leads', async () => {
        return await measure(
          'job-fetch-leads',
          async () => await fetchLeads(leadIds),
          { lead_count: leadIds.length }
        )
      })

      // Step 2: Send notification
      await step.run('send-notification', async () => {
        return await measure(
          'job-send-notification',
          async () => await sendEmailNotification(userId),
          { user_id: userId }
        )
      })

      // Log success
      const duration = Date.now() - startTime
      logger.job({
        jobName: 'process-purchase',
        status: 'completed',
        duration,
        context: { purchaseId, leadCount: leads.length },
      })

      // Track metric
      metrics.timing('job.process-purchase', duration, {
        status: 'success',
      })

      return { success: true, leadCount: leads.length }
    } catch (error) {
      // Log failure
      const duration = Date.now() - startTime
      logger.job({
        jobName: 'process-purchase',
        status: 'failed',
        duration,
        error: error as Error,
        context: { purchaseId },
      })

      // Track failure
      metrics.increment('job.failure', 1, { job: 'process-purchase' })

      throw error // Re-throw for Inngest retry
    }
  }
)
```

## Service/Repository Migration

### Before (Console Logging)

```typescript
// src/lib/services/purchase.service.ts
export class PurchaseService {
  async purchaseLeads(leadIds: string[], workspaceId: string) {
    console.log('Purchasing leads:', leadIds.length)

    try {
      const result = await this.supabase
        .from('marketplace_purchases')
        .insert({ lead_ids: leadIds, workspace_id: workspaceId })

      console.log('Purchase successful')
      return result
    } catch (error) {
      console.error('Purchase failed:', error)
      throw error
    }
  }
}
```

### After (Structured Logging)

```typescript
// src/lib/services/purchase.service.ts
import { logger } from '@/lib/monitoring/logger'
import { measure } from '@/lib/monitoring/performance'
import { metrics } from '@/lib/monitoring/metrics'
import { captureError } from '@/lib/monitoring/sentry'

export class PurchaseService {
  async purchaseLeads(leadIds: string[], workspaceId: string) {
    logger.info('Purchasing leads', {
      workspace_id: workspaceId,
      lead_count: leadIds.length,
    })

    try {
      const result = await measure(
        'service-purchase-leads',
        async () => {
          return await this.supabase
            .from('marketplace_purchases')
            .insert({ lead_ids: leadIds, workspace_id: workspaceId })
        },
        { workspace_id: workspaceId, lead_count: leadIds.length }
      )

      logger.info('Purchase successful', {
        workspace_id: workspaceId,
        lead_count: leadIds.length,
        purchase_id: result.data?.id,
      })

      // Track business metric
      metrics.trackPurchase(leadIds.length * 100, 'lead') // Assuming $1 per lead

      return result
    } catch (error) {
      logger.error(
        'Purchase failed',
        { workspace_id: workspaceId, lead_count: leadIds.length },
        error as Error
      )

      // Capture in Sentry
      captureError(error as Error, {
        tags: {
          service: 'purchase',
          workspace_id: workspaceId,
        },
        extra: {
          leadCount: leadIds.length,
        },
      })

      throw error
    }
  }
}
```

## React Component (User Context)

### After Login

```typescript
// src/app/(auth)/login/page.tsx
import { setUser, setWorkspace } from '@/lib/monitoring/sentry'

async function handleLogin(email: string, password: string) {
  const { data } = await supabase.auth.signInWithPassword({ email, password })

  if (data.user) {
    // Set user context in Sentry
    setUser({
      id: data.user.id,
      email: data.user.email,
    })

    // Get workspace and set context
    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', data.user.id)
      .single()

    if (userData?.workspace_id) {
      setWorkspace(userData.workspace_id)
    }
  }
}
```

## Database Query Migration

### Before (No Monitoring)

```typescript
async function getLeads(workspaceId: string) {
  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('workspace_id', workspaceId)

  return data
}
```

### After (With Monitoring)

```typescript
import { measure } from '@/lib/monitoring/performance'
import { logger } from '@/lib/monitoring/logger'

async function getLeads(workspaceId: string) {
  return await measure(
    'db-query-leads',
    async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('workspace_id', workspaceId)

      if (error) {
        logger.error('Failed to fetch leads', { workspace_id: workspaceId }, error)
        throw error
      }

      logger.debug('Fetched leads', {
        workspace_id: workspaceId,
        count: data.length,
      })

      return data
    },
    { workspace_id: workspaceId }
  )
}
```

## Error Handling Migration

### Before (Generic Errors)

```typescript
try {
  await riskyOperation()
} catch (error) {
  console.error('Operation failed:', error)
  return { error: 'Something went wrong' }
}
```

### After (Structured Errors)

```typescript
import { logger } from '@/lib/monitoring/logger'
import { captureError } from '@/lib/monitoring/sentry'

try {
  await riskyOperation()
} catch (error) {
  // Log with context
  logger.error(
    'Operation failed',
    {
      operation: 'risky-operation',
      user_id: userId,
      workspace_id: workspaceId,
    },
    error as Error
  )

  // Capture in Sentry with full context
  captureError(error as Error, {
    tags: {
      operation: 'risky-operation',
      workspace_id: workspaceId,
    },
    extra: {
      userId,
      timestamp: new Date().toISOString(),
    },
  })

  return {
    error:
      process.env.NODE_ENV === 'development'
        ? (error as Error).message
        : 'Operation failed. Please try again.',
  }
}
```

## Gradual Migration Strategy

### Phase 1: Critical Paths (Week 1)
1. Purchase flow API routes
2. Payment processing
3. Email sending
4. Authentication

### Phase 2: High Traffic (Week 2)
1. Lead listing endpoints
2. Search endpoints
3. Dashboard metrics
4. Background jobs

### Phase 3: Everything Else (Week 3)
1. Admin routes
2. Settings endpoints
3. Integration webhooks
4. Utility functions

## Testing Migration

### Test Error Capture

```typescript
// In any API route or function
import { captureMessage } from '@/lib/monitoring/sentry'

// Test message
captureMessage('Test error tracking', 'info', {
  tags: { test: 'true' },
})

// Test error
try {
  throw new Error('Test error from development')
} catch (error) {
  captureError(error as Error, {
    tags: { test: 'true' },
  })
}
```

### Test Performance Tracking

```typescript
// Simulate slow operation
import { measure } from '@/lib/monitoring/performance'

await measure(
  'test-slow-operation',
  async () => {
    await new Promise((resolve) => setTimeout(resolve, 6000)) // 6s
  }
)

// Should trigger slow operation alert if threshold is 5s
```

### Test Metrics

```typescript
import { metrics } from '@/lib/monitoring/metrics'

// Record test metrics
metrics.increment('test.counter', 1)
metrics.timing('test.duration', 1234)
metrics.gauge('test.value', 42)

// Verify in database
// SELECT * FROM platform_metrics WHERE metric_name LIKE 'test.%'
```

## Quick Reference

### Import Statements

```typescript
// Error tracking
import { captureError, captureMessage, setUser } from '@/lib/monitoring/sentry'

// Performance
import { measure, startTimer, endTimer } from '@/lib/monitoring/performance'

// Logging
import { logger } from '@/lib/monitoring/logger'

// Metrics
import { metrics } from '@/lib/monitoring/metrics'

// API wrapper
import { createApiRoute } from '@/lib/utils/api-wrapper'

// Alerts
import { sendSlackAlert, testAlert } from '@/lib/monitoring/alerts'
```

### Common Patterns

```typescript
// Wrap async operation
const result = await measure('operation-name', async () => {
  return await doSomething()
}, { context: 'data' })

// Log with levels
logger.debug('Debug info', { key: 'value' })
logger.info('Info message', { key: 'value' })
logger.warn('Warning', { key: 'value' })
logger.error('Error occurred', { key: 'value' }, error)

// Track metrics
metrics.increment('counter.name', 1)
metrics.timing('operation.duration', durationMs)
metrics.gauge('current.value', 100)

// Capture errors
captureError(error, {
  tags: { tag_key: 'tag_value' },
  extra: { extra_key: 'extra_value' },
})
```

---

**Last Updated:** 2026-02-05
