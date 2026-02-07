-- Marketplace Enhancements Migration
-- Adds tables for custom audience requests, free credit grants, and upsell tracking

-- ============================================================================
-- CUSTOM AUDIENCE REQUESTS TABLE
-- ============================================================================
CREATE TABLE custom_audience_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Request details
  industry TEXT NOT NULL,
  geography TEXT NOT NULL,
  company_size TEXT NOT NULL,
  seniority_levels TEXT[] NOT NULL DEFAULT '{}',
  intent_signals TEXT,
  desired_volume TEXT NOT NULL,
  additional_notes TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sample_sent', 'approved', 'fulfilled', 'rejected', 'cancelled')),
  assigned_to TEXT,

  -- Delivery tracking
  sample_delivered_at TIMESTAMPTZ,
  full_delivered_at TIMESTAMPTZ,
  leads_delivered INTEGER DEFAULT 0,
  price_per_lead DECIMAL(10,4),
  total_price DECIMAL(10,2),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_custom_audience_requests_workspace ON custom_audience_requests(workspace_id);
CREATE INDEX idx_custom_audience_requests_status ON custom_audience_requests(status);
CREATE INDEX idx_custom_audience_requests_created ON custom_audience_requests(created_at DESC);

-- RLS
ALTER TABLE custom_audience_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace isolation" ON custom_audience_requests
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER custom_audience_requests_updated_at
  BEFORE UPDATE ON custom_audience_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FREE CREDIT GRANTS TABLE (idempotent tracking)
-- ============================================================================
CREATE TABLE free_credit_grants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits_granted INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One grant per workspace
  CONSTRAINT unique_workspace_grant UNIQUE (workspace_id)
);

-- Indexes
CREATE INDEX idx_free_credit_grants_workspace ON free_credit_grants(workspace_id);

-- RLS
ALTER TABLE free_credit_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace isolation" ON free_credit_grants
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- UPSELL EVENTS TABLE
-- ============================================================================
CREATE TABLE upsell_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  upsell_type TEXT NOT NULL CHECK (upsell_type IN ('data', 'outbound', 'pipeline', 'venture_studio')),
  trigger TEXT NOT NULL,
  lifetime_spend DECIMAL(10,2),

  -- Outcome tracking
  email_sent BOOLEAN DEFAULT FALSE,
  email_opened BOOLEAN DEFAULT FALSE,
  clicked BOOLEAN DEFAULT FALSE,
  converted BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_upsell_events_workspace ON upsell_events(workspace_id);
CREATE INDEX idx_upsell_events_type ON upsell_events(upsell_type);
CREATE INDEX idx_upsell_events_created ON upsell_events(created_at DESC);

-- RLS
ALTER TABLE upsell_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace isolation" ON upsell_events
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );
