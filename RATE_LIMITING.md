# Rate Limiting & Credit System

Comprehensive guide to the OpenInfo platform's rate limiting and credit tracking system.

## Overview

The platform implements a multi-layered protection system:

1. **IP-based rate limiting** - Protects public endpoints from abuse
2. **User-based rate limiting** - Limits authenticated user requests
3. **Credit system** - Enforces daily usage limits based on plan
4. **Plan enforcement** - Different limits for Free vs Pro users

## Architecture

```
Request Flow:
1. API Route receives request
2. protectRoute() middleware runs:
   - Check rate limit (IP or user-based)
   - Verify authentication (if required)
   - Check credit availability (if required)
3. Business logic executes
4. Credits consumed (if applicable)
5. Response returned with rate limit headers
```

## Quick Start

### Basic Protection (Auth + Rate Limiting)

```typescript
import { protectRoute, applyProtectionHeaders, PROTECTION_PRESETS } from '@/lib/middleware/api-protection'

export async function GET(req: NextRequest) {
  // Protect route
  const protection = await protectRoute(req, PROTECTION_PRESETS.authenticated)

  if (!protection.success) {
    return protection.response
  }

  const { user } = protection.req

  // Your logic here
  const data = await fetchData(user.workspace_id)

  // Return with rate limit headers
  const response = NextResponse.json({ data })
  return applyProtectionHeaders(response, req, PROTECTION_PRESETS.authenticated)
}
```

### Credit-Based Protection

```typescript
import { protectRoute, consumeCredits, PROTECTION_PRESETS } from '@/lib/middleware/api-protection'

export async function POST(req: NextRequest) {
  // Protect with credit check
  const protection = await protectRoute(req, PROTECTION_PRESETS.search)

  if (!protection.success) {
    return protection.response // 402 if insufficient credits
  }

  const { user, credits } = protection.req

  // Your logic here
  const results = await performSearch()

  // Consume credits after success
  await consumeCredits(user, 'people_search')

  // Return with credit info
  return NextResponse.json({
    results,
    credits: {
      remaining: credits.remaining,
      limit: credits.limit
    }
  })
}
```

## Protection Presets

Pre-configured protection levels:

### 1. Public Endpoints
```typescript
PROTECTION_PRESETS.public
// - IP-based rate limiting: 100 requests per 15 minutes
// - No authentication required
// - No credit check
```

**Use for**: Health checks, public API endpoints, webhooks from external services

### 2. Authenticated Endpoints
```typescript
PROTECTION_PRESETS.authenticated
// - Authentication required
// - User-based rate limiting: 60 requests per minute
// - No credit check
```

**Use for**: Profile updates, settings, query lists, dashboard data

### 3. Search Endpoints
```typescript
PROTECTION_PRESETS.search
// - Authentication required
// - Strict rate limiting: 10 requests per minute
// - Credit check: 2 credits required
// - Consumes credits on success
```

**Use for**: People search, company search

### 4. Export Endpoints
```typescript
PROTECTION_PRESETS.export
// - Authentication required
// - Strict rate limiting: 10 requests per minute
// - Credit check: 5 credits required
// - Consumes credits on success
```

**Use for**: CSV exports, bulk data downloads

### 5. Email Reveal
```typescript
PROTECTION_PRESETS.emailReveal
// - Authentication required
// - Strict rate limiting: 10 requests per minute
// - Credit check: 1 credit required
// - Consumes credits on success
```

**Use for**: Email reveal operations

## Custom Protection

For custom protection requirements:

```typescript
const customProtection = await protectRoute(req, {
  requireAuth: true,
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyPrefix: 'custom-endpoint',
  },
  requireCredits: {
    action: 'lead_generation',
    consumeOnSuccess: true,
  },
})
```

## Credit System

### Credit Costs

```typescript
{
  lead_generation: 1,   // Generate a new lead
  email_reveal: 1,      // Reveal an email address
  export: 5,            // Export data to CSV
  people_search: 2,     // Search for people
}
```

### Daily Limits by Plan

- **Free**: 3 credits per day
- **Pro**: 1000 credits per day

Credits reset daily at midnight (based on user's timezone).

### Manual Credit Operations

```typescript
import { CreditService } from '@/lib/services/credit.service'

// Check credit availability
const check = await CreditService.checkCredits(userId, 'people_search')
if (check.allowed) {
  // Perform operation

  // Consume credits
  await CreditService.consumeCredits(userId, workspaceId, 'people_search')
}

// Get remaining credits
const status = await CreditService.getRemainingCredits(userId)
console.log(`${status.remaining} / ${status.limit} credits remaining`)

// Get usage stats
const stats = await CreditService.getUsageStats(workspaceId, 7) // Last 7 days
```

## Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 60           // Max requests per window
X-RateLimit-Remaining: 45       // Requests remaining
X-RateLimit-Reset: 1674567890   // Unix timestamp when limit resets
Retry-After: 15                 // Seconds until retry (if exceeded)
```

### Reading Headers (Client-side)

```typescript
const response = await fetch('/api/endpoint')

const limit = response.headers.get('X-RateLimit-Limit')
const remaining = response.headers.get('X-RateLimit-Remaining')
const reset = response.headers.get('X-RateLimit-Reset')

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After')
  console.log(`Rate limit exceeded. Retry in ${retryAfter} seconds`)
}
```

## Error Responses

### 429 Too Many Requests
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Try again in 45 seconds."
}
```

