-- =====================================================
-- Phase 1: Critical Security & Data Integrity
-- Migration: Fix RLS Email-Based Auth Anti-Pattern
-- Date: 2026-02-13
-- =====================================================

-- Problem: Current RLS policies compare auth.email() directly to platform_admins.email
-- This is fragile because:
-- 1. JWT claims can be manipulated or stale
-- 2. Email changes break access
-- 3. Doesn't use proper user ID relationships

-- Solution: Join through auth.users table to match auth.uid() to email

-- =====================================================
-- 1. FIX PLATFORM_METRICS RLS POLICIES
-- =====================================================

-- Drop old policy that uses auth.email() directly
DROP POLICY IF EXISTS "Platform admins can view metrics" ON platform_metrics;

-- Create new policy that joins through auth.users
CREATE POLICY "Platform admins can view metrics" ON platform_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM platform_admins pa
      JOIN auth.users au ON au.email = pa.email
      WHERE au.id = auth.uid()
    )
  );

-- =====================================================
-- 2. FIX PLATFORM_ALERTS RLS POLICIES
-- =====================================================

-- Drop old policy that uses auth.email() directly
DROP POLICY IF EXISTS "Platform admins can view alerts" ON platform_alerts;

-- Create new policy that joins through auth.users
CREATE POLICY "Platform admins can view alerts" ON platform_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM platform_admins pa
      JOIN auth.users au ON au.email = pa.email
      WHERE au.id = auth.uid()
    )
  );

-- =====================================================
-- 3. FIX AUDIT_LOGS RLS POLICIES (if needed)
-- =====================================================

-- Check if audit_logs has similar issues
DROP POLICY IF EXISTS "Platform admins can view all audit logs" ON audit_logs;

CREATE POLICY "Platform admins can view all audit logs" ON audit_logs
  FOR SELECT USING (
    -- Users can see their own workspace's audit logs
    workspace_id IN (
      SELECT workspace_id
      FROM users
      WHERE auth_user_id = auth.uid()
    )
    OR
    -- Platform admins can see all audit logs
    EXISTS (
      SELECT 1
      FROM platform_admins pa
      JOIN auth.users au ON au.email = pa.email
      WHERE au.id = auth.uid()
    )
  );

-- =====================================================
-- 4. ADD INDEXES TO SUPPORT NEW RLS POLICIES
-- =====================================================

-- Index for auth.users email lookups (should already exist, but ensure it)
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email);

-- Index for platform_admins email lookups
CREATE INDEX IF NOT EXISTS idx_platform_admins_email ON platform_admins(email);

-- =====================================================
-- VERIFICATION QUERIES (commented out)
-- =====================================================

-- Test that platform admin can access metrics:
-- SET ROLE authenticated;
-- SET request.jwt.claims.sub TO '[admin-user-id]';
-- SELECT COUNT(*) FROM platform_metrics;

-- Verify RLS policies are in place:
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('platform_metrics', 'platform_alerts', 'audit_logs')
-- ORDER BY tablename, policyname;
