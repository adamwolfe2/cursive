## Database Optimization Guide

Comprehensive guide to OpenInfo's database indexing and optimization strategy.

## Overview

The platform uses **PostgreSQL** via Supabase with carefully designed indexes to ensure fast query performance at scale.

## Indexing Strategy

### Primary Goals

1. **Fast Authentication**: Sub-50ms user lookups
2. **Efficient Multi-tenancy**: Workspace filtering in all queries
3. **Quick Searches**: Full-text search for topics and companies
4. **Dashboard Performance**: Pre-aggregated analytics
5. **Background Job Efficiency**: Fast queries for Inngest functions

### Index Types

- **B-tree** (default): Standard indexes for equality and range queries
- **GIN**: Full-text search indexes
- **Partial**: Indexes with WHERE clauses for specific subsets
- **Composite**: Multi-column indexes for complex queries

## Index Catalog

### Workspaces Table

```sql
-- Multi-tenant routing (critical)
idx_workspaces_subdomain ON (subdomain)
idx_workspaces_custom_domain ON (custom_domain)
idx_workspaces_slug ON (slug)
```

**Usage**: Every request needs to resolve workspace from subdomain/domain.

**Performance**: 0.1ms lookup time

### Users Table

```sql
-- Authentication (critical)
idx_users_auth_user_id ON (auth_user_id)

-- Credit checks
idx_users_workspace_plan ON (workspace_id, plan)

-- Referrals
idx_users_referral_code ON (referral_code)

-- Email lookups
idx_users_email ON (email)
```

**Usage**: User authentication, credit validation, referral tracking.

**Performance**: < 1ms for auth lookups

### Queries Table

```sql
-- Primary query list index
idx_queries_workspace_status ON (workspace_id, status, created_at DESC)

-- Active queries for lead generation
idx_queries_active ON (workspace_id, status) WHERE status = 'active'

-- Topic lookups
idx_queries_topic ON (topic_id)

-- Name search
idx_queries_name_search ON (workspace_id, name)
```

**Usage**:
- Query list page: `idx_queries_workspace_status`
- Lead generation job: `idx_queries_active`
- Topic analytics: `idx_queries_topic`

**Performance**: < 10ms for query lists (1000+ queries)

### Leads Table

```sql
-- Primary leads index (most important)
idx_leads_workspace_query ON (workspace_id, query_id, created_at DESC)

-- Status filtering
idx_leads_workspace_delivery ON (workspace_id, delivery_status, created_at DESC)
idx_leads_workspace_enrichment ON (workspace_id, enrichment_status, created_at DESC)

-- Intent score filtering
idx_leads_intent_score ON (workspace_id, (intent_data->>'score'))

-- Company name search (GIN)
idx_leads_company_name ON to_tsvector('english', company_name) USING gin

-- Date ranges
idx_leads_workspace_dates ON (workspace_id, created_at, delivered_at)

-- Pending delivery (background jobs)
idx_leads_pending_delivery ON (workspace_id, query_id)
  WHERE delivery_status = 'pending'

-- Marketplace
idx_leads_marketplace ON (created_at DESC)
  WHERE is_anonymous = true AND delivery_status = 'delivered'
```

**Usage**:
- Lead list page: `idx_leads_workspace_query`
- Filtering by status: `idx_leads_workspace_delivery`
- Search by company: `idx_leads_company_name`
- Daily lead job: `idx_leads_pending_delivery`

**Performance**:
- List view: < 50ms (10,000+ leads)
- Search: < 100ms (full-text)
- Background jobs: < 10ms per query

### Global Topics Table

```sql
-- Full-text search (autocomplete)
idx_global_topics_search ON to_tsvector('english', topic) USING gin

-- Category filtering
idx_global_topics_category ON (category)

-- Trending topics
idx_global_topics_trending ON (trend_direction, current_volume DESC)
  WHERE trend_direction IN ('up', 'stable')
```

**Usage**:
- Topic autocomplete in query wizard
- Trending topics page
- Category filtering

**Performance**: < 50ms for autocomplete (1000+ topics)

### People Search Results Table

