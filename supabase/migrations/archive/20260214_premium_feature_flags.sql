-- Premium Feature Flags Migration
-- Adds feature access flags to workspaces table for upsell strategy

-- Add feature flags to workspaces table
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS has_pixel_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_whitelabel_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_extra_data_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_outbound_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_features_updated_at TIMESTAMPTZ;

-- Add index for feature flag queries
CREATE INDEX IF NOT EXISTS idx_workspaces_premium_features
ON workspaces (has_pixel_access, has_whitelabel_access, has_extra_data_access, has_outbound_access);

-- Create premium_feature_requests table
CREATE TABLE IF NOT EXISTS premium_feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('pixel', 'whitelabel', 'extra_data', 'outbound', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  use_case TEXT,
  expected_volume TEXT,
  budget_range TEXT,
  contact_preference TEXT DEFAULT 'email' CHECK (contact_preference IN ('email', 'call', 'slack')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'completed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for premium_feature_requests
ALTER TABLE premium_feature_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own workspace's requests
CREATE POLICY "Users can view own workspace requests"
  ON premium_feature_requests
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Users can create requests for their workspace
CREATE POLICY "Users can create requests for own workspace"
  ON premium_feature_requests
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
    AND user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Only admins/owners can update request status
CREATE POLICY "Admins can update requests"
  ON premium_feature_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'owner')
    )
  );

-- Create indexes for premium_feature_requests
CREATE INDEX IF NOT EXISTS idx_premium_requests_workspace ON premium_feature_requests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_premium_requests_user ON premium_feature_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_requests_status ON premium_feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_premium_requests_feature ON premium_feature_requests(feature_type);
CREATE INDEX IF NOT EXISTS idx_premium_requests_created ON premium_feature_requests(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_premium_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER premium_requests_updated_at
  BEFORE UPDATE ON premium_feature_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_premium_request_updated_at();

-- Add comments for documentation
COMMENT ON TABLE premium_feature_requests IS 'Stores requests from users to access premium features';
COMMENT ON COLUMN workspaces.has_pixel_access IS 'Access to AudienceLab pixel tracking';
COMMENT ON COLUMN workspaces.has_whitelabel_access IS 'Access to white-label branding removal';
COMMENT ON COLUMN workspaces.has_extra_data_access IS 'Access to 10x more audience data';
COMMENT ON COLUMN workspaces.has_outbound_access IS 'Access to automated outbound campaigns';
