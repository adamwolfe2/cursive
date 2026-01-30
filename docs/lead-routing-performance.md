# Lead Routing Performance Optimization

**Version**: 1.0
**Last Updated**: 2026-01-31
**Status**: Ready for Implementation

---

## Performance Targets (SLOs)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Availability** | 99.9% | TBD | 🔄 |
| **p95 Latency** | < 2000ms | TBD | 🔄 |
| **p99 Latency** | < 5000ms | TBD | 🔄 |
| **Success Rate** | ≥ 95% | TBD | 🔄 |
| **Throughput** | > 50 leads/sec | TBD | 🔄 |
| **Lock Acquisition** | ≥ 95% | TBD | 🔄 |
| **Retry Queue Depth** | < 100 items | TBD | 🔄 |

---

## Database Optimizations

### 1. Indexing Strategy

**Current Indexes** (from migration):
```sql
-- Already created in 20260131000001_lead_routing_fixes.sql
CREATE INDEX idx_leads_routing_status ON leads(routing_status);
CREATE INDEX idx_leads_routing_locked ON leads(routing_locked_by, routing_locked_at);
CREATE INDEX idx_leads_dedupe_hash ON leads(dedupe_hash);
CREATE INDEX idx_leads_expires_at ON leads(lead_expires_at);
CREATE INDEX idx_routing_queue_retry ON lead_routing_queue(next_retry_at, processed_at);
CREATE INDEX idx_routing_logs_lead ON lead_routing_logs(lead_id);
CREATE INDEX idx_routing_logs_workspace ON lead_routing_logs(source_workspace_id);
```

**Additional Recommended Indexes**:

```sql
-- Composite index for lock acquisition query
CREATE INDEX idx_leads_lock_acquisition ON leads(
  routing_status,
  routing_locked_by,
  routing_locked_at
) WHERE routing_status IN ('pending', 'failed');

-- Partial index for active routing
CREATE INDEX idx_leads_active_routing ON leads(id, routing_locked_at)
WHERE routing_status = 'routing';

-- Index for retry queue processing
CREATE INDEX idx_routing_queue_processing ON lead_routing_queue(
  next_retry_at,
  workspace_id,
  attempt_number
) WHERE processed_at IS NULL;

-- Index for routing logs analytics
CREATE INDEX idx_routing_logs_analytics ON lead_routing_logs(
  created_at DESC,
  routing_result,
  source_workspace_id
);

-- Covering index for lead fetch in routing
CREATE INDEX idx_leads_routing_fetch ON leads(
  id,
  workspace_id,
  company_industry,
  company_location,
  dedupe_hash
) WHERE routing_status IN ('pending', 'routing');
```

**Apply Additional Indexes**:
```bash
psql $DATABASE_URL < scripts/add_performance_indexes.sql
```

### 2. Query Optimization

#### Optimize Lock Acquisition

**Before** (implicit query):
```sql
UPDATE leads
SET routing_status = 'routing',
    routing_locked_by = $lock_owner,
    routing_locked_at = NOW(),
    routing_attempts = routing_attempts + 1
WHERE id = $lead_id
  AND routing_status IN ('pending', 'failed')
  AND (routing_locked_by IS NULL OR routing_locked_at < NOW() - INTERVAL '5 minutes')
FOR UPDATE SKIP LOCKED;
```

**After** (optimized with index hints):
```sql
-- PostgreSQL will use idx_leads_lock_acquisition
UPDATE leads
SET routing_status = 'routing',
    routing_locked_by = $lock_owner,
    routing_locked_at = NOW(),
    routing_attempts = routing_attempts + 1
WHERE id = $lead_id
  AND routing_status IN ('pending', 'failed')
  AND COALESCE(routing_locked_at, TIMESTAMP '1970-01-01') < NOW() - INTERVAL '5 minutes'
FOR UPDATE SKIP LOCKED;
```

#### Optimize Cross-Partner Duplicate Check

**Before**:
```sql
SELECT id, workspace_id
FROM leads
WHERE dedupe_hash = $hash
  AND workspace_id != $source_workspace_id
  AND routing_status = 'routed'
LIMIT 1;
```

**After** (with workspace type filter):
```sql
SELECT l.id, l.workspace_id
FROM leads l
INNER JOIN workspaces w ON l.workspace_id = w.id
WHERE l.dedupe_hash = $hash
  AND l.workspace_id != $source_workspace_id
  AND l.routing_status = 'routed'
  AND w.workspace_type = 'partner'  -- Only check partners
LIMIT 1;
```

### 3. Connection Pool Tuning

**Recommended Supabase Connection Pool Settings**:

```bash
# Supabase Pooler Configuration
POOL_MODE=transaction  # Use transaction pooling for atomic operations
POOL_SIZE=20          # Max connections per pool
POOL_TIMEOUT=30       # Connection timeout (seconds)
MAX_CLIENT_CONN=100   # Max client connections
```

