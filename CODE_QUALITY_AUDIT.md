# Code Quality & Architecture Audit Report

**Date:** January 28, 2026
**Phase:** 2 of 6
**Status:** ⚠️ Multiple Issues Identified

---

## Executive Summary

This audit examined code quality and architectural patterns across the Cursive platform. While the codebase has strong foundations, several systemic issues were identified that violate documented best practices in `CLAUDE.md`.

### Key Findings:
- ❌ **Repository Pattern Violations**: 17 API routes use direct Supabase calls
- ⚠️ **Inconsistent Error Handling**: 60% of API routes don't use standardized error handler
- ⚠️ **Type Safety Issues**: 86+ instances of `any` type across 30+ files
- ✅ **Good Code Organization**: File structure follows documented patterns
- ✅ **Naming Conventions**: Generally consistent with guidelines

---

## 1. Repository Pattern Violations

**Impact:** High
**Severity:** Architecture Violation

### Issue
According to `CLAUDE.md`, all database access should go through repositories:
```typescript
// ✅ Good (from CLAUDE.md)
const repo = new QueryRepository()
const queries = await repo.findByWorkspace(workspaceId)

// ❌ Bad
const { data } = await supabase.from('queries').select()
```

### Current State
**17 API routes** use direct `supabase.from()` calls instead of repositories:

#### Critical Violations:
1. `/api/leads/ingest/route.ts` - Lines 251-278
   - Direct insert to `leads` table
   - Should use `LeadRepository.create()` (which already exists)
   - Also creates `lead_companies` associations directly

2. `/api/sequences/route.ts`
   - Direct database operations
   - No repository abstraction

3. `/api/marketplace/download/[purchaseId]/route.ts`
   - Should use MarketplaceRepository

4. `/api/admin/partners/[partnerId]/approve/route.ts`
   - Should use PartnerRepository

5. `/api/admin/partners/[partnerId]/reject/route.ts`
   - Should use PartnerRepository

#### Acceptable Exceptions:
- `/api/webhooks/*` routes - Performance-critical, direct access justified
- `/api/health/route.ts` - Simple health check
- `/api/admin/seed-demo-data/route.ts` - One-time seeding script

### Recommendation
Refactor API routes to use existing repositories. For new features:
- **Before writing code**, check if a repository exists
- **If no repository exists**, create one first
- **Never** commit direct Supabase calls in API routes (except whitelisted paths)

### Estimated Effort
- High: 2-3 days to refactor all violations
- Includes adding missing repository methods
- Includes writing tests for new repository methods

---

## 2. Inconsistent Error Handling

**Impact:** Medium
**Severity:** Code Quality Issue

### Issue
The codebase provides a centralized `handleApiError` function in `lib/utils/api-error-handler.ts`, but only **40% of API routes** use it.

### Statistics
- **Total API routes:** 142
- **Using `handleApiError`:** 57 routes (40%)
- **NOT using `handleApiError`:** 85 routes (60%)

### Inconsistency Examples

**Good example** (using standardized handler):
```typescript
// src/app/api/users/me/route.ts
try {
  // ... business logic
  return success({ data })
} catch (error: any) {
  return handleApiError(error)
}
```

**Bad example** (custom error handling):
```typescript
// src/app/api/leads/ingest/route.ts
try {
  // ... business logic
} catch (error) {
  console.error('Lead ingestion error:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

### Problems with Inconsistency
1. **Error messages leak implementation details** in some routes
2. **No centralized error logging** for non-standard routes
3. **Different status codes** for same error types
4. **Client-side handling** becomes unpredictable

### Recommendation
1. **Enforce** `handleApiError` usage in all API routes
2. **Create ESLint rule** to flag direct `NextResponse.json({ error: ... })`
3. **Add pre-commit hook** to check error handling patterns
4. **Document exceptions** (webhooks) explicitly in comments

### Estimated Effort
- Medium: 1-2 days to standardize all routes
- Includes writing tests for error cases
- Includes ESLint rule creation

---

## 3. TypeScript Type Safety

**Impact:** Medium
**Severity:** Type Safety Issue

### Issue
The codebase uses `any` type 86+ times across 30+ files, weakening TypeScript's type safety guarantees.

### Hotspots (files with most `any` usage):
1. `src/inngest/functions/platform-upload.ts` - 19 instances
2. `src/inngest/functions/enrichment-pipeline.ts` - 7 instances
3. `src/lib/integrations/clay.ts` - 6 instances
4. `src/inngest/functions/campaign-enrichment.ts` - 6 instances
5. `src/inngest/functions/email-sequences.ts` - 5 instances

### Common Patterns
```typescript
// Repository responses
return (data as any) || []  // Should define proper types

