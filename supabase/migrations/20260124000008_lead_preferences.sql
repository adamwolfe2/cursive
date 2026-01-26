-- Cursive Platform - Lead Preferences
-- Migration for workspace lead preferences and targeting

-- ============================================================================
-- LEAD PREFERENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,

  -- Targeting criteria
  target_industries TEXT[], -- array of industries
  target_regions TEXT[], -- array of states/regions
  target_company_sizes TEXT[], -- 1-10, 11-50, etc.
  target_job_titles TEXT[], -- array of job titles
  target_intent_signals TEXT[], -- array of intent signals

  -- Budget and limits
  max_leads_per_day INTEGER DEFAULT 10,
  max_cost_per_lead DECIMAL(10,2),
  monthly_budget DECIMAL(10,2),

  -- Stats
  total_leads_received INTEGER DEFAULT 0,
  total_spend DECIMAL(10,2) DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lead preferences
CREATE INDEX IF NOT EXISTS idx_lead_preferences_workspace ON lead_preferences(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lead_preferences_active ON lead_preferences(is_active);

-- ============================================================================
-- LEAD REQUESTS TABLE (for requesting specific leads)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  preference_id UUID REFERENCES lead_preferences(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL, -- immediate, scheduled, ongoing
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, fulfilled, cancelled
  quantity_requested INTEGER NOT NULL,
  quantity_delivered INTEGER DEFAULT 0,
  notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ
);

-- Index for lead requests
CREATE INDEX IF NOT EXISTS idx_lead_requests_workspace ON lead_requests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lead_requests_status ON lead_requests(status);

-- ============================================================================
-- UPDATE WORKSPACES TABLE
-- ============================================================================
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS preferred_lead_volume TEXT DEFAULT 'medium'; -- low, medium, high
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS lead_budget_monthly DECIMAL(10,2);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS min_lead_score INTEGER DEFAULT 50;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS auto_accept_leads BOOLEAN DEFAULT true;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS lead_notification_frequency TEXT DEFAULT 'immediate'; -- immediate, hourly, daily

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE lead_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_requests ENABLE ROW LEVEL SECURITY;

-- Workspace isolation
CREATE POLICY "Workspace lead preferences" ON lead_preferences
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace lead requests" ON lead_requests
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE lead_preferences IS 'Workspace lead targeting preferences';
COMMENT ON TABLE lead_requests IS 'Lead requests for on-demand lead generation';
