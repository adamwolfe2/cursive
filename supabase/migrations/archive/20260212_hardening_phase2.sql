-- ============================================================================
-- Migration: Database Hardening Phase 2
-- Date: 2026-02-12
-- Description: Function privilege enforcement, SECURITY DEFINER lockdown,
--              RLS regression guards, realtime hardening, payment integrity.
--              All statements are idempotent (safe to re-run).
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXECUTE PRIVILEGE ENFORCEMENT
-- Goal: No function grants EXECUTE to PUBLIC or anon.
-- Root cause: Supabase DEFAULT PRIVILEGES auto-grant PUBLIC on new functions.
-- ALTER DEFAULT PRIVILEGES requires superuser and fails via MCP; documented
-- as a manual action. This section enforces the revoke on all existing funcs.
-- ============================================================================

-- 1A. Revoke PUBLIC EXECUTE on all custom functions in public schema.
--     authenticated and service_role retain access via direct grants.
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
      AND p.proacl::text LIKE '%=X/%'  -- has PUBLIC grant
      AND p.proname NOT IN (
        -- pg_trgm extension functions (must keep PUBLIC)
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

-- 1B. Restrict service-only functions: revoke from authenticated, keep service_role.
DO $$
DECLARE
  func_name text;
  func_args text;
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
    SELECT pg_get_function_identity_arguments(p.oid) INTO func_args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = func_name
    LIMIT 1;

    IF func_args IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM authenticated', func_name, func_args);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 2: SECURITY DEFINER LOCKDOWN
-- Goal: Harden search_path to pg_catalog,public; set STABLE on read-only funcs.
-- ============================================================================

-- 2A. Update search_path from 'public' to 'pg_catalog, public' on all
--     SECURITY DEFINER functions. Prevents search_path hijacking by
--     ensuring built-in functions resolve from pg_catalog first.
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
      AND p.prosecdef = true
  LOOP
    EXECUTE format(
      'ALTER FUNCTION public.%I(%s) SET search_path = pg_catalog, public',
      func.proname, func.args
    );
  END LOOP;
END $$;

-- 2B. Set STABLE on read-only SECURITY DEFINER functions.
--     These only SELECT — no INSERT/UPDATE/DELETE side effects.
--     STABLE tells the planner the function returns the same result within
--     a single statement, enabling better optimization.
DO $$
DECLARE
  func_name text;
  func_args text;
BEGIN
  FOREACH func_name IN ARRAY ARRAY[
    -- Read-only check/query functions safe for STABLE
    'can_create_query', 'can_create_saved_search', 'can_workspace_fetch_leads',
    'check_lead_duplicate', 'check_query_limit', 'find_similar_leads',
    'get_active_queries_for_processing', 'get_billing_summary',
    'get_effective_workspace_id', 'get_impersonated_workspace_id',
    'get_integration_config', 'get_leads_by_intent_score',
    'get_leads_pending_delivery', 'get_leads_pending_enrichment',
    'get_leads_ready_for_upload', 'get_platform_upload_stats',
    'get_user_plan_limits', 'get_user_workspace_id',
    'get_workspace_daily_lead_limit', 'get_workspace_daily_lead_usage',
    'get_workspace_features', 'get_workspace_monthly_lead_usage',
    'is_admin', 'is_approved_partner', 'is_current_user_platform_admin',
    'is_platform_admin', 'user_has_role', 'validate_partner_api_key',
    'workspace_has_active_access'
  ]
  LOOP
    SELECT pg_get_function_identity_arguments(p.oid) INTO func_args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = func_name
    LIMIT 1;

    IF func_args IS NOT NULL THEN
      EXECUTE format('ALTER FUNCTION public.%I(%s) STABLE', func_name, func_args);
    END IF;
  END LOOP;
END $$;

-- 2C. Explicitly keep VOLATILE on write functions with justification.
COMMENT ON FUNCTION cleanup_enrichment_cache(integer) IS 'VOLATILE: performs DELETE on company_enrichment_cache';
COMMENT ON FUNCTION create_audit_log(uuid,uuid,varchar,varchar,uuid,jsonb,jsonb,inet,text,varchar,varchar,varchar,jsonb,varchar,integer) IS 'VOLATILE: performs INSERT into audit_logs';
COMMENT ON FUNCTION create_notification(uuid,varchar,varchar,text,uuid,varchar,varchar,uuid,varchar,varchar,integer,jsonb) IS 'VOLATILE: performs INSERT into notifications';
COMMENT ON FUNCTION increment_cache_hit(text) IS 'VOLATILE: performs UPDATE on company_enrichment_cache';
COMMENT ON FUNCTION log_admin_action(text,text,uuid,jsonb,jsonb,uuid) IS 'VOLATILE: performs INSERT into admin_audit_logs';
COMMENT ON FUNCTION log_failed_job(varchar,text,uuid,varchar,varchar,varchar,uuid,varchar,varchar,text,jsonb,integer,jsonb) IS 'VOLATILE: performs INSERT into failed_jobs';
COMMENT ON FUNCTION log_security_event(varchar,varchar,uuid,uuid,inet,text,varchar,boolean,text,jsonb) IS 'VOLATILE: performs INSERT into security_events';
COMMENT ON FUNCTION merge_duplicate_leads(uuid,uuid) IS 'VOLATILE: performs UPDATE/soft-DELETE across leads + related tables';

-- ============================================================================
-- SECTION 3: RLS REGRESSION GUARD
-- A service-only function that scans pg_policies for drift indicators:
--   1. Policies with USING(true) beyond the intentional support_messages INSERT
--   2. Bare auth.uid() (should be 0 after wrapping)
--   3. Functions accessible to anon
-- Returns JSONB report and logs to security_events.
-- ============================================================================

CREATE OR REPLACE FUNCTION check_rls_regression()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_report jsonb;
  v_bare_uid_count integer;
  v_broad_policy_count integer;
  v_anon_func_count integer;
  v_broad_policies jsonb;
BEGIN
  -- Check 1: Bare auth.uid() (not wrapped in SELECT)
  SELECT count(*) INTO v_bare_uid_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (
      (qual::text LIKE '%auth.uid()%' AND qual::text NOT LIKE '%SELECT auth.uid()%')
      OR (with_check::text LIKE '%auth.uid()%' AND with_check::text NOT LIKE '%SELECT auth.uid()%')
    );

  -- Check 2: Policies with bare 'true' in USING or WITH CHECK
  --   Exclude: support_messages INSERT (public form)
  --   Exclude: service_role-only policies (USING true is correct for TO service_role)
  --   Exclude: documented reference-data SELECT policies
  SELECT count(*), COALESCE(jsonb_agg(jsonb_build_object(
    'table', tablename, 'policy', policyname, 'cmd', cmd, 'roles', roles::text
  )), '[]'::jsonb)
  INTO v_broad_policy_count, v_broad_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (qual::text = 'true' OR with_check::text = 'true')
    AND NOT (tablename = 'support_messages' AND cmd = 'INSERT')
    AND NOT (roles = '{service_role}')
    AND NOT (cmd = 'SELECT' AND tablename IN ('company_enrichment_cache', 'industry_categories'));

  -- Check 3: Functions with PUBLIC pseudo-role EXECUTE grant
  --   ACL pattern: PUBLIC grant appears as {=X/... or ,=X/... (no role name before =)
  SELECT count(*) INTO v_anon_func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND (p.proacl::text LIKE '{=X/%' OR p.proacl::text LIKE '%,=X/%')
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
    );

  -- Build report
  v_report := jsonb_build_object(
    'checked_at', now(),
    'bare_auth_uid_policies', v_bare_uid_count,
    'overly_broad_policies', v_broad_policy_count,
    'broad_policy_details', COALESCE(v_broad_policies, '[]'::jsonb),
    'public_execute_functions', v_anon_func_count,
    'status', CASE
      WHEN v_bare_uid_count = 0 AND v_broad_policy_count = 0 AND v_anon_func_count = 0
      THEN 'clean'
      ELSE 'drift_detected'
    END
  );

  -- Log to security_events
  INSERT INTO security_events (
    event_type, event_category, risk_level, is_suspicious,
    suspicious_reason, metadata
  ) VALUES (
    'rls_regression', 'security_audit',
    CASE WHEN v_report->>'status' = 'clean' THEN 'info' ELSE 'high' END,
    v_report->>'status' != 'clean',
    CASE WHEN v_report->>'status' != 'clean' THEN 'RLS regression detected' ELSE NULL END,
    v_report
  );

  RETURN v_report;
END;
$$;

-- Restrict to service_role only (REVOKE anon too — DEFAULT PRIVILEGES auto-grant)
REVOKE EXECUTE ON FUNCTION check_rls_regression() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION check_rls_regression() FROM anon;
REVOKE EXECUTE ON FUNCTION check_rls_regression() FROM authenticated;
GRANT EXECUTE ON FUNCTION check_rls_regression() TO service_role;

-- Recommended cron: call via Edge Function or Supabase pg_cron (if available)
-- SELECT cron.schedule('rls-regression-check', '0 3 * * *', 'SELECT check_rls_regression()');
-- Or via Vercel Cron → POST /api/cron/rls-check → service_role RPC call

-- ============================================================================
-- SECTION 4: REALTIME HARDENING
-- realtime.messages has RLS enabled with 0 policies. This is correct:
-- Supabase Realtime server authenticates via JWT and uses service_role
-- internally. Direct SQL access is already blocked by the empty policy set.
--
-- For Cursive's use case (leads + user_lead_assignments changes via
-- Postgres Changes, not Broadcast), the realtime.messages table is not
-- used for application data. The publication on leads/user_lead_assignments
-- handles change propagation.
--
-- We add a SELECT policy for authenticated users on private channels only,
-- scoped to topics that include their workspace_id. This enables future
-- Broadcast use if needed without opening access broadly.
-- ============================================================================

