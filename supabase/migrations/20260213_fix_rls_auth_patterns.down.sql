-- =====================================================
-- ROLLBACK: Phase 1 - Fix RLS Email-Based Auth Anti-Pattern
-- Reverses: 20260213_fix_rls_auth_patterns.sql
-- Date: 2026-02-13
-- =====================================================

-- =====================================================
-- 1. DROP INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_platform_admins_email;
DROP INDEX IF EXISTS idx_auth_users_email;

-- =====================================================
-- 2. REVERT AUDIT_LOGS RLS POLICY
-- =====================================================

DROP POLICY IF EXISTS "Platform admins can view all audit logs" ON audit_logs;

-- Restore previous policy (if it existed)
-- Note: Adjust this based on your previous policy structure
CREATE POLICY "Platform admins can view all audit logs" ON audit_logs
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id
      FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. REVERT PLATFORM_ALERTS RLS POLICY
-- =====================================================

DROP POLICY IF EXISTS "Platform admins can view alerts" ON platform_alerts;

-- Restore previous email-based policy
CREATE POLICY "Platform admins can view alerts" ON platform_alerts
  FOR SELECT USING (
    auth.email() IN (SELECT email FROM platform_admins)
  );

-- =====================================================
-- 4. REVERT PLATFORM_METRICS RLS POLICY
-- =====================================================

DROP POLICY IF EXISTS "Platform admins can view metrics" ON platform_metrics;

-- Restore previous email-based policy
CREATE POLICY "Platform admins can view metrics" ON platform_metrics
  FOR SELECT USING (
    auth.email() IN (SELECT email FROM platform_admins)
  );

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================

-- NOTE: This rollback restores the email-based auth pattern.
-- Only use if you need to revert to the pre-Phase-1 RLS structure.
-- The email-based pattern is less secure and not recommended for production.