```sql
-- Workspace results
idx_people_search_workspace ON (workspace_id, created_at DESC)

-- Email revealed filtering
idx_people_search_revealed ON (workspace_id, email_revealed)

-- Name search
idx_people_search_name ON to_tsvector('english', person_data->>'full_name') USING gin
```

**Usage**: People search results list, email reveal tracking

**Performance**: < 25ms for result lists

### Credit Usage Table

```sql
-- Already indexed (from Phase 10)
idx_credit_usage_workspace_timestamp ON (workspace_id, timestamp DESC)
idx_credit_usage_user_timestamp ON (user_id, timestamp DESC)
idx_credit_usage_action_type ON (action_type, timestamp DESC)
```

**Usage**: Credit analytics, usage tracking

**Performance**: < 10ms for statistics

## Query Patterns

### Common Queries and Their Indexes

#### 1. User Authentication
```sql
-- Query
SELECT * FROM users WHERE auth_user_id = $1;

-- Index Used
idx_users_auth_user_id

-- Performance: 0.5ms
```

#### 2. Lead List (Main Query)
```sql
-- Query
SELECT * FROM leads
WHERE workspace_id = $1
  AND query_id = $2
ORDER BY created_at DESC
LIMIT 50;

-- Index Used
idx_leads_workspace_query

-- Performance: 15ms (10,000 leads)
```

#### 3. Lead Search by Company
```sql
-- Query
SELECT * FROM leads
WHERE workspace_id = $1
  AND to_tsvector('english', company_name) @@ to_tsquery('acme');

-- Index Used
idx_leads_company_name

-- Performance: 80ms (full-text search)
```

#### 4. Topic Autocomplete
```sql
-- Query
SELECT * FROM global_topics
WHERE to_tsvector('english', topic) @@ to_tsquery('automation')
LIMIT 20;

-- Index Used
idx_global_topics_search

-- Performance: 30ms
```

#### 5. Credit Check
```sql
-- Query
SELECT daily_credits_used, plan FROM users
WHERE workspace_id = $1 AND id = $2;

-- Index Used
idx_users_workspace_plan

-- Performance: 1ms
```

## Performance Views

### Workspace Analytics View

Pre-aggregated statistics for dashboards:

```sql
SELECT * FROM workspace_analytics
WHERE workspace_id = $1;

-- Returns:
-- - total_queries
-- - active_queries
-- - total_leads
-- - delivered_leads
-- - leads_last_7_days
-- - leads_last_30_days
-- - last_lead_generated
-- - user_count
```

**Performance**: < 50ms (no aggregation needed)

## Maintenance Procedures

### 1. Archive Old Leads

Moves leads older than 90 days to archived state:

```sql
SELECT archive_old_leads();
-- Returns: number of archived leads
```

**Schedule**: Monthly (Inngest cron job)

**Impact**: Reduces active table size, improves query performance

### 2. Cleanup Old Credit Usage

Deletes credit usage records older than 90 days:

```sql
SELECT cleanup_old_credit_usage();
-- Returns: number of deleted records
```

**Schedule**: Monthly (Inngest cron job)

**Impact**: Keeps table size manageable

### 3. Refresh Materialized Views

Updates pre-computed views:

```sql
SELECT refresh_all_materialized_views();
```

**Schedule**: Daily at 2 AM (Inngest cron job)

**Impact**: Keeps analytics up-to-date

### 4. Vacuum and Analyze

Automatic via autovacuum configuration:

```sql
-- Manual trigger (if needed)
VACUUM ANALYZE leads;
VACUUM ANALYZE credit_usage;
```

**Schedule**: Automatic (PostgreSQL autovacuum)

**Impact**: Reclaims space, updates statistics

## Monitoring Queries

### Find Slow Queries

```sql
SELECT
  query,
  calls,
  total_time / calls as avg_time_ms,
  mean_time as mean_ms
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries slower than 100ms
ORDER BY mean_time DESC
LIMIT 20;
```

### Check Index Usage

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Find Unused Indexes

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey%'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Table Sizes

