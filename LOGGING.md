## Comprehensive Logging Guide

Complete guide to the OpenInfo platform's structured logging system.

## Overview

The platform uses **Pino** for high-performance structured logging with:

- **Structured JSON logs** in production
- **Pretty-printed logs** in development
- **Automatic request/response logging**
- **Security event tracking**
- **Performance monitoring**
- **Error tracking with context**
- **Business event logging**

## Log Levels

```
trace   - Very detailed debug (rarely used)
debug   - Detailed debug information
info    - General informational messages
warn    - Warning messages (potential issues)
error   - Error messages (actual problems)
fatal   - Fatal errors (app crashes)
```

## Quick Start

### Basic Logging

```typescript
import { logger } from '@/lib/logging/logger'

// Info
logger.info('User logged in')

// With context
logger.info({ userId: '123', email: 'user@example.com' }, 'User logged in')

// Warning
logger.warn({ credits: 1 }, 'Low credits remaining')

// Error
logger.error({ error: err }, 'Failed to process payment')
```

### Specialized Logging Functions

```typescript
import {
  logRequest,
  logResponse,
  logError,
  logSecurityEvent,
  logBusinessEvent,
  logPerformance,
} from '@/lib/logging/logger'

// Log HTTP request
logRequest({
  method: 'POST',
  url: '/api/leads',
  userId: '123',
  workspaceId: 'workspace-456',
  ip: '1.2.3.4',
})

// Log HTTP response
logResponse({
  method: 'POST',
  url: '/api/leads',
  status: 201,
  duration: 145,
  userId: '123',
  workspaceId: 'workspace-456',
})

// Log error with full context
logError(new Error('Database connection failed'), {
  operation: 'fetchLeads',
  userId: '123',
  workspaceId: 'workspace-456',
})

// Log security event
logSecurityEvent({
  type: 'rate_limit_exceeded',
  userId: '123',
  ip: '1.2.3.4',
  details: {
    endpoint: '/api/people-search',
    limit: 10,
  },
})

// Log business event
logBusinessEvent({
  type: 'lead_generated',
  userId: '123',
  workspaceId: 'workspace-456',
  metadata: {
    leadId: 'lead-789',
    queryId: 'query-101',
  },
})

// Log performance
logPerformance({
  operation: 'people_search',
  duration: 1450,
  success: true,
  metadata: {
    resultCount: 25,
  },
})
```

## API Route Logging

### Automatic Logging with Middleware

```typescript
import { withLogging } from '@/lib/middleware/logging'

export const GET = withLogging(async (req: NextRequest) => {
  // Your handler code
  const data = await fetchData()
  return NextResponse.json({ data })
})

// Automatically logs:
// - Request (method, URL, headers, IP)
// - Response (status, duration)
// - Errors (if any)
```

### Manual Logging in Routes

```typescript
import { logger } from '@/lib/logging/logger'
import { logBusinessEvent } from '@/lib/logging/logger'

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await req.json()

    // Log business logic
    logger.debug({ body }, 'Processing query creation')

    const query = await createQuery(body)

    // Log business event
    logBusinessEvent({
      type: 'query_created',
      userId: user.id,
      workspaceId: user.workspace_id,
      metadata: { queryId: query.id },
    })

    const duration = Date.now() - startTime
    logger.info({ duration, queryId: query.id }, 'Query created successfully')

    return NextResponse.json({ query })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error({ duration, error }, 'Failed to create query')
    throw error
  }
}
```

## Performance Monitoring

### Measure Async Operations

```typescript
import { measureAsync } from '@/lib/logging/performance'

async function searchPeople(filters: any) {
  return measureAsync(
    'people_search',
    async () => {
      // Actual search logic
      const results = await api.search(filters)
      return results
    },
    { filterCount: Object.keys(filters).length }
  )
}
```

### Measure Sync Operations

```typescript
import { measureSync } from '@/lib/logging/performance'

function processData(data: any[]) {
  return measureSync(
    'data_processing',
    () => {
      // Processing logic
      return data.map(transform)
    },
    { itemCount: data.length }
  )
}
```

### Performance Markers

```typescript
import { PerformanceMonitor } from '@/lib/logging/performance'

async function complexOperation() {
  const monitor = new PerformanceMonitor('complex_operation')

  monitor.mark('fetch_data')
  const data = await fetchData()
  monitor.measure('fetch_data', { itemCount: data.length })

  monitor.mark('process_data')
  const processed = processData(data)
  monitor.measure('process_data')

  monitor.mark('save_data')
  await saveData(processed)
  monitor.measure('save_data')
}
```

