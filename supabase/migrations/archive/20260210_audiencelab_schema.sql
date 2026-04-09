-- Audience Labs Integration Schema
-- Raw event storage + normalized identity profiles
-- Supports SuperPixel, AudienceSync, and batch export data flows

-- ============ audiencelab_events (append-only raw storage) ============

CREATE TABLE IF NOT EXISTS audiencelab_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL CHECK (source IN ('superpixel', 'audiencesync', 'export')),
  pixel_id TEXT,
  event_type TEXT,
  hem_sha256 TEXT,
  uid TEXT,
  profile_id TEXT,
  ip_address TEXT,
  raw JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  workspace_id UUID REFERENCES workspaces(id),
  lead_id UUID REFERENCES leads(id),
  identity_id UUID, -- FK added after audiencelab_identities is created
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for audiencelab_events
CREATE INDEX IF NOT EXISTS idx_al_events_workspace_received
  ON audiencelab_events (workspace_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_al_events_hem
  ON audiencelab_events (hem_sha256) WHERE hem_sha256 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_al_events_source_processed
  ON audiencelab_events (source, processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_al_events_profile_id
  ON audiencelab_events (profile_id) WHERE profile_id IS NOT NULL;

-- ============ audiencelab_identities (normalized, upsert target) ============

CREATE TABLE IF NOT EXISTS audiencelab_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT,
  profile_id TEXT,
  hem_sha256 TEXT,
  personal_emails TEXT[] DEFAULT '{}',
  business_emails TEXT[] DEFAULT '{}',
  phones TEXT[] DEFAULT '{}',
  primary_email TEXT,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  company_domain TEXT,
  job_title TEXT,
  address1 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  email_validation_status TEXT,
  email_last_seen TIMESTAMPTZ,
  skiptrace_match_by TEXT,
  deliverability_score INTEGER DEFAULT 0,
  raw_resolution JSONB,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  visit_count INTEGER NOT NULL DEFAULT 1,
  lead_id UUID REFERENCES leads(id),
  workspace_id UUID REFERENCES workspaces(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraint for profile_id (primary dedup key)
CREATE UNIQUE INDEX IF NOT EXISTS idx_al_identities_profile_id
  ON audiencelab_identities (profile_id) WHERE profile_id IS NOT NULL;

-- Other identity indexes
CREATE INDEX IF NOT EXISTS idx_al_identities_hem
  ON audiencelab_identities (hem_sha256) WHERE hem_sha256 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_al_identities_workspace_lastseen
  ON audiencelab_identities (workspace_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_al_identities_uid
  ON audiencelab_identities (uid) WHERE uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_al_identities_primary_email
  ON audiencelab_identities (primary_email) WHERE primary_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_al_identities_lead_id
  ON audiencelab_identities (lead_id) WHERE lead_id IS NOT NULL;

-- Now add FK from events to identities
ALTER TABLE audiencelab_events
  ADD CONSTRAINT fk_al_events_identity
  FOREIGN KEY (identity_id) REFERENCES audiencelab_identities(id);

-- ============ RLS Policies ============

ALTER TABLE audiencelab_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audiencelab_identities ENABLE ROW LEVEL SECURITY;

-- Workspace isolation: users can only see their own workspace's data
CREATE POLICY "Workspace isolation for audiencelab_events"
  ON audiencelab_events
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace isolation for audiencelab_identities"
  ON audiencelab_identities
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Service role bypass (for admin client / Inngest functions)
CREATE POLICY "Service role access for audiencelab_events"
  ON audiencelab_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role access for audiencelab_identities"
  ON audiencelab_identities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============ Updated_at trigger ============

CREATE OR REPLACE FUNCTION update_audiencelab_identities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audiencelab_identities_updated_at
  BEFORE UPDATE ON audiencelab_identities
  FOR EACH ROW
  EXECUTE FUNCTION update_audiencelab_identities_updated_at();
