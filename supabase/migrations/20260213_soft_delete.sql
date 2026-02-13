-- =====================================================
-- Phase 5: Missing Features & APIs
-- Migration: Soft Delete Support
-- Date: 2026-02-13
-- =====================================================

-- Purpose: Enable GDPR-compliant data deletion without breaking referential integrity
-- Soft delete keeps records in database but marks them as deleted
-- Prevents orphaned foreign keys while complying with "right to be forgotten"

-- =====================================================
-- 1. ADD SOFT DELETE COLUMNS
-- =====================================================

-- Add to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) DEFAULT NULL;

-- Add to partners table
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) DEFAULT NULL;

-- Add to workspaces table (for account deletion)
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) DEFAULT NULL;

-- Add to users table (for user removal)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) DEFAULT NULL;

-- =====================================================
-- 2. CREATE INDEXES FOR SOFT DELETE QUERIES
-- =====================================================

-- Efficiently filter out deleted records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_not_deleted
  ON leads(workspace_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_not_deleted
  ON partners(id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspaces_not_deleted
  ON workspaces(id)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_not_deleted
  ON users(workspace_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Index for finding deleted records (admin/audit)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_deleted_at
  ON leads(deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

-- =====================================================
-- 3. UPDATE RLS POLICIES TO FILTER DELETED RECORDS
-- =====================================================

-- Leads: Users should only see non-deleted leads
DROP POLICY IF EXISTS "Users can view workspace leads" ON leads;
CREATE POLICY "Users can view workspace leads" ON leads
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
    AND deleted_at IS NULL
  );

-- Partners: Filter deleted partners
DROP POLICY IF EXISTS "Anyone can view active partners" ON partners;
CREATE POLICY "Anyone can view active partners" ON partners
  FOR SELECT USING (
    deleted_at IS NULL
  );

-- Workspaces: Filter deleted workspaces
DROP POLICY IF EXISTS "Users can view their workspace" ON workspaces;
CREATE POLICY "Users can view their workspace" ON workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
    AND deleted_at IS NULL
  );

-- Users: Filter deleted users
DROP POLICY IF EXISTS "Users can view workspace users" ON users;
CREATE POLICY "Users can view workspace users" ON users
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
    AND deleted_at IS NULL
  );

-- =====================================================
-- 4. CREATE SOFT DELETE HELPER FUNCTIONS
-- =====================================================

-- Soft delete a lead
CREATE OR REPLACE FUNCTION soft_delete_lead(
  p_lead_id UUID,
  p_deleted_by UUID
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  UPDATE leads
  SET
    deleted_at = NOW(),
    deleted_by = p_deleted_by
  WHERE id = p_lead_id
    AND deleted_at IS NULL
  RETURNING json_build_object(
    'id', id,
    'email', email,
    'deleted_at', deleted_at,
    'deleted_by', deleted_by
  ) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Lead not found or already deleted';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION soft_delete_lead(UUID, UUID) TO authenticated;

-- Restore a soft-deleted lead (admin only)
CREATE OR REPLACE FUNCTION restore_lead(p_lead_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  UPDATE leads
  SET
    deleted_at = NULL,
    deleted_by = NULL
  WHERE id = p_lead_id
    AND deleted_at IS NOT NULL
  RETURNING json_build_object(
    'id', id,
    'email', email,
    'restored', true
  ) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Lead not found or not deleted';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION restore_lead(UUID) TO service_role;

-- Get deleted leads count (for admin monitoring)
CREATE OR REPLACE FUNCTION get_deleted_leads_count(p_workspace_id UUID DEFAULT NULL)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'total_deleted', (
      SELECT COUNT(*)
      FROM leads
      WHERE deleted_at IS NOT NULL
        AND (p_workspace_id IS NULL OR workspace_id = p_workspace_id)
    ),
    'deleted_last_30_days', (
      SELECT COUNT(*)
      FROM leads
      WHERE deleted_at IS NOT NULL
        AND deleted_at > NOW() - INTERVAL '30 days'
        AND (p_workspace_id IS NULL OR workspace_id = p_workspace_id)
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_deleted_leads_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_deleted_leads_count(UUID) TO service_role;

-- =====================================================
-- 5. CREATE PERMANENT DELETE FUNCTION (GDPR Compliance)
-- =====================================================

-- Hard delete after soft delete grace period (e.g., 30 days)
-- This permanently removes PII to comply with GDPR deletion requests
CREATE OR REPLACE FUNCTION permanent_delete_old_soft_deletes()
RETURNS JSON AS $$
DECLARE
  v_leads_deleted INTEGER;
  v_partners_deleted INTEGER;
BEGIN
  -- Delete leads that have been soft-deleted for more than 30 days
  DELETE FROM leads
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_leads_deleted = ROW_COUNT;

  -- Delete partners that have been soft-deleted for more than 30 days
  DELETE FROM partners
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_partners_deleted = ROW_COUNT;

  RETURN json_build_object(
    'leads_permanently_deleted', v_leads_deleted,
    'partners_permanently_deleted', v_partners_deleted,
    'executed_at', NOW()
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION permanent_delete_old_soft_deletes() TO service_role;

COMMENT ON FUNCTION permanent_delete_old_soft_deletes IS 'Permanently delete soft-deleted records after 30-day grace period for GDPR compliance';

-- =====================================================
-- USAGE EXAMPLES (commented out)
-- =====================================================

-- Soft delete a lead:
-- SELECT soft_delete_lead('[lead-id]', '[user-id]');

-- Restore a lead (admin):
-- SELECT restore_lead('[lead-id]');

-- Get deleted leads count:
-- SELECT get_deleted_leads_count('[workspace-id]');

-- Run permanent deletion (cron job):
-- SELECT permanent_delete_old_soft_deletes();
