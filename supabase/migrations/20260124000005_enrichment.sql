-- Cursive Platform - Lead Enrichment
-- Migration for enrichment data and tracking

-- ============================================================================
-- ADD ENRICHMENT FIELDS TO LEADS
-- ============================================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrichment_data JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrichment_source TEXT; -- clay, clearbit, apollo, etc.

-- LinkedIn data
ALTER TABLE leads ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS linkedin_headline TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS linkedin_connections INTEGER;

-- Company enrichment
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_revenue TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_founded INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_linkedin TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_website TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_description TEXT;

-- Contact enrichment
ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_seniority TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- ============================================================================
-- ENRICHMENT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS enrichment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- clay, clearbit, apollo, etc.
  request_data JSONB,
  response_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed, partial
  error_message TEXT,
  credits_used INTEGER DEFAULT 0,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for enrichment logs
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_lead ON enrichment_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_workspace ON enrichment_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_status ON enrichment_logs(status);

-- ============================================================================
-- ENRICHMENT PROVIDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS enrichment_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 1,
  cost_per_lookup DECIMAL(10,4) DEFAULT 0.00,
  fields_provided TEXT[], -- array of field names this provider can enrich
  rate_limit_per_minute INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default providers
INSERT INTO enrichment_providers (name, display_name, fields_provided, cost_per_lookup) VALUES
  ('clay', 'Clay', ARRAY['linkedin_url', 'job_title', 'company_size', 'company_revenue', 'phone', 'email_verified'], 0.05),
  ('clearbit', 'Clearbit', ARRAY['company_size', 'company_revenue', 'company_founded', 'company_linkedin', 'company_description'], 0.10),
  ('apollo', 'Apollo.io', ARRAY['linkedin_url', 'job_title', 'phone', 'email_verified', 'linkedin_headline'], 0.03),
  ('zoominfo', 'ZoomInfo', ARRAY['phone', 'email_verified', 'job_title', 'company_size', 'company_revenue'], 0.15)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- WORKSPACE ENRICHMENT SETTINGS
-- ============================================================================
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS auto_enrich_leads BOOLEAN DEFAULT true;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS enrichment_provider TEXT DEFAULT 'clay';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS enrichment_credits_used INTEGER DEFAULT 0;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS enrichment_credits_limit INTEGER DEFAULT 1000;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE enrichment_logs ENABLE ROW LEVEL SECURITY;

-- Workspace isolation for enrichment logs
CREATE POLICY "Workspace enrichment logs" ON enrichment_logs
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE enrichment_logs IS 'Log of all enrichment API calls';
COMMENT ON TABLE enrichment_providers IS 'Available enrichment data providers';
