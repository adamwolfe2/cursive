-- API Usage Log for MCP server forensic cost tracking.
--
-- This table was originally defined in 20260125000006_rate_limiting_analytics.sql
-- but that migration file was never applied to the remote database (drift between
-- local migration files and remote state). The MCP server depends on this table
-- for per-call cost tracking, so we add it here as a targeted, idempotent creation.
--
-- Columns match the original definition so existing analytics code that references
-- api_usage_log (if any is later enabled) will remain compatible.

CREATE TABLE IF NOT EXISTS api_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,

  -- Request metadata (nullable — MCP route fills what it can)
  ip_address INET,
  user_agent TEXT,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for the common forensic query patterns:
--   "show me all MCP calls for workspace X in the last hour"
--   "show me cost distribution by endpoint for the last day"
CREATE INDEX IF NOT EXISTS idx_api_usage_log_workspace_id
  ON api_usage_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_created_at
  ON api_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_endpoint
  ON api_usage_log(endpoint);

-- RLS: workspace isolation. Only users of the workspace can read their own log rows.
-- MCP route inserts via admin client, bypassing RLS.
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace isolation for api_usage_log" ON api_usage_log;
CREATE POLICY "Workspace isolation for api_usage_log" ON api_usage_log
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Service role bypass for admin client writes from the MCP route
DROP POLICY IF EXISTS "Service role access for api_usage_log" ON api_usage_log;
CREATE POLICY "Service role access for api_usage_log" ON api_usage_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE api_usage_log IS 'Per-request API usage log for forensic cost tracking. MCP server writes one row per tool call.';
