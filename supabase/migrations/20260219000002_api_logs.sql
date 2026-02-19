-- API Logs Table
-- Tracks external API calls (Firecrawl, Fal.ai, Anthropic, Resend, etc.)
-- for cost monitoring and debugging

CREATE TABLE IF NOT EXISTS api_logs (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  service         TEXT         NOT NULL,                  -- 'firecrawl', 'fal', 'anthropic', 'openai', etc.
  endpoint        TEXT         NOT NULL,                  -- 'scrape', 'flux-pro', 'claude', etc.
  method          TEXT         NOT NULL DEFAULT 'POST',
  status_code     INT,
  duration_ms     INT,
  tokens_in       INT,
  tokens_out      INT,
  estimated_cost  NUMERIC(10,6) NOT NULL DEFAULT 0,       -- in USD
  workspace_id    UUID         REFERENCES workspaces(id) ON DELETE SET NULL,
  metadata        JSONB        DEFAULT '{}',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_logs_service    ON api_logs(service);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_workspace  ON api_logs(workspace_id) WHERE workspace_id IS NOT NULL;

ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
-- Service role only — no user-facing access to cost data
CREATE POLICY "api_logs_service_only" ON api_logs FOR ALL USING (false);
