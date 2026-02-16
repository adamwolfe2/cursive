-- Migration: Fix Critical RLS Security Gaps
-- Date: 2026-02-15
-- Addresses critical security gaps identified in comprehensive RLS audit
-- All statements are idempotent (safe to re-run)

-- ============================================================================
-- PRIORITY 1: CRITICAL - Multi-tenant tables with workspace_id but NO RLS
-- ============================================================================

-- workspace_priority_industries: Per-workspace priority industries for lead scoring
-- CRITICAL: Has workspace_id but NO RLS - allows cross-workspace data leakage
ALTER TABLE IF EXISTS workspace_priority_industries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'workspace_priority_industries'
    AND policyname = 'Workspace isolation for priority industries'
  ) THEN
    CREATE POLICY "Workspace isolation for priority industries"
    ON workspace_priority_industries
    FOR ALL
    USING (
      workspace_id IN (
        SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- lead_scoring_rules: System scoring configuration
-- Check if workspace_id exists and add appropriate policy
DO $$
DECLARE
  has_workspace_col BOOLEAN;
BEGIN
  -- Check if workspace_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_scoring_rules' AND column_name = 'workspace_id'
  ) INTO has_workspace_col;

  -- Enable RLS if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_scoring_rules') THEN
    ALTER TABLE lead_scoring_rules ENABLE ROW LEVEL SECURITY;

    -- Add workspace isolation policy if workspace_id exists
    IF has_workspace_col THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'lead_scoring_rules'
        AND policyname = 'Workspace isolation for scoring rules'
      ) THEN
        CREATE POLICY "Workspace isolation for scoring rules"
        ON lead_scoring_rules
        FOR ALL
        USING (
          workspace_id IN (
            SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
          )
        );
      END IF;
    ELSE
      -- System-wide scoring rules (no workspace_id) - service role only
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'lead_scoring_rules'
        AND policyname = 'Service role full access'
      ) THEN
        CREATE POLICY "Service role full access"
        ON lead_scoring_rules
        FOR ALL
        USING (auth.role() = 'service_role');
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- PRIORITY 2: Reference tables missing RLS (should be read-only for users)
-- ============================================================================

-- industries: Reference data for lead categorization
ALTER TABLE IF EXISTS industries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'industries'
    AND policyname = 'Authenticated read access'
  ) THEN
    CREATE POLICY "Authenticated read access"
    ON industries
    FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'industries'
    AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
    ON industries
    FOR ALL
    USING (auth.role() = 'service_role');
  END IF;
END $$;

-- industry_lead_fields: Reference data for industry-specific fields
ALTER TABLE IF EXISTS industry_lead_fields ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'industry_lead_fields'
    AND policyname = 'Authenticated read access'
  ) THEN
    CREATE POLICY "Authenticated read access"
    ON industry_lead_fields
    FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'industry_lead_fields'
    AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
    ON industry_lead_fields
    FOR ALL
    USING (auth.role() = 'service_role');
  END IF;
END $$;

-- subscription_plans: Reference data for billing plans
ALTER TABLE IF EXISTS subscription_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_plans'
    AND policyname = 'Authenticated read access'
  ) THEN
    CREATE POLICY "Authenticated read access"
    ON subscription_plans
    FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_plans'
    AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
    ON subscription_plans
    FOR ALL
    USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- PRIORITY 3: System tables missing RLS (service-role only)
-- ============================================================================

-- rate_limit_tracking: System rate limit state
ALTER TABLE IF EXISTS rate_limit_tracking ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rate_limit_tracking'
    AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
    ON rate_limit_tracking
    FOR ALL
    USING (auth.role() = 'service_role');
  END IF;
END $$;

-- api_request_logs: Internal request logging
ALTER TABLE IF EXISTS api_request_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'api_request_logs'
    AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
    ON api_request_logs
    FOR ALL
    USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

COMMENT ON TABLE workspace_priority_industries IS 'RLS ENABLED: 2026-02-15 - Workspace isolation added to prevent cross-workspace data leakage';
COMMENT ON TABLE industries IS 'RLS ENABLED: 2026-02-15 - Read-only for authenticated users, service-role can modify';
COMMENT ON TABLE industry_lead_fields IS 'RLS ENABLED: 2026-02-15 - Read-only for authenticated users, service-role can modify';
COMMENT ON TABLE subscription_plans IS 'RLS ENABLED: 2026-02-15 - Read-only for authenticated users, service-role can modify';
COMMENT ON TABLE rate_limit_tracking IS 'RLS ENABLED: 2026-02-15 - Service-role only access';
COMMENT ON TABLE api_request_logs IS 'RLS ENABLED: 2026-02-15 - Service-role only access';
