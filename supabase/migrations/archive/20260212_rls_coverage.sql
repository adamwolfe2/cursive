-- Migration: RLS Coverage for Previously Unprotected Tables
-- Date: 2026-02-12
-- Adds RLS to 8 tables identified during security audit.
-- All statements are idempotent (safe to re-run).

-- ============================================================================
-- 1. SYSTEM TABLES: Service-role only (no user access)
-- ============================================================================

-- api_request_logs: Internal request logging
ALTER TABLE IF EXISTS api_request_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_request_logs' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON api_request_logs FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- enrichment_providers: System configuration
ALTER TABLE IF EXISTS enrichment_providers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrichment_providers' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON enrichment_providers FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- lead_scoring_rules: System scoring configuration
ALTER TABLE IF EXISTS lead_scoring_rules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_scoring_rules' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON lead_scoring_rules FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- rate_limit_tracking: System rate limit state
ALTER TABLE IF EXISTS rate_limit_tracking ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rate_limit_tracking' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON rate_limit_tracking FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- 2. REFERENCE TABLES: Authenticated users can read, service role can write
-- ============================================================================

-- industries: Reference data for lead categorization
ALTER TABLE IF EXISTS industries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'industries' AND policyname = 'Authenticated read access') THEN
    CREATE POLICY "Authenticated read access" ON industries FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'industries' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON industries FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- industry_lead_fields: Reference data for industry-specific fields
ALTER TABLE IF EXISTS industry_lead_fields ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'industry_lead_fields' AND policyname = 'Authenticated read access') THEN
    CREATE POLICY "Authenticated read access" ON industry_lead_fields FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'industry_lead_fields' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON industry_lead_fields FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- subscription_plans: Reference data for billing plans
ALTER TABLE IF EXISTS subscription_plans ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_plans' AND policyname = 'Authenticated read access') THEN
    CREATE POLICY "Authenticated read access" ON subscription_plans FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_plans' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON subscription_plans FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- geographic_regions: Reference data for regional targeting
ALTER TABLE IF EXISTS geographic_regions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'geographic_regions' AND policyname = 'Authenticated read access') THEN
    CREATE POLICY "Authenticated read access" ON geographic_regions FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'geographic_regions' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON geographic_regions FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;
