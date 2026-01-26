-- Workspace Settings & Onboarding
-- Comprehensive workspace configuration and onboarding tracking

-- Add enhanced settings to workspaces
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(50) DEFAULT 'not_started';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Workspace integrations table
CREATE TABLE IF NOT EXISTS workspace_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Integration type
  provider VARCHAR(50) NOT NULL, -- emailbison, ghl, slack, zapier, hubspot, salesforce
  name VARCHAR(100), -- Display name

  -- Authentication
  is_connected BOOLEAN DEFAULT false,
  credentials JSONB DEFAULT '{}', -- Encrypted API keys, tokens
  oauth_data JSONB DEFAULT '{}', -- OAuth tokens, refresh tokens

  -- Configuration
  config JSONB DEFAULT '{}', -- Provider-specific settings
  mapping JSONB DEFAULT '{}', -- Field mappings

  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error', 'disconnected')),
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, provider)
);

-- Onboarding checklist/steps
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Step identification
  step_key VARCHAR(50) NOT NULL, -- connect_email, create_campaign, import_leads, etc.
  step_order INTEGER DEFAULT 0,

  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT false,
  skipped_at TIMESTAMPTZ,

  -- Data collected during step
  step_data JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, user_id, step_key)
);

-- API keys for external access
CREATE TABLE IF NOT EXISTS workspace_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Who created the key

  -- Key details
  name VARCHAR(100) NOT NULL,
  key_prefix VARCHAR(10) NOT NULL, -- First 10 chars for display
  key_hash VARCHAR(255) NOT NULL, -- Hashed full key

  -- Permissions
  scopes TEXT[] DEFAULT '{}', -- read:leads, write:campaigns, etc.

  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(key_hash)
);

-- Enable RLS
ALTER TABLE workspace_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Workspace isolation for integrations" ON workspace_integrations
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Workspace isolation for onboarding" ON onboarding_steps
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Workspace isolation for api keys" ON workspace_api_keys
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- Function to get onboarding progress
CREATE OR REPLACE FUNCTION get_onboarding_progress(
  p_workspace_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_steps JSONB;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE is_completed OR skipped)
  INTO v_total, v_completed
  FROM onboarding_steps
  WHERE workspace_id = p_workspace_id AND user_id = p_user_id;

  SELECT jsonb_agg(jsonb_build_object(
    'step_key', step_key,
    'step_order', step_order,
    'is_completed', is_completed,
    'skipped', skipped,
    'completed_at', completed_at
  ) ORDER BY step_order) INTO v_steps
  FROM onboarding_steps
  WHERE workspace_id = p_workspace_id AND user_id = p_user_id;

  RETURN jsonb_build_object(
    'total_steps', v_total,
    'completed_steps', v_completed,
    'progress_percent', CASE WHEN v_total > 0 THEN ROUND((v_completed::DECIMAL / v_total) * 100, 2) ELSE 0 END,
    'is_complete', v_completed >= v_total AND v_total > 0,
    'steps', COALESCE(v_steps, '[]'::jsonb)
  );
END;
$$;

-- Function to initialize onboarding for a new workspace
CREATE OR REPLACE FUNCTION initialize_onboarding(
  p_workspace_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert default onboarding steps
  INSERT INTO onboarding_steps (workspace_id, user_id, step_key, step_order)
  VALUES
    (p_workspace_id, p_user_id, 'connect_email_account', 1),
    (p_workspace_id, p_user_id, 'configure_sender_info', 2),
    (p_workspace_id, p_user_id, 'create_first_campaign', 3),
    (p_workspace_id, p_user_id, 'import_leads', 4),
    (p_workspace_id, p_user_id, 'compose_first_email', 5),
    (p_workspace_id, p_user_id, 'review_and_send', 6)
  ON CONFLICT (workspace_id, user_id, step_key) DO NOTHING;

  -- Update workspace status
  UPDATE workspaces
  SET onboarding_status = 'in_progress'
  WHERE id = p_workspace_id AND onboarding_status = 'not_started';
END;
$$;

-- Function to complete an onboarding step
CREATE OR REPLACE FUNCTION complete_onboarding_step(
  p_workspace_id UUID,
  p_user_id UUID,
  p_step_key VARCHAR(50),
  p_step_data JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_all_complete BOOLEAN;
BEGIN
  -- Mark step as completed
  UPDATE onboarding_steps
  SET
    is_completed = true,
    completed_at = NOW(),
    step_data = p_step_data,
    updated_at = NOW()
  WHERE workspace_id = p_workspace_id
    AND user_id = p_user_id
    AND step_key = p_step_key
    AND is_completed = false;

  -- Check if all steps are now complete
  SELECT NOT EXISTS (
    SELECT 1 FROM onboarding_steps
    WHERE workspace_id = p_workspace_id
      AND user_id = p_user_id
      AND is_completed = false
      AND skipped = false
  ) INTO v_all_complete;

  -- Update workspace status if all complete
  IF v_all_complete THEN
    UPDATE workspaces
    SET
      onboarding_status = 'completed',
      onboarding_completed_at = NOW()
    WHERE id = p_workspace_id;
  END IF;

  RETURN v_all_complete;
END;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integrations_workspace ON workspace_integrations(workspace_id, provider);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON workspace_integrations(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_onboarding_workspace ON onboarding_steps(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_workspace ON workspace_api_keys(workspace_id, is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON workspace_api_keys(key_hash) WHERE is_active = true;

-- Comments
COMMENT ON TABLE workspace_integrations IS 'External service integrations for workspaces';
COMMENT ON TABLE onboarding_steps IS 'Tracks onboarding progress for users';
COMMENT ON TABLE workspace_api_keys IS 'API keys for programmatic access';
COMMENT ON FUNCTION initialize_onboarding IS 'Sets up default onboarding steps for a new workspace';
COMMENT ON FUNCTION complete_onboarding_step IS 'Marks an onboarding step as complete and checks for full completion';