### Performance Budgets

```typescript
import { budgetChecker } from '@/lib/logging/performance'

const startTime = Date.now()
const results = await searchPeople(filters)
const duration = Date.now() - startTime

// Check if within budget (3000ms for people search)
const withinBudget = budgetChecker.check('api.people-search', duration)

if (!withinBudget) {
  // Alert or log warning
  console.warn('Performance budget exceeded!')
}
```

## Error Handling

### Structured Error Classes

```typescript
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
} from '@/lib/logging/error-handler'

// Validation error
throw new ValidationError('Invalid email format', {
  field: 'email',
  value: 'invalid',
})

// Authentication error
throw new AuthenticationError('Invalid credentials')

// Not found
throw new NotFoundError('Lead')

// Rate limit
throw new RateLimitError('Too many requests', 60)
```

### Error Handler

```typescript
import { handleError } from '@/lib/logging/error-handler'

export async function POST(req: NextRequest) {
  try {
    // Your logic
    return NextResponse.json({ success: true })
  } catch (error) {
    // Automatically logs error and returns appropriate response
    return handleError(error, {
      endpoint: '/api/leads',
      userId: user?.id,
    })
  }
}
```

### Async Handler Wrapper

```typescript
import { asyncHandler } from '@/lib/logging/error-handler'

export const POST = asyncHandler(async (req: NextRequest) => {
  // Your logic - errors automatically handled
  const data = await createLead(body)
  return NextResponse.json({ data })
})
```

## Security Event Logging

### Auth Failures

```typescript
logSecurityEvent({
  type: 'auth_failed',
  ip: '1.2.3.4',
  details: {
    endpoint: '/api/protected',
    error: 'Invalid token',
  },
})
```

### Rate Limit Violations

```typescript
logSecurityEvent({
  type: 'rate_limit_exceeded',
  userId: '123',
  ip: '1.2.3.4',
  details: {
    endpoint: '/api/people-search',
    limit: 10,
    retryAfter: 45,
  },
})
```

### Suspicious Activity

```typescript
logSecurityEvent({
  type: 'suspicious_activity',
  userId: '123',
  workspaceId: 'workspace-456',
  details: {
    type: 'multiple_failed_logins',
    count: 5,
    timeWindow: '5 minutes',
  },
})
```

## Business Event Logging

### Lead Events

```typescript
logBusinessEvent({
  type: 'lead_generated',
  userId: '123',
  workspaceId: 'workspace-456',
  metadata: {
    leadId: 'lead-789',
    queryId: 'query-101',
    source: 'datashopper',
  },
})
```

### Query Events

```typescript
logBusinessEvent({
  type: 'query_created',
  userId: '123',
  workspaceId: 'workspace-456',
  metadata: {
    queryId: 'query-101',
    topic: 'AI automation tools',
  },
})
```

### Subscription Events

```typescript
logBusinessEvent({
  type: 'subscription_created',
  userId: '123',
  workspaceId: 'workspace-456',
  metadata: {
    plan: 'pro',
    stripeSubscriptionId: 'sub_123',
  },
})
```

## Database Query Logging

```typescript
import { logQuery } from '@/lib/logging/logger'

async function fetchLeads(workspaceId: string) {
  const startTime = Date.now()

  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('workspace_id', workspaceId)

  logQuery({
    table: 'leads',
    operation: 'select',
    duration: Date.now() - startTime,
    rowCount: data?.length || 0,
  })

  return data
}
```

## Background Job Logging

```typescript
import { logJob } from '@/lib/logging/logger'

export const processLeads = inngest.createFunction(
  { id: 'process-leads' },
  { event: 'leads/process' },
  async ({ event, step }) => {
    const startTime = Date.now()

    logJob({
      name: 'process-leads',
      status: 'started',
      metadata: { leadCount: event.data.leads.length },
    })

    try {
      await step.run('process', async () => {
        // Processing logic
      })

      logJob({
        name: 'process-leads',
        status: 'completed',
        duration: Date.now() - startTime,
        metadata: { leadCount: event.data.leads.length },
      })
    } catch (error) {
      logJob({
        name: 'process-leads',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error as Error,
      })
      throw error
    }
  }
)
```

## Log Output Formats

### Development (Pretty Print)

```
[15:34:22 Z] INFO: User logged in
    userId: "123"
    email: "user@example.com"

[15:34:23 Z] ERROR: Database connection failed
    operation: "fetchLeads"
    error: {
      name: "ConnectionError"
      message: "Connection timeout"
    }
```

