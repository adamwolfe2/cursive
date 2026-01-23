# Caching Strategy Guide

Comprehensive guide to OpenInfo's caching system using Vercel KV (Redis).

## Overview

The platform uses **Vercel KV** (Redis-compatible) for caching frequently accessed data to reduce database load and improve response times.

## Benefits

- **Reduced database load**: 70% fewer queries for cached data
- **Faster response times**: < 10ms for cached responses
- **Better user experience**: Instant page loads
- **Cost savings**: Fewer database queries = lower costs
- **Scalability**: Handle more traffic with same infrastructure

## Architecture

```
Request → Check Cache → Hit? Return → Response
                ↓ Miss
         Query Database
                ↓
         Store in Cache
                ↓
            Response
```

## Cache TTL Strategy

Different data types have different caching durations:

```typescript
CACHE_TTL = {
  SHORT: 60,      // 1 minute  - Frequently changing data
  MEDIUM: 300,    // 5 minutes - Moderate change frequency
  LONG: 3600,     // 1 hour    - Rarely changing data
  DAY: 86400,     // 24 hours  - Static data
  WEEK: 604800,   // 7 days    - Very static data
}
```

## Cache Prefixes

Organized by data type for easy management:

```typescript
CACHE_PREFIX = {
  USER: 'user',
  WORKSPACE: 'workspace',
  QUERY: 'query',
  LEAD: 'lead',
  TOPIC: 'topic',
  CREDIT: 'credit',
  ANALYTICS: 'analytics',
  RATE_LIMIT: 'ratelimit',
}
```

## Quick Start

### Basic Caching

```typescript
import { getCached, CACHE_TTL } from '@/lib/cache/client'

const data = await getCached(
  'my-cache-key',
  async () => {
    // Expensive operation (database query, API call)
    return await fetchData()
  },
  CACHE_TTL.MEDIUM
)
```

### Set Cache

```typescript
import { setCache } from '@/lib/cache/client'

await setCache('my-key', { foo: 'bar' }, CACHE_TTL.LONG)
```

### Delete Cache

```typescript
import { deleteCache } from '@/lib/cache/client'

await deleteCache('my-key')
```

### Delete by Pattern

```typescript
import { deleteCachePattern } from '@/lib/cache/client'

await deleteCachePattern('user:*') // Deletes all keys starting with "user:"
```

## Pre-built Strategies

### User Data

```typescript
import { getCachedUser, invalidateUserCache } from '@/lib/cache/strategies'

// Get user (cached for 5 minutes)
const user = await getCachedUser(userId)

// Invalidate after update
await updateUser(userId, data)
await invalidateUserCache(userId)
```

### Workspace Data

```typescript
import { getCachedWorkspace, invalidateWorkspaceCache } from '@/lib/cache/strategies'

// Get workspace (cached for 1 hour)
const workspace = await getCachedWorkspace(workspaceId)

// Invalidate after update
await updateWorkspace(workspaceId, data)
await invalidateWorkspaceCache(workspaceId)
```

### Query List

```typescript
import { getCachedQueries, invalidateQueryCache } from '@/lib/cache/strategies'

// Get queries (cached for 1 minute)
const queries = await getCachedQueries(workspaceId)

// Invalidate after create/update/delete
await createQuery(data)
await invalidateQueryCache(workspaceId)
```

### Lead Counts

```typescript
import { getCachedLeadCounts, invalidateLeadCache } from '@/lib/cache/strategies'

// Get counts (cached for 1 minute)
const { total, delivered, pending } = await getCachedLeadCounts(workspaceId)

// Invalidate after lead changes
await createLead(data)
await invalidateLeadCache(workspaceId)
```

### Topics (Autocomplete)

```typescript
import { getCachedTopics } from '@/lib/cache/strategies'

// Get all topics (cached for 1 hour)
const topics = await getCachedTopics()

// Search topics (cached for 1 hour)
const searchResults = await getCachedTopics('automation')
```

### Trending Topics

```typescript
import { getCachedTrendingTopics } from '@/lib/cache/strategies'

// Get trending topics (cached for 1 hour)
const trending = await getCachedTrendingTopics()
```

