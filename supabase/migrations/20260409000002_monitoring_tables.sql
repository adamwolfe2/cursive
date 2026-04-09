-- Monitoring tables: idempotent recovery migration
-- Creates platform_metrics and platform_alerts with full RLS
-- Originally from 20260205_monitoring_tables.sql — rewritten to be fully idempotent
--
-- NOTE: platform_alerts in production has alert_type/title columns (used by code), not alert_name.
-- This migration creates platform_metrics if absent, then ensures all needed columns exist
-- on platform_alerts (which may already exist with a different schema).

-- Platform Metrics Table
CREATE TABLE IF NOT EXISTS platform_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT NOT NULL CHECK (metric_unit IN ('count', 'ms', 'bytes', 'percent', 'dollars')),
  tags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_platform_metrics_name_created
  ON platform_metrics(metric_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_metrics_created
  ON platform_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_metrics_tags
  ON platform_metrics USING gin(tags);

-- Platform Alerts Table — CREATE only if it doesn't exist yet.
-- The real production schema uses alert_type + title, not alert_name.
CREATE TABLE IF NOT EXISTS platform_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  value NUMERIC,
  threshold NUMERIC,
  metadata JSONB DEFAULT '{}',
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id)
);

-- Add columns if the table pre-existed without them
-- (covers both the old alert_name schema and any partial state)
ALTER TABLE platform_alerts
  ADD COLUMN IF NOT EXISTS alert_type TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS triggered_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS value NUMERIC,
  ADD COLUMN IF NOT EXISTS threshold NUMERIC,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes for alerts
CREATE INDEX IF NOT EXISTS idx_platform_alerts_triggered
  ON platform_alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_alerts_unresolved
  ON platform_alerts(triggered_at DESC)
  WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_platform_alerts_alert_type
  ON platform_alerts(alert_type);

-- Comments
COMMENT ON TABLE platform_metrics IS 'Stores all platform metrics for monitoring and alerting';
COMMENT ON TABLE platform_alerts IS 'Stores triggered alerts and their resolution status';

-- RLS
ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_alerts ENABLE ROW LEVEL SECURITY;

-- platform_metrics policies
DROP POLICY IF EXISTS "Platform admins can read metrics" ON platform_metrics;
CREATE POLICY "Platform admins can read metrics" ON platform_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE platform_admins.email = auth.jwt() ->> 'email'
        AND platform_admins.is_active = true
    )
  );

DROP POLICY IF EXISTS "Service role can insert metrics" ON platform_metrics;
CREATE POLICY "Service role can insert metrics" ON platform_metrics
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- platform_alerts policies
DROP POLICY IF EXISTS "Platform admins can read alerts" ON platform_alerts;
DROP POLICY IF EXISTS "Platform admins can view alerts" ON platform_alerts;
CREATE POLICY "Platform admins can read alerts" ON platform_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE platform_admins.email = auth.jwt() ->> 'email'
        AND platform_admins.is_active = true
    )
  );

DROP POLICY IF EXISTS "Service role can manage alerts" ON platform_alerts;
CREATE POLICY "Service role can manage alerts" ON platform_alerts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON platform_metrics TO authenticated;
GRANT INSERT ON platform_metrics TO service_role;
GRANT ALL ON platform_alerts TO service_role;
GRANT SELECT ON platform_alerts TO authenticated;