### Production (JSON)

```json
{
  "level": "info",
  "time": "2024-01-22T15:34:22.000Z",
  "env": "production",
  "app": "openinfo",
  "version": "1.0.0",
  "userId": "123",
  "email": "user@example.com",
  "msg": "User logged in"
}

{
  "level": "error",
  "time": "2024-01-22T15:34:23.000Z",
  "env": "production",
  "app": "openinfo",
  "version": "1.0.0",
  "operation": "fetchLeads",
  "error": {
    "name": "ConnectionError",
    "message": "Connection timeout",
    "stack": "..."
  },
  "msg": "Database connection failed"
}
```

## Sensitive Data Redaction

```typescript
import { redactSensitive } from '@/lib/logging/logger'

const userData = {
  email: 'user@example.com',
  password: 'secret123',
  apiKey: 'sk_test_123',
  profile: {
    name: 'John',
    creditCard: '4242-4242-4242-4242',
  },
}

const safe = redactSensitive(userData)
// {
//   email: 'user@example.com',
//   password: '[REDACTED]',
//   apiKey: '[REDACTED]',
//   profile: {
//     name: 'John',
//     creditCard: '[REDACTED]'
//   }
// }

logger.info(safe, 'User data processed')
```

## Child Loggers (Context Binding)

```typescript
import { createLogger } from '@/lib/logging/logger'

// Create logger with workspace context
const workspaceLogger = createLogger({
  workspaceId: 'workspace-456',
  userId: '123',
})

// All logs include workspace context
workspaceLogger.info('Query created')
// Output: { workspaceId: 'workspace-456', userId: '123', msg: 'Query created' }

workspaceLogger.error({ error }, 'Failed to fetch leads')
// Output: { workspaceId: 'workspace-456', userId: '123', error: {...}, msg: 'Failed to fetch leads' }
```

## Log Aggregation

### Vercel Log Drains

Add in Vercel dashboard under project settings:

```
Log Drain URL: https://logs.example.com/vercel
Format: JSON
```

### Common Providers

- **Datadog**: `https://http-intake.logs.datadoghq.com/v1/input/<API_KEY>`
- **Logtail**: `https://in.logtail.com/<SOURCE_TOKEN>`
- **Papertrail**: `logs.papertrailapp.com:<PORT>`
- **Logflare**: `https://api.logflare.app/logs?api_key=<KEY>`

### Self-Hosted (Loki)

```yaml
# docker-compose.yml
version: '3'
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
```

## Monitoring & Alerts

### Track Error Rates

```sql
-- Query logs for errors (if stored in database)
SELECT
  DATE_TRUNC('hour', time) as hour,
  COUNT(*) as error_count
FROM logs
WHERE level = 'error'
  AND time > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC
```

### Track Performance

```sql
-- Query performance logs
SELECT
  operation,
  AVG(duration) as avg_duration,
  MAX(duration) as max_duration,
  COUNT(*) as count
FROM logs
WHERE type = 'performance'
  AND time > NOW() - INTERVAL '24 hours'
GROUP BY operation
ORDER BY avg_duration DESC
```

### Alert Rules

Set up alerts for:

- Error rate > 10/minute
- Performance budget exceeded > 20%
- Security events (auth failures, rate limits)
- Fatal errors (immediate alert)

## Best Practices

1. **Always include context** - user ID, workspace ID, request ID
2. **Use appropriate log levels** - don't log info as error
3. **Redact sensitive data** - passwords, tokens, credit cards
4. **Log structured data** - JSON objects, not concatenated strings
5. **Include timestamps** - automatic with Pino
6. **Log request/response** - helps with debugging
7. **Log business events** - useful for analytics
8. **Don't log in hot loops** - performance impact
9. **Use child loggers** - maintain context
10. **Monitor log volume** - avoid excessive logging

## Debugging Tips

### Enable Debug Logs Locally

```bash
# .env.local
LOG_LEVEL=debug
```

### Filter Logs by Type

```bash
# Development
pnpm dev | grep "type.*request"

# Production (JSON)
cat logs.json | jq 'select(.type == "request")'
```

### Search for User Actions

```bash
# Find all logs for specific user
cat logs.json | jq 'select(.userId == "123")'
```

### Performance Analysis

```bash
# Find slow operations (> 1000ms)
cat logs.json | jq 'select(.type == "performance" and .duration > 1000)'
```

---

**Last Updated**: 2026-01-22
