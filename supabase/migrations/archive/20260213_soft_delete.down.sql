-- =====================================================
-- ROLLBACK: Phase 5 - Soft Delete Support
-- Reverses: 20260213_soft_delete.sql
-- Date: 2026-02-13
-- =====================================================

-- =====================================================
-- 1. DROP HELPER FUNCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS permanent_delete_old_soft_deletes();
DROP FUNCTION IF EXISTS get_deleted_leads_count(UUID);
DROP FUNCTION IF EXISTS restore_lead(UUID);
DROP FUNCTION IF EXISTS soft_delete_lead(UUID, UUID);

-- =====================================================
-- 2. REVERT RLS POLICIES
-- =====================================================

-- Restore original RLS policies without deleted_at filters

-- Users table
DROP POLICY IF EXISTS "Users can view workspace users" ON users;
CREATE POLICY "Users can view workspace users" ON users
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Workspaces table
DROP POLICY IF EXISTS "Users can view their workspace" ON workspaces;
CREATE POLICY "Users can view their workspace" ON workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Partners table
DROP POLICY IF EXISTS "Anyone can view active partners" ON partners;
CREATE POLICY "Anyone can view active partners" ON partners
  FOR SELECT USING (true);

-- Leads table
DROP POLICY IF EXISTS "Users can view workspace leads" ON leads;
CREATE POLICY "Users can view workspace leads" ON leads
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. DROP INDEXES FOR SOFT DELETE QUERIES
-- =====================================================

DROP INDEX CONCURRENTLY IF EXISTS idx_leads_deleted_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_not_deleted;
DROP INDEX CONCURRENTLY IF EXISTS idx_workspaces_not_deleted;
DROP INDEX CONCURRENTLY IF EXISTS idx_partners_not_deleted;
DROP INDEX CONCURRENTLY IF EXISTS idx_leads_not_deleted;

-- =====================================================
-- 4. REMOVE SOFT DELETE COLUMNS
-- =====================================================

-- Users table
ALTER TABLE users
  DROP COLUMN IF EXISTS deleted_by;

ALTER TABLE users
  DROP COLUMN IF EXISTS deleted_at;

-- Workspaces table
ALTER TABLE workspaces
  DROP COLUMN IF EXISTS deleted_by;

ALTER TABLE workspaces
  DROP COLUMN IF EXISTS deleted_at;

-- Partners table
ALTER TABLE partners
  DROP COLUMN IF EXISTS deleted_by;

ALTER TABLE partners
  DROP COLUMN IF EXISTS deleted_at;

-- Leads table
ALTER TABLE leads
  DROP COLUMN IF EXISTS deleted_by;

ALTER TABLE leads
  DROP COLUMN IF EXISTS deleted_at;

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================

-- NOTE: This removes GDPR-compliant soft delete functionality.
-- After rollback:
-- - Deletions will be permanent (no 30-day grace period)
-- - Soft-deleted records will become visible again
-- - GDPR compliance may be affected
-- - Deletion audit trail will be lost
