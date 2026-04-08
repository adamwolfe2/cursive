-- GHL Private Marketplace Foundation
-- Adds GoHighLevel support to CRM connections and creates app install tracking

-- 1. Add 'gohighlevel' to crm_provider enum
ALTER TYPE crm_provider ADD VALUE IF NOT EXISTS 'gohighlevel';

-- 2. Add missing columns to crm_connections (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_connections' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE crm_connections ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_connections' AND column_name = 'status'
  ) THEN
    ALTER TABLE crm_connections ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

-- 3. Make created_by nullable (GHL marketplace callback doesn't set it)
ALTER TABLE crm_connections ALTER COLUMN created_by DROP NOT NULL;

-- 4. GHL App Installs table
CREATE TABLE IF NOT EXISTS ghl_app_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL UNIQUE,
  company_id TEXT,
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  uninstalled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ghl_app_installs_workspace_id ON ghl_app_installs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ghl_app_installs_status ON ghl_app_installs(status);

ALTER TABLE ghl_app_installs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_isolation" ON ghl_app_installs
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- Service role needs unrestricted access for webhook processing
CREATE POLICY "service_role_full_access" ON ghl_app_installs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