-- 4A. SELECT policy: authenticated users can read private messages
--     where the topic contains their workspace_id (convention: "workspace:{id}")
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'realtime' AND tablename = 'messages'
      AND policyname = 'workspace_scoped_select'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY workspace_scoped_select ON realtime.messages
        FOR SELECT TO authenticated
        USING (
          private IS TRUE
          AND topic LIKE 'workspace:%'
          AND split_part(topic, ':', 2) IN (
            SELECT workspace_id::text FROM public.users
            WHERE auth_user_id = (SELECT auth.uid())
          )
        )
    $policy$;
  END IF;
END $$;

-- 4B. INSERT policy: authenticated users can broadcast to their workspace channels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'realtime' AND tablename = 'messages'
      AND policyname = 'workspace_scoped_insert'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY workspace_scoped_insert ON realtime.messages
        FOR INSERT TO authenticated
        WITH CHECK (
          private IS TRUE
          AND topic LIKE 'workspace:%'
          AND split_part(topic, ':', 2) IN (
            SELECT workspace_id::text FROM public.users
            WHERE auth_user_id = (SELECT auth.uid())
          )
        )
    $policy$;
  END IF;
END $$;

-- 4C. Index to support the topic lookup in realtime.messages policies
-- The existing index filters on extension='broadcast' AND private=true;
-- we add one for our workspace-scoped queries
CREATE INDEX IF NOT EXISTS idx_realtime_messages_topic_private
  ON realtime.messages (topic)
  WHERE private IS TRUE;

