-- Campaign Requests Table
-- Stores applications for custom EmailBison campaigns

CREATE TABLE IF NOT EXISTS campaign_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'launched')),

  -- Contact Information
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,

  -- ICP Details
  target_industry TEXT NOT NULL,
  target_company_size TEXT NOT NULL,
  target_job_titles TEXT NOT NULL,
  geographic_focus TEXT NOT NULL,

  -- Campaign Goals
  campaign_goal TEXT NOT NULL,
  monthly_budget TEXT NOT NULL,
  expected_volume TEXT NOT NULL,

  -- Value Proposition
  unique_value_prop TEXT NOT NULL,
  pain_points_addressed TEXT NOT NULL,
  current_challenges TEXT,

  -- Timeline
  timeline TEXT NOT NULL,

  -- Admin notes (for EmailBison team)
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_campaign_requests_workspace ON campaign_requests(workspace_id);
CREATE INDEX idx_campaign_requests_user ON campaign_requests(user_id);
CREATE INDEX idx_campaign_requests_status ON campaign_requests(status);
CREATE INDEX idx_campaign_requests_created_at ON campaign_requests(created_at DESC);

-- RLS Policies
ALTER TABLE campaign_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own workspace's campaign requests
CREATE POLICY "Users can view own workspace campaign requests"
  ON campaign_requests FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Users can create campaign requests for their workspace
CREATE POLICY "Users can create campaign requests"
  ON campaign_requests FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Admin users can update campaign requests
CREATE POLICY "Admin users can update campaign requests"
  ON campaign_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_campaign_requests_updated_at
  BEFORE UPDATE ON campaign_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE campaign_requests IS 'Campaign request applications for EmailBison custom campaigns';
COMMENT ON COLUMN campaign_requests.status IS 'Request status: pending, reviewing, approved, rejected, launched';
COMMENT ON COLUMN campaign_requests.admin_notes IS 'Internal notes for EmailBison team';
