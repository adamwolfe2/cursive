-- =====================================================
-- ROLLBACK: Phase 5 - Saved Filter Presets
-- Reverses: 20260213_saved_filters.sql
-- Date: 2026-02-13
-- =====================================================

-- =====================================================
-- 1. DROP HELPER FUNCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS set_default_filter(UUID);
DROP FUNCTION IF EXISTS get_default_filter(UUID, TEXT);

-- =====================================================
-- 2. DROP TRIGGER
-- =====================================================

DROP TRIGGER IF EXISTS saved_filters_updated_at ON saved_filters;
DROP FUNCTION IF EXISTS update_saved_filters_updated_at();

-- =====================================================
-- 3. DROP INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_saved_filters_one_default_per_user_type;
DROP INDEX IF EXISTS idx_saved_filters_default;
DROP INDEX IF EXISTS idx_saved_filters_workspace_shared;
DROP INDEX IF EXISTS idx_saved_filters_user_type;

-- =====================================================
-- 4. DROP TABLE
-- =====================================================

DROP TABLE IF EXISTS saved_filters CASCADE;

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================

-- NOTE: This removes saved filter functionality.
-- After rollback:
-- - Users will lose all saved filter presets
-- - Filter preferences will need to be re-entered manually
-- - Workspace filter sharing will not be available
-- - Default filter settings will be lost