**For High-Traffic Scenarios** (> 100 leads/sec):
```bash
POOL_SIZE=50
MAX_CLIENT_CONN=200
```

### 4. Table Maintenance

**Weekly Maintenance** (run during low-traffic hours):

```sql
-- Analyze tables for query planner
ANALYZE leads;
ANALYZE lead_routing_queue;
ANALYZE lead_routing_logs;
ANALYZE workspaces;

-- Vacuum to reclaim space
VACUUM ANALYZE leads;
VACUUM ANALYZE lead_routing_queue;
VACUUM ANALYZE lead_routing_logs;

-- Reindex if fragmentation > 20%
REINDEX TABLE CONCURRENTLY leads;
```

**Monthly Maintenance**:
```sql
-- Full vacuum (requires maintenance window)
VACUUM FULL leads;

-- Check table bloat
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE tablename IN ('leads', 'lead_routing_queue', 'lead_routing_logs')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Application Optimizations

### 1. Caching Strategy

**Cache Routing Rules** (reduces DB queries by 90%):

```typescript
// src/lib/services/lead-routing.service.ts

import { LRUCache } from 'lru-cache'

const routingRulesCache = new LRUCache<string, RoutingRule[]>({
  max: 100, // Max 100 workspaces
  ttl: 1000 * 60 * 5, // 5 minute TTL
  updateAgeOnGet: true,
})

