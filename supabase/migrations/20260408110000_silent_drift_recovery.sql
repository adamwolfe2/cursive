-- Silent drift recovery migration.
--
-- Creates tables that are referenced in the source code but were never
-- applied to production. Each one was discovered via a code grep against
-- the live schema. All inserts/queries against these tables have been
-- silently failing or returning empty results in production.
--
-- See commit history for context — this is part of the autonomous
-- audit & recovery sprint.

-- ─── saved_filters ────────────────────────────────────────────────────────
-- Used by /api/filters and /api/marketplace/saved-searches for user-saved
-- filter presets across multiple feature areas.

CREATE TABLE IF NOT EXISTS saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  filter_type VARCHAR(50) NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_filters_user ON saved_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_workspace_type ON saved_filters(workspace_id, filter_type);
CREATE INDEX IF NOT EXISTS idx_saved_filters_shared ON saved_filters(workspace_id, is_shared) WHERE is_shared = true;

ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace isolation saved_filters" ON saved_filters;
CREATE POLICY "Workspace isolation saved_filters" ON saved_filters
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service role saved_filters" ON saved_filters;
CREATE POLICY "Service role saved_filters" ON saved_filters
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── saved_segments ───────────────────────────────────────────────────────
-- Used by /api/segments for workspace-shared saved audience segments.

CREATE TABLE IF NOT EXISTS saved_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_run_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_segments_workspace ON saved_segments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_saved_segments_active ON saved_segments(workspace_id) WHERE is_active = true;

ALTER TABLE saved_segments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace isolation saved_segments" ON saved_segments;
CREATE POLICY "Workspace isolation saved_segments" ON saved_segments
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service role saved_segments" ON saved_segments;
CREATE POLICY "Service role saved_segments" ON saved_segments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── team_invites ─────────────────────────────────────────────────────────
-- Used by /api/team/invites for workspace member invitations.

CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  invite_token TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_invites_workspace ON team_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_team_invites_pending ON team_invites(workspace_id, status) WHERE status = 'pending';

ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace isolation team_invites" ON team_invites;
CREATE POLICY "Workspace isolation team_invites" ON team_invites
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service role team_invites" ON team_invites;
CREATE POLICY "Service role team_invites" ON team_invites
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── lead_status_history ──────────────────────────────────────────────────
-- Schema matches database.types.ts definition.

CREATE TABLE IF NOT EXISTS lead_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  change_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead ON lead_status_history(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_workspace ON lead_status_history(workspace_id);

ALTER TABLE lead_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace isolation lead_status_history" ON lead_status_history;
CREATE POLICY "Workspace isolation lead_status_history" ON lead_status_history
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service role lead_status_history" ON lead_status_history;
CREATE POLICY "Service role lead_status_history" ON lead_status_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── lead_notes ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'general',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_notes_workspace ON lead_notes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_pinned ON lead_notes(lead_id) WHERE is_pinned = true;

ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace isolation lead_notes" ON lead_notes;
CREATE POLICY "Workspace isolation lead_notes" ON lead_notes
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service role lead_notes" ON lead_notes;
CREATE POLICY "Service role lead_notes" ON lead_notes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── lead_preferences ─────────────────────────────────────────────────────
-- Per-user preferences for the leads view (saved column visibility, sort, etc).

CREATE TABLE IF NOT EXISTS lead_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT lead_preferences_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_lead_preferences_user ON lead_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_preferences_workspace ON lead_preferences(workspace_id);

ALTER TABLE lead_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User owns lead_preferences" ON lead_preferences;
CREATE POLICY "User owns lead_preferences" ON lead_preferences
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service role lead_preferences" ON lead_preferences;
CREATE POLICY "Service role lead_preferences" ON lead_preferences
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── lead_assignments ─────────────────────────────────────────────────────
-- Per-lead-per-user assignment ledger (different from user_lead_assignments
-- which is workspace-scoped routing). This is a generic assignment table.

CREATE TABLE IF NOT EXISTS lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assignment_type VARCHAR(50) NOT NULL DEFAULT 'manual',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead ON lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_assigned_to ON lead_assignments(assigned_to) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_lead_assignments_workspace ON lead_assignments(workspace_id);

ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace isolation lead_assignments" ON lead_assignments;
CREATE POLICY "Workspace isolation lead_assignments" ON lead_assignments
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service role lead_assignments" ON lead_assignments;
CREATE POLICY "Service role lead_assignments" ON lead_assignments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── Updated_at triggers ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_drift_recovery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_saved_filters_updated_at') THEN
    CREATE TRIGGER trg_saved_filters_updated_at BEFORE UPDATE ON saved_filters
      FOR EACH ROW EXECUTE FUNCTION update_drift_recovery_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_saved_segments_updated_at') THEN
    CREATE TRIGGER trg_saved_segments_updated_at BEFORE UPDATE ON saved_segments
      FOR EACH ROW EXECUTE FUNCTION update_drift_recovery_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_lead_notes_updated_at') THEN
    CREATE TRIGGER trg_lead_notes_updated_at BEFORE UPDATE ON lead_notes
      FOR EACH ROW EXECUTE FUNCTION update_drift_recovery_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_lead_preferences_updated_at') THEN
    CREATE TRIGGER trg_lead_preferences_updated_at BEFORE UPDATE ON lead_preferences
      FOR EACH ROW EXECUTE FUNCTION update_drift_recovery_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_lead_assignments_updated_at') THEN
    CREATE TRIGGER trg_lead_assignments_updated_at BEFORE UPDATE ON lead_assignments
      FOR EACH ROW EXECUTE FUNCTION update_drift_recovery_updated_at();
  END IF;
END $$;
