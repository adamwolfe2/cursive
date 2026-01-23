# Quick Reference: Error Handling & Loading States

Fast reference for using error boundaries and loading states in OpenInfo.

## Basic Usage

### Show Loading State

```tsx
import { TableSkeleton } from '@/components/skeletons'

if (isLoading) return <TableSkeleton rows={10} />
```

### Show Error State

```tsx
import { ErrorDisplay } from '@/components/error-display'

if (error) {
  return <ErrorDisplay error={error} retry={refetch} />
}
```

### Loading Button

```tsx
import { LoadingButton } from '@/components/loading-button'

<LoadingButton loading={isLoading} loadingText="Saving...">
  Save
</LoadingButton>
```

### Empty State

```tsx
import { EmptyState } from '@/components/error-display'

if (data.length === 0) {
  return <EmptyState title="No data" description="Add your first item" />
}
```

### Error Boundary

```tsx
import { ErrorBoundary } from '@/components/error-boundary'

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## Complete Example

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import {
  TableSkeleton,
  ErrorDisplay,
  EmptyState,
  ErrorBoundary,
} from '@/components'

export function MyTable() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
  })

  // Error state
  if (error) {
    return <ErrorDisplay error={error} retry={refetch} variant="card" />
  }

  // Loading state
  if (isLoading) {
    return <TableSkeleton rows={10} columns={6} />
  }

  // Empty state
  if (!data || data.length === 0) {
    return <EmptyState title="No data yet" />
  }

  // Success state
  return (
    <ErrorBoundary>
      <table>{/* Your table */}</table>
    </ErrorBoundary>
  )
}
```

## Skeleton Components

```tsx
import {
  TableSkeleton,
  StatCardsSkeleton,
  QueryCardSkeleton,
  FormSkeleton,
  ListSkeleton,
  PageSkeleton,
  Spinner,
} from '@/components/skeletons'

// Tables
<TableSkeleton rows={10} columns={8} />

// Stats
<StatCardsSkeleton count={4} />

// Cards
<QueryCardSkeleton />

// Forms
<FormSkeleton fields={4} />

// Lists
<ListSkeleton items={5} />

// Pages
<PageSkeleton />

// Spinner
<Spinner size="md" />
```

## Error Variants

```tsx
// Inline (small)
<ErrorDisplay error={error} variant="inline" />

// Card (medium)
<ErrorDisplay error={error} retry={refetch} variant="card" />

// Page (large)
<ErrorDisplay error={error} retry={refetch} variant="page" />
```

## Button Variants

```tsx
// Primary
<LoadingButton variant="primary">Save</LoadingButton>

// Secondary
<LoadingButton variant="secondary">Cancel</LoadingButton>

// Danger
<LoadingButton variant="danger">Delete</LoadingButton>

// Ghost
<LoadingButton variant="ghost">Learn More</LoadingButton>

// Sizes
<LoadingButton size="sm">Small</LoadingButton>
<LoadingButton size="md">Medium</LoadingButton>
<LoadingButton size="lg">Large</LoadingButton>
```

## Retry Logic

```tsx
import { retry, retryFetch } from '@/lib/utils/retry'

// Function
const data = await retry(() => fetchData(), {
  maxRetries: 3,
  initialDelay: 1000,
})

// Fetch
const response = await retryFetch('/api/data')
const data = await response.json()

// Fetch + JSON
import { retryFetchJson } from '@/lib/utils/retry'
const data = await retryFetchJson('/api/data')
```

## React Query Integration

```tsx
const { data, error, isLoading, refetch } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  retry: 3, // Auto retry
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
})
```

## Import Shortcuts

```tsx
// All from one import
import {
  ErrorBoundary,
  ErrorDisplay,
  EmptyState,
  LoadingButton,
  TableSkeleton,
  StatCardsSkeleton,
  Spinner,
} from '@/components'
```

## Common Patterns

### Data Fetching

```tsx
const { data, error, isLoading } = useQuery({
  queryKey: ['key'],
  queryFn: fetchData,
})

if (error) return <ErrorDisplay error={error} />
if (isLoading) return <TableSkeleton />
return <YourComponent data={data} />
```

### Form Submission

```tsx
const [loading, setLoading] = useState(false)

const handleSubmit = async () => {
  setLoading(true)
  try {
    await submitData()
  } catch (error) {
    // Handle error
  } finally {
    setLoading(false)
  }
}

<LoadingButton loading={loading} onClick={handleSubmit}>
  Submit
</LoadingButton>
```

### Conditional Content

```tsx
{isLoading ? (
  <Spinner />
) : error ? (
  <ErrorDisplay error={error} />
) : data.length === 0 ? (
  <EmptyState title="No data" />
) : (
  <YourContent data={data} />
)}
```

## Best Practices

1. Always show loading states
2. Always handle errors with retry
3. Show empty states when no data
4. Wrap sections with ErrorBoundary
5. Use appropriate skeleton for content type
6. Match skeleton to actual layout
7. Provide retry for failed operations
8. Use user-friendly error messages

## Testing

```tsx
// Trigger loading
<LoadingButton loading={true}>Test</LoadingButton>

// Trigger error
<ErrorDisplay error="Test error" />

// Trigger empty
<EmptyState title="Test empty" />

// View all states
import { UIShowcase } from '@/components/ui-showcase'
<UIShowcase />
```

## Color Reference

- **Primary**: emerald-600
- **Secondary**: zinc-100
- **Danger**: red-600
- **Loading**: zinc-300, emerald-600
- **Error**: red-50, red-600, red-700
- **Empty**: zinc-300, zinc-400

## Status

✅ All components production-ready
✅ Full TypeScript support
✅ Professional design
✅ Accessible
✅ Responsive
✅ Performant
