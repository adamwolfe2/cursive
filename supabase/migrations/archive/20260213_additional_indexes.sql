-- =====================================================
-- Phase 4: Performance & Indexes
-- Migration: Additional Composite Indexes
-- Date: 2026-02-13
-- =====================================================

-- Purpose: Optimize hot paths and reduce database load
-- These indexes target the most frequently queried patterns
-- All indexes are created CONCURRENTLY to avoid locking production tables

-- =====================================================
-- 1. WORKSPACE LEAD FILTERING (Admin Dashboard)
-- =====================================================

-- Supports queries like:
-- SELECT * FROM leads
-- WHERE workspace_id = ? AND verification_status = ?
-- ORDER BY created_at DESC
-- LIMIT 50

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_workspace_status_created
  ON leads(workspace_id, verification_status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Also support filtering by marketplace listing status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_workspace_marketplace_created
  ON leads(workspace_id, is_marketplace_listed, created_at DESC)
  WHERE deleted_at IS NULL AND is_marketplace_listed = true;

-- =====================================================
-- 2. COMMISSION PROCESSING (Monthly Batch Jobs)
-- =====================================================

-- Supports finding commissions ready for payout:
-- SELECT * FROM marketplace_purchase_items
-- WHERE commission_status IN ('pending_holdback', 'payable')
-- AND commission_payable_at <= NOW()

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mpi_commission_processing
  ON marketplace_purchase_items(commission_status, commission_payable_at)
  WHERE commission_status IN ('pending_holdback', 'payable');

-- Support partner-specific commission queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mpi_partner_status
  ON marketplace_purchase_items(partner_id, commission_status, created_at DESC)
  WHERE commission_status IS NOT NULL;

-- =====================================================
-- 3. LEAD FRESHNESS UPDATES (Nightly Job)
-- =====================================================

-- Supports finding marketplace leads that need freshness updates:
-- SELECT id FROM leads
-- WHERE is_marketplace_listed = true
-- AND created_at < NOW() - INTERVAL '30 days'

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_freshness_update
  ON leads(is_marketplace_listed, created_at)
  WHERE is_marketplace_listed = true AND deleted_at IS NULL;

-- Support freshness score queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_freshness_score
  ON leads(freshness_score DESC, created_at DESC)
  WHERE is_marketplace_listed = true AND deleted_at IS NULL;

-- =====================================================
-- 4. USER LEAD ASSIGNMENTS (Dashboard)
-- =====================================================

-- Supports queries like:
-- SELECT * FROM user_lead_assignments
-- WHERE workspace_id = ? AND status = ?
-- ORDER BY created_at DESC

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ula_workspace_status_created
  ON user_lead_assignments(workspace_id, status, created_at DESC);

-- Support user-specific assignment queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ula_user_status
  ON user_lead_assignments(user_id, status, created_at DESC);

-- =====================================================
-- 5. CAMPAIGN LEAD DUPLICATE CHECK
-- =====================================================

-- Supports checking if lead already in campaign:
-- SELECT 1 FROM campaign_leads
-- WHERE campaign_id = ? AND lead_id = ?

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_leads_campaign_lead
  ON campaign_leads(campaign_id, lead_id);

-- Support reverse lookup (which campaigns has this lead)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_leads_lead_campaign
  ON campaign_leads(lead_id, campaign_id);

-- =====================================================
-- 6. MARKETPLACE PURCHASES (Purchase History)
-- =====================================================

-- Supports buyer purchase history:
-- SELECT * FROM marketplace_purchases
-- WHERE buyer_workspace_id = ?
-- ORDER BY created_at DESC

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mp_buyer_created
  ON marketplace_purchases(buyer_workspace_id, created_at DESC);

-- Support seller purchase history (partner earnings)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mpi_partner_created
  ON marketplace_purchase_items(partner_id, created_at DESC);

-- =====================================================
-- 7. PARTNER PERFORMANCE QUERIES
-- =====================================================

-- Support partner leaderboard/rankings:
-- SELECT * FROM partners
-- ORDER BY partner_score DESC, total_sales DESC

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_performance
  ON partners(partner_score DESC, total_sales DESC)
  WHERE deleted_at IS NULL;

-- Support active partner queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_active
  ON partners(is_active, created_at DESC)
  WHERE deleted_at IS NULL;

-- =====================================================
-- 8. AUDIT LOGS (Admin Investigations)
-- =====================================================

-- Support workspace audit log queries:
-- SELECT * FROM audit_logs
-- WHERE workspace_id = ?
-- ORDER BY created_at DESC
-- LIMIT 100

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_workspace_created
  ON audit_logs(workspace_id, created_at DESC);

-- Support resource-specific audit trails
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource
  ON audit_logs(resource_type, resource_id, created_at DESC);

-- Support user action history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_created
  ON audit_logs(user_id, created_at DESC);

-- =====================================================
-- 9. CAMPAIGN METRICS (Campaign Dashboard)
-- =====================================================

-- Support campaign email metrics:
-- SELECT COUNT(*), status FROM campaign_emails
-- WHERE campaign_id = ?
-- GROUP BY status

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_emails_campaign_status
  ON campaign_emails(campaign_id, status);

-- Support scheduled email queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_emails_scheduled
  ON campaign_emails(scheduled_at)
  WHERE status = 'scheduled' AND scheduled_at IS NOT NULL;

-- =====================================================
-- 10. LEAD ROUTING (Lead Assignment Engine)
-- =====================================================

-- Support finding available leads for routing:
-- SELECT * FROM leads
-- WHERE workspace_id = ? AND status = 'new'
-- AND routing_lock_expires_at IS NULL OR routing_lock_expires_at < NOW()

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_routing_available
  ON leads(workspace_id, status, routing_lock_expires_at)
  WHERE status = 'new';

-- =====================================================
-- VERIFICATION QUERIES (commented out)
-- =====================================================

-- Check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE indexname LIKE 'idx_%'
-- ORDER BY idx_scan DESC;

-- Find unused indexes (candidates for removal):
-- SELECT schemaname, tablename, indexname, idx_scan
-- FROM pg_stat_user_indexes
-- WHERE idx_scan = 0
-- AND indexname NOT LIKE 'pg_%'
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- Check table sizes and index sizes:
-- SELECT
--   schemaname,
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
--   pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
