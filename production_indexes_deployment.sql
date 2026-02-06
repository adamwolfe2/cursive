-- Production Index Deployment Script
--
-- This script creates all performance indexes with CONCURRENTLY to avoid table locks
-- Run this manually in production for zero-downtime deployment
--
-- IMPORTANT:
-- - Cannot be run inside a transaction block
-- - Must be run by a user with sufficient privileges
-- - Indexes will be created in the background without blocking queries
-- - Monitor progress with: SELECT * FROM pg_stat_progress_create_index;
--
-- Estimated Total Time: 5-15 minutes (depends on table size)
--
-- ============================================================================

-- Check current connection
SELECT current_database(), current_user, version();

\echo '\n==================================================================='
\echo 'Production Performance Indexes Deployment'
\echo 'Starting at: ' || now()
\echo '==================================================================='

-- ============================================================================
-- LEADS TABLE INDEXES (Largest table - ~1-5 minutes per index)
-- ============================================================================

\echo '\n--- Creating leads table indexes ---'

\echo 'Creating idx_leads_workspace_created...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_workspace_created
  ON leads(workspace_id, created_at DESC);

\echo 'Creating idx_leads_workspace_status...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_workspace_status
  ON leads(workspace_id, status);

\echo 'Creating idx_leads_workspace_query...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_workspace_query
  ON leads(workspace_id, query_id);

\echo 'Creating idx_leads_workspace_enrichment...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_workspace_enrichment
  ON leads(workspace_id, enrichment_status);

\echo 'Creating idx_leads_workspace_delivery...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_workspace_delivery
  ON leads(workspace_id, delivery_status);

-- Covering index - includes commonly queried columns
\echo 'Creating idx_leads_workspace_created_covering (this may take longer)...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_workspace_created_covering
  ON leads(workspace_id, created_at DESC)
  INCLUDE (id, full_name, company_name, status, enrichment_status);

-- Partial indexes - smaller and faster
\echo 'Creating idx_leads_pending_enrichment (partial)...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_pending_enrichment
  ON leads(workspace_id, created_at)
  WHERE enrichment_status = 'pending';

\echo 'Creating idx_leads_failed_delivery (partial)...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_failed_delivery
  ON leads(workspace_id, created_at)
  WHERE delivery_status = 'failed';

-- ============================================================================
-- MARKETPLACE_PURCHASES TABLE INDEXES (~1 minute)
-- ============================================================================

\echo '\n--- Creating marketplace_purchases indexes ---'

\echo 'Creating idx_marketplace_purchases_workspace_created...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_purchases_workspace_created
  ON marketplace_purchases(buyer_workspace_id, created_at DESC);

\echo 'Creating idx_marketplace_purchases_workspace_status...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_purchases_workspace_status
  ON marketplace_purchases(buyer_workspace_id, status);

-- ============================================================================
-- PARTNERS TABLE INDEXES (~1-2 minutes)
-- ============================================================================

\echo '\n--- Creating partners indexes ---'

\echo 'Creating idx_partners_status_created...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_status_created
  ON partners(status, created_at DESC);

-- Trigram indexes for search (requires pg_trgm extension)
\echo 'Creating idx_partners_name_trgm (GIN index - may take longer)...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_name_trgm
  ON partners USING gin (name gin_trgm_ops);

\echo 'Creating idx_partners_company_trgm (GIN index)...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_company_trgm
  ON partners USING gin (company_name gin_trgm_ops)
  WHERE company_name IS NOT NULL;

-- ============================================================================
-- EMAIL_CAMPAIGNS TABLE INDEXES (~30 seconds)
-- ============================================================================

\echo '\n--- Creating email_campaigns indexes ---'

\echo 'Creating idx_email_campaigns_workspace_status...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_campaigns_workspace_status
  ON email_campaigns(workspace_id, status);

\echo 'Creating idx_email_campaigns_workspace_created...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_campaigns_workspace_created
  ON email_campaigns(workspace_id, created_at DESC);

\echo 'Creating idx_email_campaigns_active (partial)...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_campaigns_active
  ON email_campaigns(workspace_id, created_at DESC)
  WHERE status = 'active';

-- ============================================================================
-- AD_CAMPAIGNS TABLE INDEXES (~30 seconds)
-- ============================================================================

\echo '\n--- Creating ad_campaigns indexes ---'

