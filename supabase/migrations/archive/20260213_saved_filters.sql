-- =====================================================
-- Phase 5: Missing Features & APIs
-- Migration: Saved Filter Presets
-- Date: 2026-02-13
-- =====================================================

-- Purpose: Allow users to save frequently-used filters
-- Reduces repetitive work when filtering marketplace, leads, campaigns

-- =====================================================
-- 1. CREATE SAVED FILTERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Filter metadata
  name TEXT NOT NULL, -- User-friendly name (e.g., "California Tech Companies")
  filter_type TEXT NOT NULL, -- 'marketplace', 'leads', 'campaigns', etc.

  -- Filter configuration (JSONB for flexibility)
  filters JSONB NOT NULL, -- Actual filter values

  -- Settings
  is_default BOOLEAN DEFAULT false, -- Auto-apply on page load
  is_shared BOOLEAN DEFAULT false, -- Share with workspace teammates

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

-- Primary lookup: User's saved filters by type
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_type
  ON saved_filters(user_id, filter_type, created_at DESC);

-- Workspace-wide shared filters
CREATE INDEX IF NOT EXISTS idx_saved_filters_workspace_shared
  ON saved_filters(workspace_id, filter_type, is_shared)
  WHERE is_shared = true;

-- Find default filters
CREATE INDEX IF NOT EXISTS idx_saved_filters_default
  ON saved_filters(user_id, filter_type, is_default)
  WHERE is_default = true;

-- =====================================================
-- 3. ADD CONSTRAINTS
-- =====================================================

-- Ensure filter_type is valid
ALTER TABLE saved_filters
  ADD CONSTRAINT valid_filter_type
  CHECK (filter_type IN ('marketplace', 'leads', 'campaigns', 'partners', 'audit_logs', 'earnings'));

-- Name must be non-empty
ALTER TABLE saved_filters
  ADD CONSTRAINT non_empty_name
  CHECK (LENGTH(TRIM(name)) > 0 AND LENGTH(name) <= 100);

-- Only one default filter per user per type
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_filters_one_default_per_user_type
  ON saved_filters(user_id, filter_type)
  WHERE is_default = true;

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

-- Users can manage their own saved filters
GRANT SELECT, INSERT, UPDATE, DELETE ON saved_filters TO authenticated;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

-- Users can view their own filters
CREATE POLICY "Users can view own saved filters" ON saved_filters
  FOR SELECT USING (
    user_id = (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Users can view workspace shared filters
CREATE POLICY "Users can view shared workspace filters" ON saved_filters
  FOR SELECT USING (
    is_shared = true
    AND workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Users can create their own filters
CREATE POLICY "Users can create own saved filters" ON saved_filters
  FOR INSERT WITH CHECK (
    user_id = (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
    AND workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Users can update their own filters
CREATE POLICY "Users can update own saved filters" ON saved_filters
  FOR UPDATE USING (
    user_id = (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Users can delete their own filters
CREATE POLICY "Users can delete own saved filters" ON saved_filters
  FOR DELETE USING (
    user_id = (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- 6. CREATE HELPER FUNCTIONS
-- =====================================================

-- Get default filter for user
CREATE OR REPLACE FUNCTION get_default_filter(
  p_user_id UUID,
  p_filter_type TEXT
)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'id', id,
      'name', name,
      'filters', filters,
      'created_at', created_at
    )
    FROM saved_filters
    WHERE user_id = p_user_id
      AND filter_type = p_filter_type
      AND is_default = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_default_filter(UUID, TEXT) TO authenticated;

-- Set filter as default (unsets previous default)
CREATE OR REPLACE FUNCTION set_default_filter(p_filter_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_filter_type TEXT;
  v_result JSON;
BEGIN
  -- Get filter details
  SELECT user_id, filter_type INTO v_user_id, v_filter_type
  FROM saved_filters
  WHERE id = p_filter_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Filter not found';
  END IF;

  -- Unset previous default for this user/type
  UPDATE saved_filters
  SET is_default = false
  WHERE user_id = v_user_id
    AND filter_type = v_filter_type
    AND is_default = true;

  -- Set new default
  UPDATE saved_filters
  SET is_default = true, updated_at = NOW()
  WHERE id = p_filter_id
  RETURNING json_build_object(
    'id', id,
    'name', name,
    'is_default', is_default
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION set_default_filter(UUID) TO authenticated;

-- =====================================================
-- 7. CREATE UPDATED_AT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_saved_filters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER saved_filters_updated_at
  BEFORE UPDATE ON saved_filters
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_filters_updated_at();

-- =====================================================
-- EXAMPLE FILTER STRUCTURES (commented out)
-- =====================================================

-- Marketplace filters:
-- {
--   "industries": ["Technology", "Healthcare"],
--   "states": ["CA", "NY"],
--   "min_price": 10,
--   "max_price": 100,
--   "freshness_min": 80
-- }

-- Leads filters:
-- {
--   "status": ["new", "contacted"],
--   "source": ["marketplace", "import"],
--   "company_sizes": ["1-10", "11-50"],
--   "search": "software engineer"
-- }

-- Campaign filters:
-- {
--   "status": ["active", "paused"],
--   "date_from": "2026-01-01",
--   "date_to": "2026-01-31"
-- }
