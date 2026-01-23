# Error Handling & Loading States

Comprehensive guide to error boundaries, loading states, and retry logic in OpenInfo.

## Table of Contents

- [Error Boundaries](#error-boundaries)
- [Loading States](#loading-states)
- [Skeleton Loaders](#skeleton-loaders)
- [Error Display](#error-display)
- [Retry Logic](#retry-logic)
- [Global Error Handler](#global-error-handler)
- [Best Practices](#best-practices)

## Error Boundaries

### ErrorBoundary Component

Catches React errors in component tree and displays fallback UI.

```tsx
import { ErrorBoundary } from '@/components/error-boundary'

// Full page error boundary
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary
  fallback={<div>Custom error UI</div>}
  onError={(error, errorInfo) => {
    // Log to service
    console.error(error, errorInfo)
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### InlineErrorBoundary

Compact error boundary for inline use:

```tsx
import { InlineErrorBoundary } from '@/components/error-boundary'

<InlineErrorBoundary>
  <DataComponent />
</InlineErrorBoundary>
```

## Loading States

### LoadingButton

Button with integrated loading state:

```tsx
import { LoadingButton } from '@/components/loading-button'

<LoadingButton
  loading={isLoading}
  loadingText="Saving..."
  variant="primary" // primary | secondary | danger | ghost
  size="md" // sm | md | lg
  onClick={handleClick}
>
  Save Changes
</LoadingButton>
```

### Spinner

Simple spinner component:

```tsx
import { Spinner } from '@/components/skeletons'

<Spinner size="md" /> // sm | md | lg
```

### LoadingOverlay

Full overlay with spinner:

```tsx
import { LoadingOverlay } from '@/components/skeletons'

<div className="relative">
  <YourContent />
  {isLoading && <LoadingOverlay message="Loading..." />}
</div>
```

## Skeleton Loaders

### Table Skeleton

```tsx
import { TableSkeleton } from '@/components/skeletons'

<TableSkeleton rows={10} columns={8} />
```

### Stats Cards Skeleton

```tsx
import { StatCardsSkeleton } from '@/components/skeletons'

<StatCardsSkeleton count={4} />
```

### Query Card Skeleton

```tsx
import { QueryCardSkeleton } from '@/components/skeletons'

<QueryCardSkeleton />
```

### Form Skeleton

```tsx
import { FormSkeleton } from '@/components/skeletons'

<FormSkeleton fields={4} />
```

### Other Skeletons

- `DetailPanelSkeleton` - For detail panels
- `SearchResultsSkeleton` - For search results
- `ListSkeleton` - For lists
- `PageSkeleton` - Full page skeleton

## Error Display

### ErrorDisplay Component

```tsx
import { ErrorDisplay } from '@/components/error-display'

// Inline variant
<ErrorDisplay
  error="Failed to load data"
  retry={handleRetry}
  variant="inline"
/>

// Card variant
<ErrorDisplay
  error={error}
  retry={handleRetry}
  retrying={isRetrying}
  variant="card"
  title="Connection Error"
/>

// Page variant (full page)
<ErrorDisplay
  error={error}
  retry={handleRetry}
  variant="page"
/>
```

### EmptyState Component

```tsx
import { EmptyState } from '@/components/error-display'

<EmptyState
  title="No queries found"
  description="Get started by creating your first query"
  action={
    <button onClick={handleCreate}>
      Create Query
    </button>
  }
/>
```

## Retry Logic

### Basic Retry

```tsx
import { retry } from '@/lib/utils/retry'

const data = await retry(
  () => fetch('/api/data').then(r => r.json()),
  {
    maxRetries: 3,
    initialDelay: 1000,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}:`, error)
    }
  }
)
```

### Retry with Fetch

```tsx
import { retryFetch, retryFetchJson } from '@/lib/utils/retry'

// With response
const response = await retryFetch('/api/data', {
  method: 'POST',
  body: JSON.stringify(data)
})

// With JSON parsing
const data = await retryFetchJson('/api/data')
```

### useAsync Hook

Hook for managing async operations with retry:

```tsx
import { useAsync } from '@/lib/hooks/use-async'

function MyComponent() {
  const { data, error, loading, execute, reset } = useAsync(
    async (id: string) => {
      const response = await fetch(`/api/data/${id}`)
      return response.json()
    },
    {
      retry: true, // Enable retry
      onSuccess: (data) => console.log('Success:', data),
      onError: (error) => console.error('Error:', error)
    }
  )

  return (
    <div>
      <button onClick={() => execute('123')}>
        Load Data
      </button>
      {loading && <Spinner />}
      {error && <ErrorDisplay error={error} retry={() => execute('123')} />}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}
```

## Global Error Handler

Automatically initialized in the app. Handles:

- Unhandled promise rejections
- Runtime errors
- Network errors
- Server errors

```tsx
// Already initialized in Providers component
// src/lib/utils/global-error-handler.ts

import {
  isNetworkError,
  isServerError,
  getUserFriendlyErrorMessage
} from '@/lib/utils/global-error-handler'

if (isNetworkError(error)) {
  // Handle network error
}

const message = getUserFriendlyErrorMessage(error)
```

## Best Practices

### 1. Always Show Loading States

```tsx
// ❌ Bad
if (isLoading) return null

// ✅ Good
if (isLoading) return <TableSkeleton />
```

### 2. Handle Errors Gracefully

```tsx
// ❌ Bad
const { data } = useQuery({ queryKey: ['data'], queryFn: fetchData })

// ✅ Good
const { data, error, isLoading, refetch } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData
})

if (error) return <ErrorDisplay error={error} retry={refetch} />
if (isLoading) return <Skeleton />
```

### 3. Provide Retry Options

```tsx
// ✅ Always provide retry for async operations
<ErrorDisplay
  error={error}
  retry={handleRetry}
  retrying={isRetrying}
/>
```

### 4. Use Appropriate Variants

```tsx
// Inline errors for form fields
<ErrorDisplay variant="inline" error="Invalid email" />

// Card errors for sections
<ErrorDisplay variant="card" error={error} retry={retry} />

// Page errors for full page failures
<ErrorDisplay variant="page" error={error} />
```

### 5. Wrap Components with Error Boundaries

```tsx
// Wrap entire sections
<ErrorBoundary>
  <DataTable />
</ErrorBoundary>

// Or use inline for smaller components
<InlineErrorBoundary>
  <StatCard />
</InlineErrorBoundary>
```

### 6. Show Empty States

```tsx
if (!data || data.length === 0) {
  return (
    <EmptyState
      title="No data yet"
      description="Get started by adding your first item"
      action={<button>Add Item</button>}
    />
  )
}
```

## Testing

### Test Loading States

```tsx
// Toggle loading state
const [loading, setLoading] = useState(false)

<LoadingButton
  loading={loading}
  onClick={() => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }}
>
  Test
</LoadingButton>
```

### Test Error States

```tsx
// Simulate error
const [error, setError] = useState<Error | null>(null)

<button onClick={() => setError(new Error('Test error'))}>
  Trigger Error
</button>

{error && <ErrorDisplay error={error} retry={() => setError(null)} />}
```

### UI Showcase

View all components at once:

```tsx
import { UIShowcase } from '@/components/ui-showcase'

export default function TestPage() {
  return <UIShowcase />
}
```

## Error Status Codes

| Code | Meaning | Retry? | User Message |
|------|---------|--------|--------------|
| 400 | Bad Request | No | Invalid request |
| 401 | Unauthorized | No | Session expired |
| 403 | Forbidden | No | No permission |
| 404 | Not Found | No | Resource not found |
| 429 | Rate Limited | Yes | Too many requests |
| 500 | Server Error | Yes | Server error |
| 502 | Bad Gateway | Yes | Server unavailable |
| 503 | Unavailable | Yes | Service unavailable |
| 504 | Timeout | Yes | Request timeout |

## Integration with React Query

```tsx
import { useQuery } from '@tanstack/react-query'

const { data, error, isLoading, refetch } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  retry: (failureCount, error) => {
    // Don't retry on 4xx errors
    if (error?.status >= 400 && error?.status < 500) {
      return false
    }
    // Retry up to 3 times for other errors
    return failureCount < 3
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
})
```

## Summary

- ✅ Error boundaries catch React errors
- ✅ Skeleton loaders match component dimensions
- ✅ Loading states on all async operations
- ✅ Retry logic with exponential backoff
- ✅ User-friendly error messages
- ✅ Empty states for no data
- ✅ Global error handler
- ✅ Professional zinc/emerald/red design

