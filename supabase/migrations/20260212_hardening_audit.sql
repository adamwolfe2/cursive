-- ============================================================================
-- Migration: Database Hardening Audit
-- Date: 2026-02-12
-- Description: Comprehensive security, integrity, and performance hardening
--              applied via Supabase MCP during audit session.
--              All statements are idempotent (safe to re-run).
-- ============================================================================

-- ============================================================================
-- 1. REALTIME: Enable tables for Supabase Realtime
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE user_lead_assignments;

-- Filtered subscriptions require REPLICA IDENTITY FULL
ALTER TABLE leads REPLICA IDENTITY FULL;
ALTER TABLE user_lead_assignments REPLICA IDENTITY FULL;

-- ============================================================================
-- 2. RLS: Enable on previously unprotected tables
-- ============================================================================
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vto_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. SECURITY: Revoke anon EXECUTE on all public functions
--    (Only authenticated and service_role should call RPCs)
-- ============================================================================
DO $$
DECLARE
  func record;
BEGIN
  FOR func IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND NOT p.proisagg
      AND p.proname NOT LIKE 'pg_%'
      -- Exclude extension functions
      AND p.proname NOT IN (
        'similarity', 'similarity_op', 'similarity_dist',
        'word_similarity', 'word_similarity_op', 'word_similarity_dist_op',
        'word_similarity_commutator_op', 'word_similarity_dist_commutator_op',
        'strict_word_similarity', 'strict_word_similarity_op', 'strict_word_similarity_dist_op',
        'strict_word_similarity_commutator_op', 'strict_word_similarity_dist_commutator_op',
        'set_limit', 'show_limit', 'show_trgm',
        'gin_extract_query_trgm', 'gin_extract_value_trgm', 'gin_trgm_consistent', 'gin_trgm_triconsistent',
        'gtrgm_compress', 'gtrgm_consistent', 'gtrgm_decompress', 'gtrgm_distance',
        'gtrgm_in', 'gtrgm_options', 'gtrgm_out', 'gtrgm_penalty', 'gtrgm_picksplit',
        'gtrgm_same', 'gtrgm_union'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon', func.proname, func.args);
  END LOOP;
END $$;

-- Restrict internal/batch functions to service_role only
DO $$
DECLARE
  func_name text;
BEGIN
  FOREACH func_name IN ARRAY ARRAY[
    'cleanup_old_failed_jobs', 'cleanup_old_audit_logs', 'cleanup_enrichment_cache',
    'cleanup_expired_exports', 'get_active_queries_for_processing',
    'get_leads_pending_enrichment', 'get_leads_pending_delivery',
    'get_leads_ready_for_upload', 'process_pending_commissions',
    'reset_daily_credits', 'reset_weekly_lead_counts',
    'reset_user_daily_caps', 'reset_user_weekly_caps', 'reset_user_monthly_caps',
    'update_all_freshness_scores', 'update_topic_trends',
    'get_jobs_for_retry', 'mark_retry_success', 'mark_retry_failed',
    'log_admin_action', 'log_failed_job', 'log_security_event',
    'create_audit_log', 'get_platform_upload_stats',
    'merge_duplicate_leads', 'mark_leads_sold_bulk',
    'route_lead_to_workspace', 'find_matching_users_for_lead'
  ]
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I FROM authenticated', func_name);
  END LOOP;
END $$;

-- ============================================================================
-- 4. SECURITY: Set search_path on all custom functions
-- ============================================================================
DO $$
DECLARE
  func record;
BEGIN
  FOR func IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%'
      )
      AND p.proname NOT IN (
        'similarity', 'similarity_op', 'similarity_dist',
        'word_similarity', 'word_similarity_op', 'word_similarity_dist_op',
        'word_similarity_commutator_op', 'word_similarity_dist_commutator_op',
        'strict_word_similarity', 'strict_word_similarity_op', 'strict_word_similarity_dist_op',
        'strict_word_similarity_commutator_op', 'strict_word_similarity_dist_commutator_op',
        'set_limit', 'show_limit', 'show_trgm',
        'gin_extract_query_trgm', 'gin_extract_value_trgm', 'gin_trgm_consistent', 'gin_trgm_triconsistent',
        'gtrgm_compress', 'gtrgm_consistent', 'gtrgm_decompress', 'gtrgm_distance',
        'gtrgm_in', 'gtrgm_options', 'gtrgm_out', 'gtrgm_penalty', 'gtrgm_picksplit',
        'gtrgm_same', 'gtrgm_union'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public', func.proname, func.args);
  END LOOP;
END $$;

-- ============================================================================
-- 5. SECURITY: Set views to SECURITY INVOKER
-- ============================================================================
ALTER VIEW active_leads SET (security_invoker = true);
ALTER VIEW active_subscriptions SET (security_invoker = true);
ALTER VIEW companies_with_stats SET (security_invoker = true);
ALTER VIEW contacts_with_company SET (security_invoker = true);
ALTER VIEW deals_with_associations SET (security_invoker = true);
ALTER VIEW lead_intent_breakdown SET (security_invoker = true);
ALTER VIEW recent_billing_events SET (security_invoker = true);

-- ============================================================================
-- 6. SECURITY: Drop overly permissive policies
-- ============================================================================
DROP POLICY IF EXISTS "Allow anonymous inserts" ON waitlist_signups;

-- ============================================================================
-- 7. DATA INTEGRITY: NOT NULL on workspace_id (user-facing tables)
-- ============================================================================
ALTER TABLE ab_variant_assignments ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE notification_preferences ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE variant_stats ALTER COLUMN workspace_id SET NOT NULL;

-- CHECK constraint: non-system email_templates must have workspace_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_email_templates_workspace'
  ) THEN
    ALTER TABLE email_templates
    ADD CONSTRAINT chk_email_templates_workspace
    CHECK (workspace_id IS NOT NULL OR is_system = true);
  END IF;
