-- Ops Dashboard Migration
-- Adds cal_bookings table + ops_stage to workspaces
-- Apply via Supabase SQL editor: https://supabase.com/dashboard/project/lrbftjspiiakfnydxbgk/sql/new

-- ── 1. cal_bookings table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cal_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_uid TEXT UNIQUE NOT NULL,
  attendee_name TEXT NOT NULL DEFAULT '',
  attendee_email TEXT NOT NULL DEFAULT '',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming', -- upcoming | completed | cancelled | no_show
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cal_bookings_email ON cal_bookings(attendee_email);
CREATE INDEX IF NOT EXISTS idx_cal_bookings_status ON cal_bookings(status);
CREATE INDEX IF NOT EXISTS idx_cal_bookings_start ON cal_bookings(start_time DESC);

-- RLS: only accessible via service_role (admin API routes)
ALTER TABLE cal_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only" ON cal_bookings;
CREATE POLICY "Service role only" ON cal_bookings USING (false);
GRANT ALL ON cal_bookings TO service_role;

-- ── 2. ops_stage column on workspaces ────────────────────────────────────────

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS ops_stage TEXT DEFAULT 'new';

-- Backfill from pixel trial_status (best-effort)
UPDATE workspaces w
SET ops_stage = CASE ap.trial_status
  WHEN 'trial'   THEN 'trial'
  WHEN 'active'  THEN 'active'
  WHEN 'expired' THEN 'at_risk'
  ELSE 'new'
END
FROM audiencelab_pixels ap
WHERE ap.workspace_id = w.id
  AND w.ops_stage = 'new';

CREATE INDEX IF NOT EXISTS idx_workspaces_ops_stage ON workspaces(ops_stage);