### 402 Payment Required (Insufficient Credits)
```json
{
  "error": "Insufficient credits",
  "message": "You need 2 credits but only have 1 remaining. Upgrade to Pro for more credits.",
  "credits": {
    "remaining": 1,
    "limit": 3,
    "resetAt": "2024-01-23T00:00:00Z"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

## Frontend Integration

### Credit Usage Widget

Display credit status to users:

```tsx
import { CreditUsageWidget } from '@/components/credits/credit-usage-widget'

export default function Dashboard() {
  return (
    <div>
      <CreditUsageWidget />
      {/* Rest of dashboard */}
    </div>
  )
}
```

### Check Credits Before Action

```typescript
const [credits, setCredits] = useState<any>(null)

useEffect(() => {
  fetch('/api/credits/status')
    .then(res => res.json())
    .then(data => setCredits(data.credits))
}, [])

const handleSearch = async () => {
  if (credits.remaining < 2) {
    alert('Insufficient credits. Please upgrade or wait for daily reset.')
    return
  }

  // Perform search
}
```

## Database Schema

### Users Table
```sql
users (
  id UUID PRIMARY KEY,
  plan TEXT DEFAULT 'free',
  daily_credits_used INTEGER DEFAULT 0,
  daily_credits_reset_at TIMESTAMP WITH TIME ZONE
)
```

### Credit Usage Table
```sql
credit_usage (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  action_type TEXT,
  credits_used INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

## Database Functions

### Increment Credits (Atomic)
```sql
SELECT increment_credits('user-id', 2); -- Add 2 credits
```

### Check and Reset Credits
```sql
SELECT * FROM check_and_reset_credits('user-id');
-- Returns: remaining, limit_amount, reset_at
```

## Testing

### Unit Tests

```typescript
import { rateLimit } from '@/lib/middleware/rate-limit'

describe('Rate Limiting', () => {
  it('should allow requests within limit', async () => {
    const result = await rateLimit('user-123', {
      windowMs: 60000,
      maxRequests: 10
    })

    expect(result.success).toBe(true)
    expect(result.remaining).toBe(9)
  })

  it('should block requests over limit', async () => {
    // Make 11 requests
    for (let i = 0; i < 11; i++) {
      await rateLimit('user-123', { windowMs: 60000, maxRequests: 10 })
    }

    const result = await rateLimit('user-123', { windowMs: 60000, maxRequests: 10 })
    expect(result.success).toBe(false)
    expect(result.retryAfter).toBeGreaterThan(0)
  })
})
```

### Integration Tests

```typescript
describe('Protected API Routes', () => {
  it('should return 429 when rate limit exceeded', async () => {
    // Make 61 requests (limit is 60/min)
    for (let i = 0; i < 61; i++) {
      await fetch('/api/endpoint')
    }

    const response = await fetch('/api/endpoint')
    expect(response.status).toBe(429)
  })

  it('should return 402 when credits insufficient', async () => {
    // Deplete credits
    await depleteUserCredits(userId)

    const response = await fetch('/api/people-search', {
      method: 'POST',
      body: JSON.stringify({ filters: {} })
    })

    expect(response.status).toBe(402)
  })
})
```

## Monitoring

### Track Rate Limit Violations

```typescript
// Add to API route
if (!protection.success && response.status === 429) {
  analytics.track('Rate Limit Exceeded', {
    endpoint: req.url,
    user: user?.id,
    ip: getClientIp(req)
  })
}
```

### Track Credit Usage

```typescript
// Automatically logged in credit_usage table
// Query for analytics:
SELECT
  action_type,
  COUNT(*) as count,
  SUM(credits_used) as total_credits,
  DATE_TRUNC('day', timestamp) as date
FROM credit_usage
WHERE workspace_id = 'workspace-id'
  AND timestamp > NOW() - INTERVAL '30 days'
GROUP BY action_type, DATE_TRUNC('day', timestamp)
ORDER BY date DESC
```

## Best Practices

1. **Always use protection presets** when possible (avoid custom configs)
2. **Apply rate limit headers** to all responses for transparency
3. **Consume credits only after successful operations** (not before)
4. **Log rate limit violations** for abuse detection
5. **Show credit status** prominently in UI
6. **Graceful degradation** - disable features when credits low
7. **Test with multiple workspaces** to ensure isolation
8. **Monitor credit reset jobs** to ensure they run daily

## Troubleshooting

### Credits not resetting
- Check `daily_credits_reset_at` timestamp in users table
- Verify cron job is running (see `inngest/functions/credit-reset.ts`)
- Run manual reset: `UPDATE users SET daily_credits_used = 0, daily_credits_reset_at = NOW() + INTERVAL '1 day'`

### Rate limits too strict
- Adjust `RATE_LIMITS` in `src/lib/middleware/rate-limit.ts`
- Consider using Redis for distributed rate limiting (multi-instance deployments)

### Credits consumed but operation failed
- Add transaction wrapper around credit consumption
- Implement credit refund mechanism for failed operations

## Scaling Considerations

### Current: In-Memory Store
- Works for single-instance deployments
- Resets on server restart
- No synchronization across instances

### Production: Redis
```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
})

// Replace rateLimitStore Map with Redis
```

### Multi-Region: Distributed Rate Limiting
- Use edge middleware (Vercel Edge, Cloudflare Workers)
- Implement sliding window counters
- Consider eventual consistency trade-offs

---

**Last Updated**: 2026-01-22
