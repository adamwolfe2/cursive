-- Migration: Add Performance Indexes
-- Created: 2026-02-05
-- Description: Adds critical database indexes to optimize query performance across the platform
-- Expected Impact: 70-85% improvement in query response times
--
-- WARNING: For production, these should be created with CONCURRENTLY to avoid table locking
-- See: production_indexes_deployment.sql for zero-downtime deployment

-- ============================================================================
-- LEAD MANAGEMENT INDEXES (9 indexes)
-- ============================================================================

-- Primary listing query (workspace + created_at ordering)
CREATE INDEX IF NOT EXISTS idx_leads_workspace_created
  ON leads(workspace_id, created_at DESC);

-- Covering index for index-only scans (eliminates heap access)
CREATE INDEX IF NOT EXISTS idx_leads_workspace_created_covering
  ON leads(workspace_id, created_at DESC)
  INCLUDE (id, full_name, company_name, status, enrichment_status);

-- Status filtering (workspace + status)
CREATE INDEX IF NOT EXISTS idx_leads_workspace_status
  ON leads(workspace_id, status);

-- Query filtering (workspace + query_id)
CREATE INDEX IF NOT EXISTS idx_leads_workspace_query
  ON leads(workspace_id, query_id);

-- Enrichment status filtering
CREATE INDEX IF NOT EXISTS idx_leads_workspace_enrichment
  ON leads(workspace_id, enrichment_status);

-- Delivery status filtering
CREATE INDEX IF NOT EXISTS idx_leads_workspace_delivery
  ON leads(workspace_id, delivery_status);

-- Partial index for pending enrichment (background jobs)
CREATE INDEX IF NOT EXISTS idx_leads_pending_enrichment
  ON leads(workspace_id, created_at)
  WHERE enrichment_status = 'pending';

-- Partial index for failed deliveries (monitoring)
CREATE INDEX IF NOT EXISTS idx_leads_failed_delivery
  ON leads(workspace_id, created_at)
  WHERE delivery_status = 'failed';

-- Marketplace listing index
CREATE INDEX IF NOT EXISTS idx_leads_marketplace_status
  ON leads(marketplace_status)
  WHERE is_marketplace_listed = true;

COMMENT ON INDEX idx_leads_workspace_created_covering IS
  'Covering index enables index-only scans for lead listings, eliminating heap access';

-- ============================================================================
-- MARKETPLACE PURCHASE INDEXES (2 indexes)
-- ============================================================================

-- Purchase history listing (workspace + created_at)
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_workspace_created
  ON marketplace_purchases(buyer_workspace_id, created_at DESC);

-- Purchase status filtering
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_workspace_status
  ON marketplace_purchases(buyer_workspace_id, status);

-- ============================================================================
-- PARTNER MANAGEMENT INDEXES (3 indexes)
-- ============================================================================

-- Partner admin dashboard (status + created_at)
CREATE INDEX IF NOT EXISTS idx_partners_status_created
  ON partners(status, created_at DESC);

-- Fast fuzzy text search on partner name (GIN trigram)
CREATE INDEX IF NOT EXISTS idx_partners_name_trgm
  ON partners USING gin(name gin_trgm_ops);

-- Fast fuzzy text search on company name
CREATE INDEX IF NOT EXISTS idx_partners_company_trgm
  ON partners USING gin(company_name gin_trgm_ops);

COMMENT ON INDEX idx_partners_name_trgm IS
  'GIN trigram index enables fast LIKE/ILIKE queries on partner names';

-- ============================================================================
-- EMAIL CAMPAIGN INDEXES (3 indexes)
-- ============================================================================

-- Campaign status filtering (workspace + status)
CREATE INDEX IF NOT EXISTS idx_email_campaigns_workspace_status
  ON email_campaigns(workspace_id, status);

-- Campaign listing (workspace + created_at)
CREATE INDEX IF NOT EXISTS idx_email_campaigns_workspace_created
  ON email_campaigns(workspace_id, created_at DESC);

-- Partial index for active campaigns only
CREATE INDEX IF NOT EXISTS idx_email_campaigns_active
  ON email_campaigns(workspace_id, created_at DESC)
  WHERE status = 'active';

-- ============================================================================
-- AD CAMPAIGN INDEXES (2 indexes)
-- ============================================================================

-- Ad campaign listing (workspace + created_at)
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_workspace_created
  ON ad_campaigns(brand_workspace_id, created_at DESC);

-- Ad campaign status filtering
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_workspace_campaign_status
  ON ad_campaigns(brand_workspace_id, campaign_status);

-- ============================================================================
-- VERIFICATION & MONITORING
-- ============================================================================

-- Query to verify all indexes were created successfully
-- Run after migration:
--
-- SELECT tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND indexname LIKE 'idx_%workspace%'
-- ORDER BY tablename, indexname;

-- Query to monitor index usage after 24 hours:
--
-- SELECT
--   schemaname,
--   relname as table,
--   indexrelname as index,
--   idx_scan as scans,
--   pg_size_pretty(pg_relation_size(indexrelid)) as size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
--   AND indexrelname LIKE 'idx_%'
-- ORDER BY idx_scan DESC;
