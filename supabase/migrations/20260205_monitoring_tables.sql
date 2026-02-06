-- Monitoring Tables
-- Platform metrics and alerts tables

-- Platform Metrics Table
-- Stores all performance and business metrics
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

-- Platform Alerts Table
-- Stores triggered alerts
CREATE TABLE IF NOT EXISTS platform_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  value NUMERIC,
  threshold NUMERIC,
  metadata JSONB DEFAULT '{}',
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id)
);

-- Indexes for alerts
CREATE INDEX IF NOT EXISTS idx_platform_alerts_triggered
  ON platform_alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_alerts_name
  ON platform_alerts(alert_name);
CREATE INDEX IF NOT EXISTS idx_platform_alerts_unresolved
  ON platform_alerts(triggered_at DESC)
  WHERE resolved_at IS NULL;

-- Add comments
COMMENT ON TABLE platform_metrics IS 'Stores all platform metrics for monitoring and alerting';
COMMENT ON TABLE platform_alerts IS 'Stores triggered alerts and their resolution status';

-- Retention policy (optional)
-- Automatically delete metrics older than 30 days
-- Note: This requires pg_cron extension to be enabled
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup at 2 AM
-- SELECT cron.schedule(
--   'cleanup-old-metrics',
--   '0 2 * * *',
--   $$DELETE FROM platform_metrics WHERE created_at < NOW() - INTERVAL '30 days'$$
-- );

-- RLS Policies
-- Only admins can access these tables
ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Only platform admins can read metrics
CREATE POLICY "Platform admins can read metrics" ON platform_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE platform_admins.email = auth.jwt() ->> 'email'
        AND platform_admins.is_active = true
    )
  );

-- Policy: Service role can insert metrics
CREATE POLICY "Service role can insert metrics" ON platform_metrics
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Only platform admins can read alerts
CREATE POLICY "Platform admins can read alerts" ON platform_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE platform_admins.email = auth.jwt() ->> 'email'
        AND platform_admins.is_active = true
    )
  );

-- Policy: Service role can insert and update alerts
CREATE POLICY "Service role can manage alerts" ON platform_alerts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON platform_metrics TO authenticated;
GRANT INSERT ON platform_metrics TO service_role;
GRANT ALL ON platform_alerts TO service_role;
GRANT SELECT ON platform_alerts TO authenticated;
