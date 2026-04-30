-- client_profiles table for matching engine + onboarding.
--
-- Code references this table in:
--   - src/lib/repositories/client-profile.repository.ts
--   - src/app/api/clients/route.ts
--   - src/lib/services/matching-engine.service.ts
--
-- Schema matches the type definition in database.types.ts.

CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Company info
  company_name TEXT NOT NULL,
  company_description TEXT,
  website_url TEXT,
  industry TEXT,
  company_size TEXT,

  -- Offering
  primary_offering TEXT,
  secondary_offerings TEXT[] DEFAULT '{}',
  value_propositions JSONB DEFAULT '[]'::jsonb,
  trust_signals JSONB DEFAULT '[]'::jsonb,
  pain_points TEXT[] DEFAULT '{}',
  competitors TEXT[] DEFAULT '{}',
  differentiators TEXT[] DEFAULT '{}',

  -- Targeting
  target_industries TEXT[] DEFAULT '{}',
  target_company_sizes TEXT[] DEFAULT '{}',
  target_seniorities TEXT[] DEFAULT '{}',
  target_regions TEXT[] DEFAULT '{}',
  target_titles TEXT[] DEFAULT '{}',

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_profiles_workspace ON client_profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_active ON client_profiles(workspace_id, is_active) WHERE is_active = true;

ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace isolation client_profiles" ON client_profiles;
CREATE POLICY "Workspace isolation client_profiles" ON client_profiles
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role client_profiles" ON client_profiles;
CREATE POLICY "Service role client_profiles" ON client_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_client_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_profiles_updated_at ON client_profiles;
CREATE TRIGGER trg_client_profiles_updated_at
  BEFORE UPDATE ON client_profiles
  FOR EACH ROW EXECUTE FUNCTION update_client_profiles_updated_at();

COMMENT ON TABLE client_profiles IS 'Customer-defined company profiles used by the matching engine and onboarding flow';
