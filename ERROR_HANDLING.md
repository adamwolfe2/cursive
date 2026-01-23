# Error Handling Guide

Comprehensive guide to error handling in OpenInfo platform.

## Overview

The platform implements multiple layers of error handling:

1. **Client-side errors**: React Error Boundaries
2. **API errors**: Structured error responses
3. **Database errors**: Graceful fallbacks
4. **Network errors**: Retry logic
5. **User-facing errors**: Friendly error messages
6. **Error logging**: Structured logging
7. **Error tracking**: Analytics integration

## Error Pages

### 404 Not Found

Located at `/not-found.tsx`:

- Clean, branded design
- Links to homepage and dashboard
- Helpful messaging

### Error Page

Located at `/error.tsx`:

- Catches all client-side errors
- Logs error automatically
- Shows friendly message to users
- Retry button
- Development mode shows error details

### Global Error

Located at `/global-error.tsx`:

- Catches root-level errors
- Last resort error handler
- Logs fatal errors
- Reload application button

## Error Boundaries

### Component-Level

```tsx
import { ErrorBoundary } from '@/components/error-boundary'

<ErrorBoundary
  fallback={(error, resetError) => (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={resetError}>Try again</button>
    </div>
  )}
>
  <MyComponent />
</ErrorBoundary>
```

### Route-Level

Next.js automatically wraps routes in error boundaries via `error.tsx` files.

### Custom Error Boundary

```tsx
class MyErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }

    return this.props.children
  }
}
```

## API Error Handling

### Error Response Format

All API errors follow this structure:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "errors": [] // Optional validation errors
}
```

### Custom Error Classes

```typescript
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
} from '@/lib/logging/error-handler'

// Validation
throw new ValidationError('Invalid email', { field: 'email' })

// Authentication
throw new AuthenticationError('Invalid credentials')

// Not found
throw new NotFoundError('Lead')

// Rate limit
throw new RateLimitError('Too many requests', 60)
```

### API Route Error Handling

```typescript
import { handleError } from '@/lib/logging/error-handler'

export async function POST(req: NextRequest) {
  try {
    // Your logic
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleError(error, {
      endpoint: '/api/leads',
      userId: user?.id,
    })
  }
}
```

## Client-Side Error Handling

### Try-Catch Pattern

```typescript
async function fetchData() {
  try {
    const response = await fetch('/api/data')

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    logError(error, { operation: 'fetchData' })
    toast.error('Failed to fetch data. Please try again.')
    return null
  }
}
```

### React Query Error Handling

```typescript
const { data, error, isError } = useQuery({
  queryKey: ['leads'],
  queryFn: fetchLeads,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  onError: (error) => {
    logError(error, { query: 'leads' })
    toast.error('Failed to load leads')
  },
})

if (isError) {
  return <ErrorState error={error} />
}
```

### Form Error Handling

```typescript
const { handleSubmit, setError, formState: { errors } } = useForm()

const onSubmit = async (data: FormData) => {
  try {
    await submitForm(data)
    toast.success('Form submitted successfully')
  } catch (error) {
    if (error instanceof ValidationError) {
      // Set field-level errors
      error.errors.forEach(err => {
        setError(err.field, { message: err.message })
      })
    } else {
      // Show general error
      toast.error('Failed to submit form')
    }
  }
}
```

## Network Error Handling

### Retry Logic

```typescript
import { retry } from '@/lib/utils/retry'

