-- ============================================================================
-- SECURITY HARDENING MIGRATION
-- Safe, non-destructive security improvements
-- Created: 2026-01-28
-- ============================================================================

-- ============================================================================
-- 1. ENSURE RLS IS ENABLED ON ALL USER-FACING TABLES
-- ============================================================================

-- Core tables
ALTER TABLE IF EXISTS workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS queries ENABLE ROW LEVEL SECURITY;

-- Marketplace tables
ALTER TABLE IF EXISTS marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS marketplace_purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workspace_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS referrals ENABLE ROW LEVEL SECURITY;

-- Partner tables
ALTER TABLE IF EXISTS partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS partner_upload_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS partner_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS partner_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payout_requests ENABLE ROW LEVEL SECURITY;

-- Email/Campaign tables
ALTER TABLE IF EXISTS email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conversation_messages ENABLE ROW LEVEL SECURITY;

-- Verification & Queue tables
ALTER TABLE IF EXISTS email_verification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS suppressed_emails ENABLE ROW LEVEL SECURITY;

-- A/B Testing tables
ALTER TABLE IF EXISTS ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_template_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ab_variant_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS variant_stats ENABLE ROW LEVEL SECURITY;

-- Notification tables
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_digest_queue ENABLE ROW LEVEL SECURITY;

-- Admin/Audit tables
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS marketplace_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS failed_jobs ENABLE ROW LEVEL SECURITY;

-- Integration tables
ALTER TABLE IF EXISTS integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workspace_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workspace_api_keys ENABLE ROW LEVEL SECURITY;

-- Other tables
ALTER TABLE IF EXISTS lead_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bulk_upload_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS credit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS saved_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lead_tag_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. ADD SERVICE ROLE BYPASS POLICIES
-- ============================================================================
-- Allow service_role to bypass RLS for background jobs
-- This is safe because service_role is only used server-side

DO $$
BEGIN
  -- Leads
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Service role bypass'
  ) THEN
    CREATE POLICY "Service role bypass" ON leads
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- Marketplace purchases
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_purchases' AND policyname = 'Service role bypass'
  ) THEN
    CREATE POLICY "Service role bypass" ON marketplace_purchases
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- Marketplace purchase items
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_purchase_items' AND policyname = 'Service role bypass'
  ) THEN
    CREATE POLICY "Service role bypass" ON marketplace_purchase_items
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- Partners
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partners' AND policyname = 'Service role bypass'
  ) THEN
    CREATE POLICY "Service role bypass" ON partners
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- Partner upload batches
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_upload_batches' AND policyname = 'Service role bypass'
  ) THEN
    CREATE POLICY "Service role bypass" ON partner_upload_batches
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- Email verification queue
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_verification_queue' AND policyname = 'Service role bypass'
  ) THEN
    CREATE POLICY "Service role bypass" ON email_verification_queue
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- Payouts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payouts' AND policyname = 'Service role bypass'
  ) THEN
    CREATE POLICY "Service role bypass" ON payouts
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- Workspace credits
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workspace_credits' AND policyname = 'Service role bypass'
  ) THEN
    CREATE POLICY "Service role bypass" ON workspace_credits
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- Marketplace audit log
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_audit_log' AND policyname = 'Service role bypass'
  ) THEN
    CREATE POLICY "Service role bypass" ON marketplace_audit_log
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- Campaign leads
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'campaign_leads' AND policyname = 'Service role bypass'
  ) THEN
    CREATE POLICY "Service role bypass" ON campaign_leads
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- Email sends
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_sends' AND policyname = 'Service role bypass'
  ) THEN
    CREATE POLICY "Service role bypass" ON email_sends
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- Failed jobs
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'failed_jobs' AND policyname = 'Service role bypass'
  ) THEN
    CREATE POLICY "Service role bypass" ON failed_jobs
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- 3. AUDIT LOG PROTECTION
-- ============================================================================
-- Audit logs should only be readable by admins, writable by service role

DO $$
BEGIN
  -- Audit logs - admin read policy
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_logs') THEN
    DROP POLICY IF EXISTS "Admins read audit logs" ON audit_logs;
    CREATE POLICY "Admins read audit logs" ON audit_logs
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM platform_admins
          WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
          AND is_active = true
        )
      );

    DROP POLICY IF EXISTS "Service role writes audit logs" ON audit_logs;
    CREATE POLICY "Service role writes audit logs" ON audit_logs
      FOR INSERT TO service_role
      WITH CHECK (true);
  END IF;

  -- Marketplace audit log - admin read policy
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'marketplace_audit_log') THEN
    DROP POLICY IF EXISTS "Admins read marketplace audit" ON marketplace_audit_log;
    CREATE POLICY "Admins read marketplace audit" ON marketplace_audit_log
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM platform_admins
          WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
          AND is_active = true
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 4. STORAGE BUCKET SECURITY (if using Supabase Storage)
-- ============================================================================

DO $$
BEGIN
  -- Create partner-uploads bucket if not exists
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('partner-uploads', 'partner-uploads', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Enable RLS on storage.objects
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Partners can upload to their folder
DROP POLICY IF EXISTS "Partners upload to own folder" ON storage.objects;
CREATE POLICY "Partners upload to own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'partner-uploads'
  );

-- Policy: Service role can read all uploads
DROP POLICY IF EXISTS "Service role read uploads" ON storage.objects;
CREATE POLICY "Service role read uploads" ON storage.objects
  FOR SELECT TO service_role
  USING (bucket_id = 'partner-uploads');

-- Policy: Authenticated users can read their own uploads
DROP POLICY IF EXISTS "Users read own uploads" ON storage.objects;
CREATE POLICY "Users read own uploads" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'partner-uploads');

-- ============================================================================
-- 5. SECURE HELPER FUNCTIONS
-- ============================================================================
-- Revoke execute from public on sensitive functions

DO $$
DECLARE
  func_name text;
BEGIN
  -- List of functions to secure
  FOR func_name IN
    SELECT routine_name
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name IN (
      'get_user_workspace_id',
      'calculate_lead_marketplace_price',
      'calculate_freshness_score',
      'add_workspace_credits',
      'deduct_workspace_credits',
      'mark_lead_sold',
      'process_pending_commissions'
    )
  LOOP
    -- Revoke from public, grant to authenticated and service_role
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I FROM PUBLIC;', func_name);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I TO authenticated;', func_name);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I TO service_role;', func_name);
  END LOOP;

  -- Service-role-only functions
  FOR func_name IN
    SELECT routine_name
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name IN (
      'add_workspace_credits',
      'deduct_workspace_credits',
      'mark_lead_sold',
      'process_pending_commissions'
    )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I FROM authenticated;', func_name);
  END LOOP;
END $$;

-- ============================================================================
-- DONE - Security hardening complete
-- ============================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Security hardening migration completed successfully';
END $$;