// Error handlers
catch (error: any) {  // Should use Error or unknown

// Event handlers
async ({ event, step }) => {  // Inngest events should be typed
```

### Recommendation
1. **Define proper types** for all repository return values
2. **Use `unknown`** instead of `any` for error handling
3. **Create type definitions** for third-party API responses (Clay, Tavily, etc.)
4. **Add `@typescript-eslint/no-explicit-any` rule** with gradual enforcement
5. **Use Zod schemas** to infer types for API responses

### Estimated Effort
- High: 3-4 days to fix all instances
- Prioritize: Start with repositories, then API routes, then Inngest functions
- Can be done incrementally file-by-file

---

## 4. Code Organization & Structure

**Impact:** Low
**Severity:** ✅ Generally Good

### Current State
The codebase follows the documented structure from `CLAUDE.md`:

```
feature/
├── components/          # UI components ✅
├── api/                # API routes ✅
├── repositories/       # DB access ✅
├── services/          # Business logic ✅
└── types/             # TypeScript types ✅
```

### Positive Observations
- ✅ Clear separation between layers
- ✅ Feature-based organization
- ✅ Consistent file naming (kebab-case for files, PascalCase for components)
- ✅ Logical grouping of related functionality

### Minor Improvements
- Consider adding `README.md` files in major directories
- Add JSDoc comments to all repository methods
- Create index files to simplify imports

---

## 5. Naming Conventions

**Impact:** Low
**Severity:** ✅ Generally Consistent

### Current State
Code follows documented conventions:
- **Components**: PascalCase ✅
- **Files**: kebab-case ✅
- **Functions**: camelCase ✅
- **Types**: PascalCase ✅
- **Constants**: UPPER_SNAKE_CASE ✅

### Minor Inconsistencies
Some constants use lowercase (e.g., `const adminPassword` instead of `const ADMIN_PASSWORD`). Fixed during Phase 1 security audit.

---

## 6. Code Duplication

**Impact:** Medium
**Severity:** Moderate Issue

### Identified Patterns

#### Authentication Checks
Many routes duplicate this pattern:
```typescript
const user = await getCurrentUser()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Recommendation:** Create middleware or HOF (Higher Order Function) for auth:
```typescript
export function withAuth(handler: Handler) {
  return async (req: NextRequest) => {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    return handler(req, user)
  }
}
```

#### Pagination Logic
Multiple repositories duplicate pagination calculation:
```typescript
const from = (page - 1) * perPage
const to = from + perPage - 1
query = query.range(from, to)
```

**Recommendation:** Extract to utility function:
```typescript
export function paginateQuery<T>(
  query: PostgrestFilterBuilder<T>,
  page: number,
  perPage: number
) {
  const from = (page - 1) * perPage
  return query.range(from, from + perPage - 1)
}
```

### Estimated Effort
- Low: 1 day to create utility functions and refactor

---

## Priority Action Items

### High Priority (Security/Architecture)
1. ✅ **DONE** - Fix hardcoded admin password (Phase 1)
2. ✅ **DONE** - Fix webhook secret exposure (Phase 1)
3. ✅ **DONE** - Add account deletion confirmation (Phase 1)
4. **TODO** - Refactor API routes to use repository pattern (2-3 days)

### Medium Priority (Code Quality)
5. **TODO** - Standardize error handling across all API routes (1-2 days)
6. **TODO** - Remove `any` types, add proper TypeScript types (3-4 days, can be incremental)
7. **TODO** - Extract common patterns into utilities (1 day)

### Low Priority (Nice to Have)
8. **TODO** - Add JSDoc comments to repositories
9. **TODO** - Create README files for major directories
10. **TODO** - Add ESLint rules to enforce patterns

---

## Metrics Summary

| Metric | Count | Status |
|--------|-------|--------|
| API Routes Total | 142 | - |
| Routes with Repository Pattern | 125 | ✅ 88% |
| Routes with Direct Supabase | 17 | ⚠️ 12% |
| Routes with Standard Error Handling | 57 | ⚠️ 40% |
| Files with `any` Types | 30+ | ⚠️ High |
| Total `any` Instances | 86+ | ⚠️ High |

---

## Next Steps

1. **Complete remaining audit phases** (3-6)
2. **Discuss priorities** with product/engineering team
3. **Create GitHub issues** for each action item
4. **Set up monitoring** for code quality metrics
5. **Implement ESLint rules** to prevent future violations

---

**Auditor:** Claude Code
**Next Phase:** Database Schema & Performance Audit