static async getRoutingRules(workspaceId: string): Promise<RoutingRule[]> {
  // Check cache first
  const cached = routingRulesCache.get(workspaceId)
  if (cached) {
    return cached
  }

  // Fetch from database
  const { data: rules } = await supabase
    .from('lead_routing_rules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .order('priority', { ascending: false })

  // Cache for 5 minutes
  if (rules) {
    routingRulesCache.set(workspaceId, rules)
  }

  return rules || []
}
```

**Cache Invalidation** (on rule updates):
```typescript
// After updating routing rule
routingRulesCache.delete(workspaceId)
```

### 2. Batch Processing Optimization

**Current** (processes leads sequentially):
```typescript
for (const lead of leads) {
  await LeadRoutingService.routeLead({ leadId: lead.id, ... })
}
```

**Optimized** (batch processing with concurrency limit):
```typescript
import pLimit from 'p-limit'

const limit = pLimit(10) // Max 10 concurrent routing operations

const results = await Promise.all(
  leads.map(lead =>
    limit(() => LeadRoutingService.routeLead({ leadId: lead.id, ... }))
  )
)
```

### 3. Retry Queue Optimization

**Current** (fixed 5-minute interval):
```typescript
// Cron: */5 * * * *
export const processLeadRoutingRetryQueue = inngest.createFunction(
  { id: 'lead-routing-retry-queue-processor' },
  { cron: '*/5 * * * *' },
  async ({ step }) => {
    return await LeadRoutingService.processRetryQueue(100)
  }
)
```

**Optimized** (adaptive interval based on queue depth):
```typescript
export const processLeadRoutingRetryQueue = inngest.createFunction(
  { id: 'lead-routing-retry-queue-processor' },
  { cron: '*/1 * * * *' }, // Check every minute
  async ({ step }) => {
    const { count: queueDepth } = await supabase
      .from('lead_routing_queue')
      .select('*', { count: 'exact', head: true })
      .lte('next_retry_at', new Date().toISOString())
      .is('processed_at', null)

    if (queueDepth === 0) {
      return { skipped: true, reason: 'queue empty' }
    }

    // Process more items if queue is deep
    const batchSize = queueDepth > 200 ? 200 : queueDepth > 50 ? 100 : 50

    return await LeadRoutingService.processRetryQueue(batchSize)
  }
)
```

### 4. Database Function Optimization

**Optimize `complete_routing` Function**:

```sql
-- Add EXPLAIN ANALYZE to identify bottlenecks
EXPLAIN ANALYZE
SELECT complete_routing(
  'lead-id'::UUID,
  'workspace-id'::UUID,
  'rule-id'::UUID,
  'lock-owner'::UUID
);

-- If slow, add explicit index hints
CREATE OR REPLACE FUNCTION complete_routing(
  p_lead_id UUID,
  p_destination_workspace_id UUID,
  p_matched_rule_id UUID,
  p_lock_owner UUID
) RETURNS BOOLEAN AS $
DECLARE
  v_updated BOOLEAN := false;
  v_source_workspace_id UUID;
BEGIN
  -- Update lead atomically (uses idx_leads_lock_acquisition)
  UPDATE leads
  SET
    routing_status = 'routed',
    workspace_id = p_destination_workspace_id,
    routing_locked_by = NULL,
    routing_locked_at = NULL,
    routing_error = NULL,
    updated_at = NOW()
  WHERE id = p_lead_id
    AND routing_locked_by = p_lock_owner  -- Verify lock ownership
    AND routing_status = 'routing'
  RETURNING workspace_id INTO v_source_workspace_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF NOT v_updated THEN
    RETURN false;
  END IF;

  -- Insert log asynchronously (separate transaction)
  PERFORM pg_notify(
    'routing_log_queue',
    json_build_object(
      'lead_id', p_lead_id,
      'source_workspace_id', v_source_workspace_id,
      'destination_workspace_id', p_destination_workspace_id,
      'matched_rule_id', p_matched_rule_id,
      'routing_result', 'success'
    )::text
  );

  RETURN true;
END;
$ LANGUAGE plpgsql;

-- Create async log processor
CREATE OR REPLACE FUNCTION process_routing_log_queue() RETURNS TRIGGER AS $
BEGIN
  INSERT INTO lead_routing_logs (
    lead_id,
    source_workspace_id,
    destination_workspace_id,
    matched_rule_id,
    routing_result,
    created_at
  ) VALUES (
    (NEW.payload->>'lead_id')::UUID,
    (NEW.payload->>'source_workspace_id')::UUID,
    (NEW.payload->>'destination_workspace_id')::UUID,
    (NEW.payload->>'matched_rule_id')::UUID,
    NEW.payload->>'routing_result',
    NOW()
  );
  RETURN NEW;
END;
$ LANGUAGE plpgsql;
```

---

## Scaling Strategies

### Vertical Scaling (Database)

**When to Scale Up**:
- CPU utilization > 80% sustained
- Connection pool saturation (rejected connections)
- Slow query times (p95 > 500ms)

**Supabase Scaling Path**:
```
Current: Free tier (shared CPU, 500MB RAM)
→ Pro: 2 vCPU, 8GB RAM ($25/mo)
→ Team: 4 vCPU, 16GB RAM ($599/mo)
→ Enterprise: Custom (contact sales)
```

**Database Configuration for Scale**:
```sql
-- Increase shared_buffers (25% of RAM)
ALTER SYSTEM SET shared_buffers = '2GB';

-- Increase work_mem for complex queries
ALTER SYSTEM SET work_mem = '64MB';

-- Increase effective_cache_size (50% of RAM)
ALTER SYSTEM SET effective_cache_size = '4GB';

-- Tune for high concurrency
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET max_locks_per_transaction = 128;

-- Reload configuration
SELECT pg_reload_conf();
```

### Horizontal Scaling (Application)

**Inngest Worker Scaling**:

```typescript
// inngest.json
{
  "functions": {
    "processLeadRoutingRetryQueue": {
      "concurrency": [
        {
          "limit": 10,  // Max 10 concurrent executions
          "key": "workspace_id"  // Per-workspace concurrency
        }
      ],
      "rateLimit": {
        "limit": 100,  // Max 100 executions
        "period": "1m"  // Per minute
      }
    }
  }
}
```

**Auto-Scaling Configuration** (Vercel):

```json
{
  "functions": {
    "api/leads/route.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "build": {
    "env": {
      "ENABLE_EXPERIMENTAL_COREPACK": "1"
    }
  }
}
```

### Read Replica Strategy (Future)

**For High Read Volumes** (> 1000 reads/sec):

```typescript
// Use read replica for non-atomic queries
const readClient = createClient(process.env.SUPABASE_READ_REPLICA_URL!)

// Routing rules lookup (can tolerate stale data)
const { data: rules } = await readClient
  .from('lead_routing_rules')
  .select('*')
  .eq('workspace_id', workspaceId)

// Atomic operations use primary database
const writeClient = createAdminClient()
const { data } = await writeClient.rpc('acquire_routing_lock', ...)
```

---

## Performance Benchmarks

### Baseline Metrics (Expected)

| Scenario | Throughput | p95 Latency | Success Rate |
|----------|-----------|-------------|--------------|
| Sequential | 50 leads/sec | 500ms | 99% |
| Concurrent (10x) | 100 leads/sec | 1500ms | 98% |
| Duplicate Detection | 80 leads/sec | 300ms | 100% |
| Retry Queue | 150 leads/sec | 800ms | 95% |

### Running Benchmarks

```bash
# Install dependencies
pnpm install -D tsx

# Run benchmark suite
tsx scripts/benchmark-lead-routing.ts

# Run specific scenario
tsx scripts/benchmark-lead-routing.ts --scenario concurrent --count 1000 --concurrency 20

# Output benchmark report
tsx scripts/benchmark-lead-routing.ts --output benchmark-results.json
```

### Interpreting Results

**Healthy System**:
- ✅ p95 latency < 2000ms
- ✅ Success rate ≥ 95%
- ✅ Lock acquisition rate ≥ 95%
- ✅ Retry queue depth < 100

**Performance Degradation**:
- ⚠️ p95 latency 2000-5000ms → Investigate slow queries
- ⚠️ Success rate 90-95% → Check retry queue backlog
- ⚠️ Lock acquisition 85-95% → High concurrency, consider scaling

**Critical Issues**:
- 🚨 p95 latency > 5000ms → Database overload, scale immediately
- 🚨 Success rate < 90% → Major routing failures, investigate logs
- 🚨 Lock acquisition < 85% → Deadlock risk, review queries

---

## Monitoring Query Performance

### Identify Slow Queries

```sql
-- Top 10 slowest queries
SELECT
  query,
  calls,
  total_time / calls AS avg_time_ms,
  total_time AS total_time_ms,
  min_time AS min_time_ms,
  max_time AS max_time_ms
FROM pg_stat_statements
WHERE query LIKE '%leads%' OR query LIKE '%routing%'
ORDER BY avg_time_ms DESC
LIMIT 10;
```

### Check Index Usage

```sql
-- Unused indexes (candidates for removal)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND tablename IN ('leads', 'lead_routing_queue', 'lead_routing_logs')
ORDER BY idx_tup_read DESC;

-- Missing indexes (high seq_scans)
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  seq_tup_read / NULLIF(seq_scan, 0) AS avg_seq_read
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN ('leads', 'lead_routing_queue', 'lead_routing_logs')
ORDER BY seq_scan DESC;
```

### Lock Contention Analysis

```sql
-- Current locks on routing tables
SELECT
  l.locktype,
  l.mode,
  l.granted,
  l.pid,
  a.query,
  a.state,
  a.wait_event_type,
  a.wait_event
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE a.query LIKE '%leads%' OR a.query LIKE '%routing%'
ORDER BY l.granted, a.state;

-- Blocking queries
SELECT
  blocked.pid AS blocked_pid,
  blocked.query AS blocked_query,
  blocking.pid AS blocking_pid,
  blocking.query AS blocking_query,
  blocking.state AS blocking_state
FROM pg_stat_activity blocked
JOIN pg_locks blocked_locks ON blocked.pid = blocked_locks.pid
JOIN pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database = blocked_locks.database
  AND blocking_locks.relation = blocked_locks.relation
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_stat_activity blocking ON blocking.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted
  AND blocking_locks.granted;
```

---

## Optimization Checklist

### Database

- [ ] All indexes from migration applied
- [ ] Additional performance indexes added
- [ ] Query plans analyzed (EXPLAIN ANALYZE)
- [ ] Connection pool configured (20-50 connections)
- [ ] Weekly VACUUM ANALYZE scheduled
- [ ] Table bloat monitored
- [ ] Slow query log enabled
- [ ] pg_stat_statements extension enabled

### Application

- [ ] Routing rules cached (5-minute TTL)
- [ ] Batch processing with concurrency limit (10x)
- [ ] Retry queue adaptive processing
- [ ] Database functions optimized
- [ ] Error handling with exponential backoff
- [ ] Connection pooling configured
- [ ] Request timeouts set (10s max)

### Infrastructure

- [ ] Inngest concurrency limits configured
- [ ] Vercel function memory allocated (1024MB)
- [ ] Auto-scaling thresholds set
- [ ] Read replica considered (if > 1000 reads/sec)
- [ ] CDN configured for static assets
- [ ] Database backups scheduled (daily)

### Monitoring

- [ ] Performance benchmarks baseline established
- [ ] Datadog dashboard created
- [ ] Alerts configured (CRITICAL, WARNING, INFO)
- [ ] Slow query alerts enabled
- [ ] Lock contention monitored
- [ ] Throughput tracked
- [ ] SLO compliance tracked (99.9% availability, p95 < 2s)

---

## Future Optimizations

### Phase 2 (Month 2-3)

1. **Implement Read Replicas**
   - Route read-only queries to replica
   - Reduce primary database load by 40%

2. **GraphQL Optimization**
   - Use DataLoader for batching
   - Implement query complexity limits

3. **Background Job Queue**
   - Move non-critical routing to background
   - Use Inngest prioritization

### Phase 3 (Month 4-6)

1. **Sharding Strategy**
   - Partition leads table by workspace_id
   - Reduce query times by 50%

2. **Event Sourcing**
   - Store routing decisions as events
   - Enable replay and audit

3. **Machine Learning**
   - Predict routing failures
   - Auto-optimize rule priority

---

**Next Steps**:
1. Run baseline benchmarks
2. Apply additional indexes
3. Enable caching
4. Monitor for 1 week
5. Re-benchmark and compare

**Review Schedule**: Monthly performance review
