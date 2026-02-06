# 🚨 APPLY MIGRATIONS NOW

**Status**: Code deployed ✅ | Migrations pending ⏳

The code is live in production but the database migrations have NOT been applied yet.

---

## Why This Matters

### Race Condition Fixes Won't Work Yet 🔒
The code is calling these database functions, but they don't exist yet:
- `validate_and_lock_leads_for_purchase()`
- `complete_credit_lead_purchase()`
- `complete_stripe_lead_purchase()`
- `mark_leads_sold_bulk()`

**Impact**: Payment flows will fail until migrations are applied.

### Performance Indexes Don't Exist Yet ⚡
The queries are unchanged, so performance is the same until indexes are created.

---

## Quick Start: Apply Migrations

### Option 1: Supabase Dashboard (Easiest) ⭐

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click "SQL Editor" in sidebar

2. **Apply Race Condition Fixes**
   - Copy contents of `supabase/migrations/20260205000001_fix_payment_race_conditions.sql`
   - Paste into SQL Editor
   - Click "Run"
   - ✅ Should see "Success" message

3. **Apply Performance Indexes**
   - Copy contents of `supabase/migrations/20260205000002_add_performance_indexes.sql`
   - Paste into SQL Editor
   - Click "Run"
   - ✅ Should see "Success" message

4. **Verify**
   ```sql
   -- Check functions exist
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_schema = 'public'
     AND routine_name LIKE '%purchase%'
   ORDER BY routine_name;
   -- Should return 4 functions

   -- Check indexes exist
   SELECT tablename, indexname
   FROM pg_indexes
   WHERE schemaname = 'public'
     AND indexname LIKE 'idx_%workspace%'
   ORDER BY tablename, indexname;
   -- Should return 18+ indexes
   ```

---

### Option 2: Supabase CLI

```bash
# 1. Install Supabase CLI (if not installed)
npm install -g supabase

# 2. Link to your project
supabase link --project-ref your-project-ref

# 3. Apply migrations
supabase db push

# 4. Verify
supabase db diff
```

---

### Option 3: psql Command Line

```bash
# 1. Set database URL
export DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# 2. Apply race condition fixes
psql $DATABASE_URL -f supabase/migrations/20260205000001_fix_payment_race_conditions.sql

# 3. Apply performance indexes (zero-downtime)
psql $DATABASE_URL -f production_indexes_deployment.sql

# 4. Verify
psql $DATABASE_URL -c "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%purchase%';"
```

---

## Production Considerations

### For Race Condition Migration
- ✅ Safe to apply immediately
- ✅ No downtime
- ✅ Creates functions only (doesn't modify tables)
- ⚠️ Test after applying (see verification below)

### For Performance Indexes
- ⚠️ Use `production_indexes_deployment.sql` instead
- ✅ Uses `CREATE INDEX CONCURRENTLY` (no table locks)
- ⚠️ Takes longer (5-10 minutes) but zero downtime
- ✅ Application continues running during creation

---

## Verification After Applying

### 1. Check Functions Exist
```sql
-- Should return 4 functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'validate_and_lock_leads_for_purchase',
    'complete_credit_lead_purchase',
    'complete_stripe_lead_purchase',
    'mark_leads_sold_bulk'
  );
```

### 2. Check Indexes Exist
```sql
-- Should return 18+ indexes
SELECT tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_indexes
JOIN pg_class ON pg_class.relname = pg_indexes.indexname
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

### 3. Test Payment Flow
```sql
-- Test validate_and_lock_leads_for_purchase
BEGIN;
SELECT * FROM validate_and_lock_leads_for_purchase(
  ARRAY['some-lead-uuid']::UUID[],
  'some-workspace-uuid'::UUID
);
ROLLBACK;
-- Should return leads or error if not available
```

### 4. Check Index Usage (After 1 Hour)
```sql
-- Check which indexes are being used
SELECT
  schemaname,
  relname as table,
  indexrelname as index,
  idx_scan as scans,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexrelname LIKE 'idx_%'
ORDER BY idx_scan DESC
LIMIT 20;
```

---

## Troubleshooting

### Error: "function already exists"
This means the migration was already applied. You can safely ignore this error or use `CREATE OR REPLACE FUNCTION` instead.

### Error: "relation does not exist"
Make sure you're connected to the correct database. Check:
```sql
SELECT current_database();
```

### Error: "lock timeout"
If creating indexes without CONCURRENTLY, you may need to wait for queries to finish. Use `production_indexes_deployment.sql` instead for zero-downtime deployment.

### Indexes not being used
After creating indexes, run:
```sql
ANALYZE leads;
ANALYZE marketplace_purchases;
ANALYZE partners;
ANALYZE email_campaigns;
ANALYZE ad_campaigns;
```

This updates table statistics so PostgreSQL can use the new indexes.

---

## Timeline

### Immediate (Now)
- [ ] Apply race condition migration
- [ ] Test payment flow
- [ ] Verify functions exist

### Within 1 Hour
- [ ] Apply performance indexes (with CONCURRENTLY)
- [ ] Run ANALYZE on tables
- [ ] Check index usage stats

### Within 24 Hours
- [ ] Monitor performance improvements
- [ ] Check index scan counts
- [ ] Verify no errors in application logs

---

## Support

**If migrations fail:**
1. Check error message in SQL output
2. Verify database connection
3. Check database permissions
4. Review migration files for syntax errors

**If you need to rollback:**
```sql
-- Rollback race conditions (if needed)
DROP FUNCTION IF EXISTS validate_and_lock_leads_for_purchase;
DROP FUNCTION IF EXISTS complete_credit_lead_purchase;
DROP FUNCTION IF EXISTS complete_stripe_lead_purchase;
DROP FUNCTION IF EXISTS mark_leads_sold_bulk;

-- Rollback indexes (if needed)
DROP INDEX CONCURRENTLY IF EXISTS idx_leads_workspace_created;
-- ... etc for all indexes
```

---

## ⚡ Quick Command Reference

```bash
# Apply all migrations (Supabase CLI)
supabase db push

# Apply via psql (with connection string)
psql $DATABASE_URL -f supabase/migrations/20260205000001_fix_payment_race_conditions.sql
psql $DATABASE_URL -f production_indexes_deployment.sql

# Verify functions
psql $DATABASE_URL -c "SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%purchase%';"

# Verify indexes
psql $DATABASE_URL -c "SELECT tablename, indexname FROM pg_indexes WHERE indexname LIKE 'idx_%';"

# Update statistics
psql $DATABASE_URL -c "ANALYZE leads; ANALYZE marketplace_purchases;"
```

---

**Status**: Migrations ready to apply 🚀

Choose Option 1 (Supabase Dashboard) if you're not comfortable with command line.
