-- =====================================================
-- ROLLBACK: Phase 4 - Additional Performance Indexes
-- Reverses: 20260213_additional_indexes.sql
-- Date: 2026-02-13
-- =====================================================

-- Drop all performance indexes added in Phase 4

-- Campaign lead duplicate check
DROP INDEX CONCURRENTLY IF EXISTS idx_campaign_leads_campaign_lead;

-- User lead assignments dashboard
DROP INDEX CONCURRENTLY IF EXISTS idx_ula_workspace_status_created;

-- Lead freshness updates (nightly job)
DROP INDEX CONCURRENTLY IF EXISTS idx_leads_freshness_update;

-- Commission processing (monthly batch jobs)
DROP INDEX CONCURRENTLY IF EXISTS idx_mpi_commission_processing;

-- Workspace lead filtering (admin dashboard)
DROP INDEX CONCURRENTLY IF EXISTS idx_leads_workspace_status_created;

-- Partner campaign lookup
DROP INDEX CONCURRENTLY IF EXISTS idx_partner_campaigns_partner_status;

-- Marketplace purchase filtering
DROP INDEX CONCURRENTLY IF EXISTS idx_mp_buyer_workspace_created;

-- Audit log querying by resource
DROP INDEX CONCURRENTLY IF EXISTS idx_audit_logs_resource;

-- Lead conversion tracking
DROP INDEX CONCURRENTLY IF EXISTS idx_lead_conversions_partner_created;

-- Campaign performance metrics
DROP INDEX CONCURRENTLY IF EXISTS idx_campaigns_workspace_status_created;

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================

-- NOTE: This removes performance indexes that optimize hot query paths.
-- Query performance will degrade after rollback, especially for:
-- - Admin dashboards
-- - Commission processing
-- - Campaign imports
-- - Audit log filtering