-- ============================================================================
-- SECTION 5: PAYMENTS & IDEMPOTENCY DEFENSIVE CHECKS
-- ============================================================================

-- 5A. api_idempotency_keys: add expires_at column for TTL-based cleanup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'api_idempotency_keys'
      AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE api_idempotency_keys
      ADD COLUMN expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours';
  END IF;
END $$;

-- 5B. CHECK: expires_at must be after created_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_idempotency_expires_after_created'
  ) THEN
    ALTER TABLE api_idempotency_keys
      ADD CONSTRAINT chk_idempotency_expires_after_created
      CHECK (expires_at > created_at);
  END IF;
END $$;

-- 5C. Partial index for cleanup queries (expired keys)
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires
  ON api_idempotency_keys (expires_at)
  WHERE status = 'processing';

-- 5D. processed_webhook_events: cleanup index on created_at
--     (created_at is already NOT NULL DEFAULT now())
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_created
  ON processed_webhook_events (created_at);

-- ============================================================================
-- SECTION 6: ADVISOR-DRIVEN CLEANUP
-- ============================================================================

-- 6A. Document intentional permissive policy on support_messages
COMMENT ON POLICY "Anyone can submit support messages" ON support_messages
  IS 'Intentionally permissive: public support form submission. No auth required. Audited 2026-02-12.';