const data = await retry(
  () => fetch('/api/data').then(res => res.json()),
  {
    maxRetries: 3,
    baseDelay: 1000,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}`, error)
    },
  }
)
```

### Timeout Handling

```typescript
async function fetchWithTimeout(url: string, timeout = 10000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    return response.json()
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
```

## Error Logging

### Structured Logging

```typescript
import { logError } from '@/lib/logging/logger'

try {
  await riskyOperation()
} catch (error) {
  logError(error, {
    operation: 'riskyOperation',
    userId: user.id,
    context: {
      input: data,
      state: currentState,
    },
  })
  throw error
}
```

### Error Levels

```typescript
logger.warn('Low priority issue')    // Non-critical
logger.error('Error occurred')       // Error but recoverable
logger.fatal('Critical failure')     // App-breaking error
```

## User-Facing Errors

### Toast Notifications

```typescript
import { toast } from '@/components/ui/toast'

// Error
toast.error('Failed to save changes')

// With action
toast.error('Failed to delete lead', {
  action: {
    label: 'Retry',
    onClick: () => deleteLeadAgain(),
  },
})
```

### Alert Components

```tsx
import { Alert } from '@/components/ui/alert'

{error && (
  <Alert variant="error" title="Error">
    {error.message}
  </Alert>
)}
```

### Inline Errors

```tsx
<FormField
  label="Email"
  error={errors.email?.message}
>
  <input {...register('email')} />
</FormField>
```

## Error Recovery

### Automatic Recovery

```typescript
// Retry with exponential backoff
const { data, error } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
})
```

### Manual Recovery

```typescript
function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={onRetry}>Try Again</button>
    </div>
  )
}
```

## Database Error Handling

### Supabase Errors

```typescript
const { data, error } = await supabase
  .from('leads')
  .select('*')
  .eq('workspace_id', workspaceId)

if (error) {
  if (error.code === '23505') {
    throw new ConflictError('Lead already exists')
  } else if (error.code === '42501') {
    throw new AuthorizationError('Insufficient permissions')
  } else {
    throw new DatabaseError(error.message)
  }
}
```

### Connection Errors

```typescript
try {
  const data = await fetchFromDatabase()
  return data
} catch (error) {
  if (error.message.includes('connection')) {
    logger.error('Database connection failed')
    // Try backup/replica
    return fetchFromBackup()
  }
  throw error
}
```

## Error Monitoring

### Analytics Integration

```typescript
import { errorEvents } from '@/lib/analytics/events'

try {
  await operation()
} catch (error) {
  errorEvents.errorOccurred(error.message, {
    operation: 'critical_operation',
    userId: user.id,
  })
  throw error
}
```

### Error Reporting

For production, integrate error reporting service:

```typescript
// Sentry example
import * as Sentry from '@sentry/nextjs'

Sentry.captureException(error, {
  extra: {
    userId: user.id,
    context: additionalContext,
  },
})
```

## Error Prevention

### Input Validation

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

try {
  const validated = schema.parse(input)
} catch (error) {
  // Handle validation errors
  if (error instanceof z.ZodError) {
    return validationErrors(error.errors)
  }
}
```

### Type Safety

```typescript
// Use TypeScript strictly
function processLead(lead: Lead): Result {
  // TypeScript ensures lead has required properties
  return {
    id: lead.id,
    company: lead.company_name,
  }
}
```

### Defensive Programming

```typescript
// Check for null/undefined
if (!user || !user.workspace_id) {
  throw new Error('User not found')
}

// Validate inputs
if (quantity < 1 || quantity > 100) {
  throw new Error('Invalid quantity')
}

// Use optional chaining
const email = user?.contact?.email ?? 'unknown'
```

## Common Error Scenarios

### Network Failure

```typescript
if (!navigator.onLine) {
  toast.error('No internet connection')
  return
}

try {
  await fetch('/api/data')
} catch (error) {
  if (error instanceof TypeError) {
    toast.error('Network error. Check your connection.')
  }
}
```

### Authentication Failure

```typescript
if (response.status === 401) {
  // Clear session
  await logout()

  // Redirect to login
  router.push('/login?redirect=' + encodeURIComponent(pathname))

  toast.error('Session expired. Please log in again.')
}
```

### Rate Limit Exceeded

```typescript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After')

  toast.error(
    `Rate limit exceeded. Try again in ${retryAfter} seconds.`
  )
}
```

### Insufficient Credits

```typescript
if (response.status === 402) {
  const { credits } = await response.json()

  toast.error(
    `Insufficient credits. You have ${credits.remaining}/${credits.limit} remaining.`,
    {
      action: {
        label: 'Upgrade',
        onClick: () => router.push('/pricing'),
      },
    }
  )
}
```

## Best Practices

1. **Always catch errors**: Never let errors bubble uncaught
2. **Log errors**: Every error should be logged
3. **User-friendly messages**: Don't show technical errors to users
4. **Provide context**: Include user/session/operation context
5. **Recovery options**: Give users a way to recover (retry, go back)
6. **Monitor in production**: Track error rates and patterns
7. **Test error paths**: Write tests for error scenarios
8. **Document errors**: Document expected errors and handling

## Testing Error Handling

### Unit Tests

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('fetchLeads', () => {
  it('should handle network errors', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))

    const result = await fetchLeads()

    expect(result).toBeNull()
    expect(logError).toHaveBeenCalled()
  })
})
```

### Integration Tests

```typescript
describe('Lead API', () => {
  it('should return 404 for non-existent lead', async () => {
    const response = await fetch('/api/leads/non-existent')

    expect(response.status).toBe(404)

    const body = await response.json()
    expect(body.error).toBe('NOT_FOUND')
  })
})
```

---

**Last Updated**: 2026-01-22