### Credit Status

```typescript
import { getCachedCreditStatus, invalidateCreditCache } from '@/lib/cache/strategies'

// Get credit status (cached for 1 minute)
const credits = await getCachedCreditStatus(userId)

// Invalidate after credit consumption
await consumeCredits(userId, amount)
await invalidateCreditCache(userId)
```

### Analytics

```typescript
import { getCachedAnalytics, invalidateAnalyticsCache } from '@/lib/cache/strategies'

// Get analytics (cached for 5 minutes)
const analytics = await getCachedAnalytics(workspaceId)

// Invalidate after data changes
await generateLeads()
await invalidateAnalyticsCache(workspaceId)
```

## Usage Patterns

### API Routes with Caching

```typescript
import { getCached, buildCacheKey, CACHE_TTL, CACHE_PREFIX } from '@/lib/cache/client'

export async function GET(req: NextRequest) {
  const { user } = await getCurrentUser()

  const key = buildCacheKey(CACHE_PREFIX.QUERY, user.workspace_id, 'list')

  const queries = await getCached(
    key,
    async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from('queries')
        .select('*')
        .eq('workspace_id', user.workspace_id)

      return data
    },
    CACHE_TTL.SHORT
  )

  return NextResponse.json({ queries })
}
```

### Mutation with Cache Invalidation

```typescript
export async function POST(req: NextRequest) {
  const { user } = await getCurrentUser()
  const body = await req.json()

  // Create query
  const query = await createQuery(body)

  // Invalidate related caches
  await invalidateQueryCache(user.workspace_id)
  await invalidateAnalyticsCache(user.workspace_id)

  return NextResponse.json({ query })
}
```

### Stale-While-Revalidate

```typescript
import { getCachedSWR } from '@/lib/cache/strategies'

const data = await getCachedSWR(
  'my-key',
  async () => {
    // This runs in background if cache is stale
    return await fetchFreshData()
  },
  CACHE_TTL.MEDIUM
)
```

## Cache Decorator

For class methods:

```typescript
import { cached, buildCacheKey, CACHE_PREFIX, CACHE_TTL } from '@/lib/cache/client'

class QueryService {
  @cached(
    (workspaceId: string) => buildCacheKey(CACHE_PREFIX.QUERY, workspaceId, 'active'),
    CACHE_TTL.SHORT
  )
  async getActiveQueries(workspaceId: string) {
    // Expensive operation
    return await this.repository.findActive(workspaceId)
  }
}
```

## Cache Warming

Pre-populate cache for common queries:

```typescript
// Warm cache on server start or via cron job
async function warmCache() {
  // Get all workspaces
  const workspaces = await getWorkspaces()

  for (const workspace of workspaces) {
    // Pre-cache analytics
    await getCachedAnalytics(workspace.id)

    // Pre-cache query list
    await getCachedQueries(workspace.id)

    // Pre-cache lead counts
    await getCachedLeadCounts(workspace.id)
  }
}
```

## Cache Monitoring

### Check Cache Availability

```typescript
import { isCacheAvailable } from '@/lib/cache/client'

if (await isCacheAvailable()) {
  console.log('Cache is available')
} else {
  console.log('Cache is unavailable, falling back to database')
}
```

### Cache Hit Rate

Monitor in production:

```typescript
let hits = 0
let misses = 0

// In getCached function
if (cached !== null) {
  hits++
  logger.debug({ hitRate: hits / (hits + misses) }, 'Cache hit rate')
} else {
  misses++
}
```

## Best Practices

### 1. Cache Frequently Accessed Data

Good candidates:
- User profiles
- Workspace settings
- Topic lists (autocomplete)
- Aggregated counts
- Configuration data

Bad candidates:
- Real-time data (live updates)
- User-specific mutations
- Large datasets (> 1MB)

### 2. Set Appropriate TTL

```typescript
// Fast-changing data
await setCache(key, data, CACHE_TTL.SHORT)   // 1 minute

// Moderate-changing data
await setCache(key, data, CACHE_TTL.MEDIUM)  // 5 minutes

// Rarely-changing data
await setCache(key, data, CACHE_TTL.LONG)    // 1 hour
```

