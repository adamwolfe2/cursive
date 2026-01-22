# Development Guidelines

This file contains critical guidelines for developing the OpenInfo platform. Follow these principles rigorously.

## Critical Principles

### 1. Use @supabase/ssr Patterns

❌ **NEVER** use deprecated client patterns:
```typescript
// DON'T
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)
```

✅ **ALWAYS** use SSR patterns:
```typescript
// DO
import { createServerClient } from '@supabase/ssr'
// Follow patterns in src/lib/supabase/
```

### 2. RLS Policies BEFORE Exposing Tables

- NEVER expose a table without RLS policies
- ALWAYS test RLS policies with multiple users/workspaces
- Multi-tenant isolation is non-negotiable

### 3. Repository Pattern

- All database access goes through repositories
- Repositories handle error transformation
- No direct Supabase calls in components/API routes

```typescript
// ✅ Good
const repo = new QueryRepository()
const queries = await repo.findByWorkspace(workspaceId)

// ❌ Bad
const { data } = await supabase.from('queries').select()
```

### 4. Immutability

- NEVER mutate objects
- Use spread operators or immutable update libraries
- Functional programming principles

```typescript
// ✅ Good
const updated = { ...user, plan: 'pro' }

// ❌ Bad
user.plan = 'pro'
```

### 5. Test-Driven Development

- Write tests FIRST
- Aim for 80%+ coverage
- Integration tests for all RLS policies
- E2E tests for critical flows

### 6. Multi-Tenant Filtering

Every query MUST filter by workspace:

```typescript
// ✅ Good
const { data } = await supabase
  .from('leads')
  .select()
  .eq('workspace_id', workspaceId)

// ❌ Bad
const { data } = await supabase
  .from('leads')
  .select()
```

### 7. Security-First

Run this checklist before EVERY commit:

1. ✅ No hardcoded secrets
2. ✅ All inputs validated (Zod schemas)
3. ✅ SQL injection prevented
4. ✅ XSS prevention
5. ✅ CSRF protection
6. ✅ Auth verified on protected routes
7. ✅ RLS policies tested
8. ✅ Error messages sanitized

## Code Organization

### File Structure

```
feature/
├── components/          # UI components
├── api/                # API routes
├── repositories/       # DB access
├── services/          # Business logic
└── types/             # TypeScript types
```

### Naming Conventions

- **Components**: PascalCase (e.g., `LeadsTable.tsx`)
- **Files**: kebab-case (e.g., `query.repository.ts`)
- **Functions**: camelCase (e.g., `findByWorkspace`)
- **Types**: PascalCase (e.g., `QueryInsert`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_QUERIES`)

## API Routes

### Pattern

```typescript
// src/app/api/queries/route.ts
export async function GET(req: NextRequest) {
  try {
    // 1. Auth check
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    // 2. Validate input
    const schema = z.object({ /* ... */ })
    const params = schema.parse(/* ... */)

    // 3. Use repository
    const repo = new QueryRepository()
    const data = await repo.findByWorkspace(user.workspace_id)

    // 4. Return response
    return NextResponse.json({ data })
  } catch (error) {
    // 5. Error handling
    return handleApiError(error)
  }
}
```

## Database Patterns

### RLS Policy Template

```sql
-- Enable RLS
ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;

-- Workspace isolation
CREATE POLICY "Workspace isolation" ON {table}
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );
```

### Repository Pattern

```typescript
export class QueryRepository {
  private supabase = createClient()

  async findByWorkspace(workspaceId: string): Promise<Query[]> {
    const { data, error } = await this.supabase
      .from('queries')
      .select('*')
      .eq('workspace_id', workspaceId)

    if (error) throw new DatabaseError(error.message)
    return data
  }
}
```

## Background Jobs (Inngest)

### Pattern

```typescript
export const jobName = inngest.createFunction(
  { id: 'job-name', retries: 3 },
  { event: 'event/name' }, // or { cron: '0 2 * * *' }
  async ({ event, step }) => {
    const result = await step.run('step-name', async () => {
      // Work here
    })

    await step.run('next-step', async () => {
      // Next work
    })
  }
)
```

## Error Handling

### Custom Error Classes

```typescript
export class DatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
```

### API Error Handler

```typescript
export function handleApiError(error: unknown) {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  if (error instanceof DatabaseError) {
    return NextResponse.json(
      { error: 'Database error occurred' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest'

describe('QueryRepository', () => {
  it('should find queries by workspace', async () => {
    const repo = new QueryRepository()
    const queries = await repo.findByWorkspace('workspace-id')
    expect(queries).toHaveLength(2)
  })
})
```

### Integration Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('RLS Policies', () => {
  beforeEach(async () => {
    // Set up test users/workspaces
  })

  it('should isolate workspaces', async () => {
    // Test RLS policy
  })
})
```

## Git Workflow

### Commit Messages

Follow conventional commits:

```
feat: add query wizard
fix: correct workspace isolation in leads
docs: update README
test: add RLS policy tests
refactor: extract query service
```

### Pre-Commit Checklist

Before `git commit`:

1. Run `pnpm typecheck`
2. Run `pnpm lint`
3. Run `pnpm test`
4. Review security checklist
5. Ensure no console.logs
6. Verify no hardcoded values

## Performance

### Optimization Guidelines

1. **Database Indexes**: Add indexes for foreign keys
2. **Query Optimization**: Use `.select()` to limit columns
3. **Pagination**: Always paginate large datasets
4. **Caching**: Use React Query for client-side caching
5. **Images**: Use Next.js Image component
6. **Bundle Size**: Monitor with `pnpm build`

## Deployment

### Pre-Deploy Checklist

- [ ] All tests pass
- [ ] TypeScript compiles
- [ ] No linting errors
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] RLS policies active

### Post-Deploy Verification

- [ ] Auth flow works
- [ ] Inngest jobs registered
- [ ] Stripe webhooks configured
- [ ] Email sending works
- [ ] Monitoring active

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side)
- [Inngest Docs](https://www.inngest.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Stripe API](https://stripe.com/docs/api)

---

**Last Updated**: 2026-01-22