END $$;

-- ============================================================================
-- 8. DATA INTEGRITY: NOT NULL on created_at columns with defaults
-- ============================================================================
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
    WHERE c.table_schema = 'public'
      AND c.column_name = 'created_at'
      AND c.is_nullable = 'YES'
      AND c.column_default IS NOT NULL
      AND t.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN created_at SET NOT NULL', tbl);
  END LOOP;
END $$;

-- ============================================================================
-- 9. DATA INTEGRITY: NOT NULL on status columns with defaults
-- ============================================================================
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
    WHERE c.table_schema = 'public'
      AND c.column_name LIKE '%status%'
      AND c.is_nullable = 'YES'
      AND c.column_default IS NOT NULL
      AND t.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I SET NOT NULL', rec.table_name, rec.column_name);
  END LOOP;
END $$;

-- ============================================================================
-- 10. IDEMPOTENCY: Create api_idempotency_keys table
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  response_status integer,
  response_body jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(idempotency_key, workspace_id, endpoint)
);

ALTER TABLE api_idempotency_keys ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created ON api_idempotency_keys (created_at);
CREATE INDEX IF NOT EXISTS idx_api_idempotency_keys_workspace ON api_idempotency_keys (workspace_id);

-- ============================================================================
-- 11. IDEMPOTENCY: Partial unique indexes on Stripe IDs
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_purchases_stripe_session
  ON credit_purchases (stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_purchases_stripe_pi
  ON credit_purchases (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_purchases_stripe_pi
  ON marketplace_purchases (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_purchases_stripe_session
  ON marketplace_purchases (stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_partners_stripe_account
  ON partners (stripe_account_id) WHERE stripe_account_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_payouts_stripe_transfer
  ON partner_payouts (stripe_transfer_id) WHERE stripe_transfer_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payouts_stripe_transfer
  ON payouts (stripe_transfer_id) WHERE stripe_transfer_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub
  ON subscriptions (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_stripe_customer
  ON workspaces (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_campaigns_stripe_pi
  ON ad_campaigns (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- ============================================================================
-- 12. PERFORMANCE: Foreign key indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_lead ON email_sequence_enrollments (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tags_tag ON lead_tags (tag_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_workspace ON notification_preferences (workspace_id);
CREATE INDEX IF NOT EXISTS idx_service_subscriptions_tier ON service_subscriptions (service_tier_id);
CREATE INDEX IF NOT EXISTS idx_variant_stats_experiment ON variant_stats (experiment_id);

-- ============================================================================
-- 13. PERFORMANCE: Drop duplicate indexes
-- ============================================================================
DROP INDEX IF EXISTS idx_campaign_leads_replied;
DROP INDEX IF EXISTS idx_credit_purchases_stripe_session;
DROP INDEX IF EXISTS idx_credit_purchases_stripe_pi;
DROP INDEX IF EXISTS idx_workspace_credits_workspace;

-- ============================================================================
-- 14. PERFORMANCE: Time-series indexes for dashboard queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_leads_created_at_desc ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_lead_assignments_created_at_desc ON user_lead_assignments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_created_at_desc ON credit_purchases (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at_desc ON security_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at_desc ON notifications (created_at DESC);

-- ============================================================================
-- 15. PERFORMANCE: Composite indexes for My Leads hot paths
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_ula_user_workspace_status
  ON user_lead_assignments (user_id, workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_ula_user_workspace_created
  ON user_lead_assignments (user_id, workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_workspace_enrichment_delivery
  ON leads (workspace_id, enrichment_status, delivery_status);

-- ============================================================================
-- 16. SECURITY: Wrap auth.uid() with (SELECT auth.uid()) for plan stability
--     PostgreSQL evaluates bare auth.uid() per-row; wrapping in SELECT makes
--     it an InitPlan evaluated once per statement.
-- ============================================================================
DO $$
DECLARE
  pol record;
  new_qual text;
  new_with_check text;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    new_qual := NULL;
    new_with_check := NULL;

    IF pol.qual IS NOT NULL
       AND pol.qual LIKE '%auth.uid()%'
       AND pol.qual NOT LIKE '%SELECT auth.uid()%' THEN
      new_qual := replace(pol.qual, 'auth.uid()', '(SELECT auth.uid())');
    END IF;

    IF pol.with_check IS NOT NULL
       AND pol.with_check LIKE '%auth.uid()%'
       AND pol.with_check NOT LIKE '%SELECT auth.uid()%' THEN
      new_with_check := replace(pol.with_check, 'auth.uid()', '(SELECT auth.uid())');
    END IF;

    IF new_qual IS NOT NULL AND new_with_check IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s) WITH CHECK (%s)',
        pol.policyname, pol.schemaname, pol.tablename, new_qual, new_with_check);
    ELSIF new_qual IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s)',
        pol.policyname, pol.schemaname, pol.tablename, new_qual);
    ELSIF new_with_check IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I WITH CHECK (%s)',
        pol.policyname, pol.schemaname, pol.tablename, new_with_check);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 17. SECURITY: Revoke PUBLIC EXECUTE on all custom functions
--     Supabase default privileges grant EXECUTE to PUBLIC on new functions.
--     anon inherits from PUBLIC, so revoking from anon alone is insufficient.
--     authenticated + service_role retain access via their direct grants.
-- ============================================================================
DO $$
DECLARE
  func record;
BEGIN
  FOR func IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.proacl::text LIKE '%=X/%'
      AND p.proname NOT IN (
        'similarity', 'similarity_op', 'similarity_dist',
        'word_similarity', 'word_similarity_op', 'word_similarity_dist_op',
        'word_similarity_commutator_op', 'word_similarity_dist_commutator_op',
        'strict_word_similarity', 'strict_word_similarity_op', 'strict_word_similarity_dist_op',
        'strict_word_similarity_commutator_op', 'strict_word_similarity_dist_commutator_op',
        'set_limit', 'show_limit', 'show_trgm',
        'gin_extract_query_trgm', 'gin_extract_value_trgm', 'gin_trgm_consistent', 'gin_trgm_triconsistent',
        'gtrgm_compress', 'gtrgm_consistent', 'gtrgm_decompress', 'gtrgm_distance',
        'gtrgm_in', 'gtrgm_options', 'gtrgm_out', 'gtrgm_penalty', 'gtrgm_picksplit',
        'gtrgm_same', 'gtrgm_union'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC', func.proname, func.args);
  END LOOP;
END $$;

-- ============================================================================
-- 18. PERFORMANCE: User-ID indexes for RLS predicate support
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_notification_digest_queue_user_id ON notification_digest_queue (user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events (user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_api_keys_user_id ON workspace_api_keys (user_id);