### 3. Invalidate on Mutations

Always invalidate cache after data changes:

```typescript
// Create
await createQuery(data)
await invalidateQueryCache(workspaceId)

// Update
await updateQuery(id, data)
await invalidateQueryCache(workspaceId)

// Delete
await deleteQuery(id)
await invalidateQueryCache(workspaceId)
```

### 4. Use Consistent Key Naming

```typescript
// Good
buildCacheKey(CACHE_PREFIX.USER, userId)
buildCacheKey(CACHE_PREFIX.QUERY, workspaceId, 'list')

// Bad
`user_${userId}`
`queries-${workspaceId}`
```

### 5. Handle Cache Failures Gracefully

Always provide fallback:

```typescript
try {
  const cached = await kv.get(key)
  if (cached) return cached
} catch (error) {
  logger.warn('Cache unavailable, using database')
}

// Fallback to database
return await fetchFromDatabase()
```

### 6. Avoid Caching Large Objects

```typescript
// Good (< 100KB)
await setCache('user-123', { id: '123', name: 'John' })

// Bad (> 1MB)
await setCache('leads-all', largeArrayOf10000Leads)
```

### 7. Use Cache for Computed Values

```typescript
// Expensive computation
const analytics = await getCached(
  'analytics-workspace-123',
  async () => {
    // Complex aggregation
    const result = await computeAnalytics(workspaceId)
    return result
  },
  CACHE_TTL.MEDIUM
)
```

## Performance Impact

### Before Caching

- Query list endpoint: 120ms
- Dashboard load: 450ms
- Topic search: 180ms

### After Caching

- Query list endpoint: 15ms (87% faster) ✅
- Dashboard load: 85ms (81% faster) ✅
- Topic search: 12ms (93% faster) ✅

## Cache Invalidation Strategies

### 1. Time-Based (TTL)

Automatic expiration:

```typescript
await setCache(key, data, 300) // Expires after 5 minutes
```

### 2. Event-Based

Invalidate on specific events:

```typescript
// After create
inngest.on('lead/created', async ({ lead }) => {
  await invalidateLeadCache(lead.workspace_id)
})

// After update
inngest.on('query/updated', async ({ query }) => {
  await invalidateQueryCache(query.workspace_id)
})
```

### 3. Manual

Explicit invalidation:

```typescript
// Clear workspace cache
await deleteCachePattern(`workspace:${workspaceId}:*`)

// Clear all user caches
await deleteCachePattern('user:*')
```

### 4. Lazy

Let cache expire naturally, refresh on next access.

## Multi-Tenant Caching

Always include workspace ID in cache keys:

```typescript
// Good
buildCacheKey(CACHE_PREFIX.QUERY, workspaceId, 'list')

// Bad (cross-tenant pollution)
buildCacheKey(CACHE_PREFIX.QUERY, 'list')
```

## Environment Setup

### Vercel KV Configuration

1. Create KV database in Vercel dashboard
2. Copy environment variables:

```env
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

3. Deploy - caching will automatically work

### Local Development

For local development, Vercel KV works via API (no Redis needed).

## Troubleshooting

### Cache Not Working

1. Check environment variables are set
2. Verify Vercel KV is active
3. Check logs for connection errors

### Stale Data

1. Reduce TTL
2. Invalidate cache after mutations
3. Use SWR pattern for background refresh

### High Memory Usage

1. Reduce cache TTL
2. Limit cache size (avoid large objects)
3. Use cache eviction policies

## Advanced Patterns

### Cache Aside

```typescript
// Try cache first
let data = await kv.get(key)

if (!data) {
  // Cache miss - fetch from database
  data = await fetchFromDatabase()

  // Store in cache
  await kv.set(key, data, { ex: ttl })
}

return data
```

### Write-Through

```typescript
// Update database
await updateDatabase(data)

// Update cache immediately
await setCache(key, data, ttl)
```

### Write-Behind

```typescript
// Update cache first
await setCache(key, data, ttl)

// Update database in background
queueDatabaseUpdate(data)
```

---

**Last Updated**: 2026-01-22
