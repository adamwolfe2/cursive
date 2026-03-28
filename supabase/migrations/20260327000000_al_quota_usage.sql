-- Migration: AudienceLab Daily Quota Tracking
-- Tracks per-workspace daily AL API lead consumption for quota enforcement

-- ============================================================================
-- AL QUOTA USAGE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS al_quota_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Date-based key for daily reset (YYYY-MM-DD in UTC)
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Running count for the day
  leads_consumed INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One row per workspace per day
  CONSTRAINT al_quota_usage_workspace_date UNIQUE (workspace_id, usage_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_al_quota_usage_workspace_date
  ON al_quota_usage(workspace_id, usage_date);

CREATE INDEX IF NOT EXISTS idx_al_quota_usage_date
  ON al_quota_usage(usage_date);

-- Updated_at trigger
CREATE TRIGGER al_quota_usage_updated_at
  BEFORE UPDATE ON al_quota_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: service role only — quota checks run server-side via admin client
ALTER TABLE al_quota_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON al_quota_usage
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER: Atomic increment with upsert
-- Returns the new total after incrementing.
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_al_quota(
  p_workspace_id UUID,
  p_count INTEGER DEFAULT 1
)
RETURNS INTEGER AS $$
DECLARE
  v_new_total INTEGER;
BEGIN
  INSERT INTO al_quota_usage (workspace_id, usage_date, leads_consumed)
  VALUES (p_workspace_id, CURRENT_DATE, p_count)
  ON CONFLICT (workspace_id, usage_date)
  DO UPDATE SET
    leads_consumed = al_quota_usage.leads_consumed + p_count,
    updated_at = NOW()
  RETURNING leads_consumed INTO v_new_total;

  RETURN v_new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER: Get today's usage for a workspace
-- ============================================================================
CREATE OR REPLACE FUNCTION get_al_quota_today(p_workspace_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_used INTEGER;
BEGIN
  SELECT COALESCE(leads_consumed, 0)
  INTO v_used
  FROM al_quota_usage
  WHERE workspace_id = p_workspace_id
    AND usage_date = CURRENT_DATE;

  RETURN COALESCE(v_used, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE al_quota_usage IS
  'Tracks AudienceLab API lead consumption per workspace per day for quota enforcement.';
COMMENT ON FUNCTION increment_al_quota(UUID, INTEGER) IS
  'Atomically increment AL quota usage for a workspace today. Returns new total.';
COMMENT ON FUNCTION get_al_quota_today(UUID) IS
  'Get total AL leads consumed today for a workspace.';