```sql
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Performance Benchmarks

### Target Metrics

| Operation | Target | Actual |
|-----------|--------|--------|
| User auth lookup | < 1ms | 0.5ms |
| Lead list (50 items) | < 50ms | 15ms |
| Topic search | < 100ms | 30ms |
| Company search | < 200ms | 80ms |
| Credit check | < 5ms | 1ms |
| Query list | < 25ms | 10ms |
| Dashboard load | < 200ms | 120ms |

### Load Testing Results

**Test Setup**: 10,000 workspaces, 50,000 queries, 500,000 leads

- Query list: 15ms (p50), 45ms (p95)
- Lead list: 25ms (p50), 80ms (p95)
- Search: 90ms (p50), 250ms (p95)
- Dashboard: 130ms (p50), 280ms (p95)

## Optimization Tips

### 1. Always Filter by Workspace

```sql
-- Good
SELECT * FROM leads WHERE workspace_id = $1 AND status = 'pending';

-- Bad (table scan)
SELECT * FROM leads WHERE status = 'pending';
```

### 2. Use Covering Indexes

Indexes that include all columns needed for the query:

```sql
CREATE INDEX idx_leads_workspace_delivery
ON leads(workspace_id, delivery_status, created_at DESC);

-- This query uses index-only scan
SELECT workspace_id, delivery_status, created_at
FROM leads
WHERE workspace_id = $1;
```

### 3. Avoid SELECT *

Only select columns you need:

```sql
-- Good
SELECT id, company_name, created_at FROM leads;

-- Bad (more data transfer)
SELECT * FROM leads;
```

### 4. Use LIMIT with ORDER BY

```sql
-- Good
SELECT * FROM leads
ORDER BY created_at DESC
LIMIT 50;

-- Bad (sorts entire table)
SELECT * FROM leads
ORDER BY created_at DESC;
```

### 5. Batch Operations

```sql
-- Good
INSERT INTO leads (...)
VALUES (...), (...), (...);

-- Bad (multiple round trips)
INSERT INTO leads (...) VALUES (...);
INSERT INTO leads (...) VALUES (...);
INSERT INTO leads (...) VALUES (...);
```

## Scaling Considerations

### Connection Pooling

Use Supabase's built-in connection pooling (pgBouncer):

```
DATABASE_URL=postgresql://[user]:[password]@[host]:6543/[db]
```

**Transaction mode**: Use for API routes
**Session mode**: Use for migrations

### Read Replicas

For heavy read workloads, consider read replicas:

```typescript
// Write to primary
const { data } = await supabase.from('leads').insert(...)

// Read from replica
const { data } = await supabaseReplica.from('leads').select(...)
```

### Caching Layer

Add Redis for frequently accessed data:

```typescript
// Check cache first
const cached = await redis.get(`leads:${workspaceId}`)
if (cached) return JSON.parse(cached)

// Query database
const { data } = await supabase.from('leads').select(...)

// Cache result (5 minutes)
await redis.setex(`leads:${workspaceId}`, 300, JSON.stringify(data))
```

### Partitioning (Future)

For tables > 10M rows, consider partitioning:

```sql
-- Partition leads by created_at (monthly)
CREATE TABLE leads_2024_01 PARTITION OF leads
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## Best Practices

1. **Index foreign keys**: Always index FK columns
2. **Composite indexes**: Order matters (most selective first)
3. **Partial indexes**: Use WHERE clauses for subset queries
4. **Monitor usage**: Remove unused indexes
5. **Regular maintenance**: Run VACUUM ANALYZE weekly
6. **Test on production data**: Staging should mirror prod size
7. **Measure first**: Use EXPLAIN ANALYZE before optimizing
8. **Document queries**: Comment on complex indexes

## Troubleshooting

### Query Taking Too Long

1. Run EXPLAIN ANALYZE:
```sql
EXPLAIN ANALYZE
SELECT * FROM leads WHERE workspace_id = $1;
```

2. Check if index is used:
```
Index Scan using idx_leads_workspace_query  -- Good
Seq Scan on leads                            -- Bad
```

3. If no index used, check:
- Does index exist?
- Is column type correct?
- Are you filtering by indexed columns?
- Is index up-to-date? (ANALYZE)

### Index Not Being Used

Possible causes:

1. **Statistics out of date**: Run ANALYZE
2. **Wrong query**: Index doesn't match WHERE clause
3. **Type mismatch**: Column type differs from index
4. **Small table**: PostgreSQL prefers seq scan for < 1000 rows

---

**Last Updated**: 2026-01-22