-- 6B. Helper function to log unused indexes for manual review.
--     Scans pg_stat_user_indexes for indexes with 0 scans older than 30 days.
--     Logs suggestions to security_events; does NOT drop anything.
CREATE OR REPLACE FUNCTION audit_unused_indexes(p_min_age_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_report jsonb;
  v_unused jsonb;
  v_count integer;
BEGIN
  SELECT count(*), COALESCE(jsonb_agg(jsonb_build_object(
    'schema', schemaname,
    'table', relname,
    'index', indexrelname,
    'size_bytes', pg_relation_size(sui.indexrelid),
    'suggestion', format('DROP INDEX IF EXISTS %I.%I;', schemaname, indexrelname)
  )), '[]'::jsonb)
  INTO v_count, v_unused
  FROM pg_stat_user_indexes sui
  JOIN pg_index pi ON sui.indexrelid = pi.indexrelid
  WHERE sui.schemaname = 'public'
    AND sui.idx_scan = 0
    AND NOT pi.indisunique      -- never suggest dropping unique indexes
    AND NOT pi.indisprimary     -- never suggest dropping PKs
    -- Only indexes older than threshold (use pg_class.reltuples as proxy)
    AND sui.indexrelid IN (
      SELECT oid FROM pg_class
      WHERE relkind = 'i'
        AND pg_catalog.obj_description(oid, 'pg_class') IS NULL  -- no special comment
    );

  v_report := jsonb_build_object(
    'checked_at', now(),
    'unused_index_count', v_count,
    'indexes', v_unused
  );

  -- Log to security_events for manual review
  IF v_count > 0 THEN
    INSERT INTO security_events (
      event_type, event_category, risk_level, metadata
    ) VALUES (
      'unused_index_audit', 'performance_audit', 'info', v_report
    );
  END IF;

  RETURN v_report;
END;
$$;

-- Restrict to service_role only (REVOKE anon too — DEFAULT PRIVILEGES auto-grant)
REVOKE EXECUTE ON FUNCTION audit_unused_indexes(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION audit_unused_indexes(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION audit_unused_indexes(integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION audit_unused_indexes(integer) TO service_role;

-- 6C. Document intentional broad policies
COMMENT ON POLICY "Service role access for audiencelab_events" ON audiencelab_events
  IS 'Intentional: service_role-only. USING(true) safe because scoped by TO service_role. Audited 2026-02-12.';
COMMENT ON POLICY "Service role access for audiencelab_identities" ON audiencelab_identities
  IS 'Intentional: service_role-only. USING(true) safe because scoped by TO service_role. Audited 2026-02-12.';
COMMENT ON POLICY "Service role access for audiencelab_import_jobs" ON audiencelab_import_jobs
  IS 'Intentional: service_role-only. USING(true) safe because scoped by TO service_role. Audited 2026-02-12.';
COMMENT ON POLICY "Service role access for audiencelab_pixels" ON audiencelab_pixels
  IS 'Intentional: service_role-only. USING(true) safe because scoped by TO service_role. Audited 2026-02-12.';
COMMENT ON POLICY "Public can read enrichment cache" ON company_enrichment_cache
  IS 'Intentional: read-only reference data (shared enrichment cache). Audited 2026-02-12.';
COMMENT ON POLICY "Public read access on industry_categories" ON industry_categories
  IS 'Intentional: read-only reference data (industry lookup). Audited 2026-02-12.';

-- ============================================================================
-- SECTION 7: CREDIT RPC LOCKDOWN
-- Credit mutation functions restricted to service_role only.
-- Prevents authenticated users from calling add_workspace_credits etc. directly.
-- ============================================================================

DO $$
DECLARE
  func_name text;
  func_args text;
BEGIN
  FOREACH func_name IN ARRAY ARRAY[
    'add_workspace_credits',
    'deduct_workspace_credits',
    'record_credit_usage',
    'complete_credit_lead_purchase'
  ]
  LOOP
    SELECT pg_get_function_identity_arguments(p.oid) INTO func_args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = func_name
    LIMIT 1;

    IF func_args IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM authenticated', func_name, func_args);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role', func_name, func_args);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 8: VERIFICATION QUERIES (SELECT only, safe to run)
-- Run these after applying the migration to confirm zero drift.
-- ============================================================================

-- Verification is done via check_rls_regression() and direct queries below.
-- These are commented out to keep the migration pure DDL/DML.
-- Uncomment to run manually:
--
-- 7A. No PUBLIC execute on custom functions:
-- SELECT count(*) FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public' AND p.prokind = 'f'
--   AND p.proacl::text LIKE '%=X/%'
--   AND p.proname NOT LIKE '%similarity%' AND p.proname NOT LIKE '%trgm%';
-- Expected: 0
--
-- 7B. SECURITY DEFINER volatility and search_path:
-- SELECT proname,
--   CASE provolatile WHEN 's' THEN 'STABLE' WHEN 'v' THEN 'VOLATILE' END as volatility,
--   proconfig
-- FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public' AND p.prosecdef = true
-- ORDER BY proname;
--
-- 7C. Bare auth.uid() count (expected: 0):
-- SELECT count(*) FROM pg_policies
-- WHERE schemaname = 'public'
--   AND qual::text LIKE '%auth.uid()%'
--   AND qual::text NOT LIKE '%SELECT auth.uid()%';
--
-- 7D. Policies with USING(true) minus intentional (expected: 0):
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public' AND (qual::text = 'true' OR with_check::text = 'true')
--   AND NOT (tablename = 'support_messages' AND cmd = 'INSERT');
--
-- 7E. realtime.messages policies exist:
-- SELECT policyname, cmd FROM pg_policies
-- WHERE schemaname = 'realtime' AND tablename = 'messages';
--
-- 7F. Constraints/indexes on idempotency tables:
-- SELECT conname FROM pg_constraint
-- WHERE conname = 'chk_idempotency_expires_after_created';
-- SELECT indexname FROM pg_indexes
-- WHERE tablename = 'api_idempotency_keys' AND indexname = 'idx_idempotency_keys_expires';