\echo 'Creating idx_ad_campaigns_workspace_created...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ad_campaigns_workspace_created
  ON ad_campaigns(brand_workspace_id, created_at DESC);

\echo 'Creating idx_ad_campaigns_workspace_campaign_status...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ad_campaigns_workspace_campaign_status
  ON ad_campaigns(brand_workspace_id, campaign_status);

-- ============================================================================
-- ADD INDEX DOCUMENTATION
-- ============================================================================

\echo '\n--- Adding index comments ---'

COMMENT ON INDEX idx_leads_workspace_created IS 'Composite index for common leads listing query pattern - workspace filtering with created_at ordering';
COMMENT ON INDEX idx_leads_workspace_status IS 'Composite index for filtering leads by status within workspace';
COMMENT ON INDEX idx_leads_workspace_query IS 'Composite index for filtering leads by query within workspace';
COMMENT ON INDEX idx_leads_workspace_enrichment IS 'Composite index for filtering leads by enrichment status within workspace';
COMMENT ON INDEX idx_leads_workspace_delivery IS 'Composite index for filtering leads by delivery status within workspace';
COMMENT ON INDEX idx_marketplace_purchases_workspace_created IS 'Composite index for purchase history queries with date ordering';
COMMENT ON INDEX idx_marketplace_purchases_workspace_status IS 'Composite index for filtering purchases by status within workspace';
COMMENT ON INDEX idx_partners_status_created IS 'Composite index for partner dashboard and admin queries';
COMMENT ON INDEX idx_email_campaigns_workspace_status IS 'Composite index for filtering campaigns by status within workspace';
COMMENT ON INDEX idx_email_campaigns_workspace_created IS 'Composite index for listing campaigns with date ordering';
COMMENT ON INDEX idx_leads_workspace_created_covering IS 'Covering index to enable index-only scans for lead listings - includes commonly queried columns';
COMMENT ON INDEX idx_email_campaigns_active IS 'Partial index for active campaigns only - optimizes common dashboard queries';
COMMENT ON INDEX idx_leads_pending_enrichment IS 'Partial index for pending enrichment - optimizes background job queries';
COMMENT ON INDEX idx_leads_failed_delivery IS 'Partial index for failed deliveries - optimizes retry job and monitoring queries';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

\echo '\n==================================================================='
\echo 'Verifying indexes were created...'
\echo '==================================================================='

SELECT
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
JOIN pg_stat_user_indexes USING (schemaname, tablename, indexname)
WHERE schemaname = 'public'
    AND (indexname LIKE 'idx_leads_workspace%'
         OR indexname LIKE 'idx_marketplace_purchases_workspace%'
         OR indexname LIKE 'idx_partners_%trgm'
         OR indexname LIKE 'idx_partners_status%'
         OR indexname LIKE 'idx_email_campaigns%'
         OR indexname LIKE 'idx_ad_campaigns_workspace%')
ORDER BY tablename, indexname;

\echo '\n==================================================================='
\echo 'Deployment completed at: ' || now()
\echo '==================================================================='

-- ============================================================================
-- POST-DEPLOYMENT MONITORING
-- ============================================================================

\echo '\n--- Recommended Monitoring Queries ---'

\echo 'Monitor index usage after 24 hours:'
\echo 'SELECT relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch'
\echo 'FROM pg_stat_user_indexes'
\echo 'WHERE indexrelname LIKE ''idx_%workspace%'''
\echo 'ORDER BY idx_scan DESC;'

\echo '\nCheck for invalid indexes (in case of concurrent build failure):'
\echo 'SELECT indexrelid::regclass, indrelid::regclass'
\echo 'FROM pg_index'
\echo 'WHERE NOT indisvalid;'

\echo '\nMonitor query performance with EXPLAIN ANALYZE on key queries'
\echo 'EXPLAIN (ANALYZE, BUFFERS) SELECT ... FROM leads WHERE workspace_id = ... ORDER BY created_at DESC LIMIT 50;'

-- ============================================================================
-- ROLLBACK (If Needed)
-- ============================================================================

\echo '\n--- Rollback Commands (if needed) ---'
\echo 'To remove these indexes, run:'
\echo 'DROP INDEX CONCURRENTLY IF EXISTS idx_leads_workspace_created;'
\echo 'DROP INDEX CONCURRENTLY IF EXISTS idx_leads_workspace_status;'
\echo '... (repeat for each index)'
