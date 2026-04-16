-- Admin Copilot — per-turn cost tracking + daily kill-switch.
--
-- Every turn (1 user message → 1 assistant response) writes one row.
-- Cost is calculated server-side from model pricing before insert.
--
-- The kill-switch is a daily $ cap: if today's spend > COPILOT_DAILY_USD_CAP,
-- the chat endpoint 429s until the next UTC day.

CREATE TABLE IF NOT EXISTS copilot_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,

  -- Model + routing
  model TEXT NOT NULL,
  surface TEXT NOT NULL DEFAULT 'admin',

  -- Token accounting
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cache_creation_tokens INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  thinking_tokens INTEGER NOT NULL DEFAULT 0,

  -- Tool usage
  tool_calls INTEGER NOT NULL DEFAULT 0,
  segments_retrieved INTEGER NOT NULL DEFAULT 0,

  -- Cost (computed in app; stored for fast aggregation)
  cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,

  -- Timing
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copilot_usage_created_at
  ON copilot_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_copilot_usage_session
  ON copilot_usage(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_copilot_usage_user
  ON copilot_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_copilot_usage_surface_day
  ON copilot_usage(surface, created_at DESC);

-- Admins see everything; regular users only their own.
ALTER TABLE copilot_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read all copilot usage" ON copilot_usage;
CREATE POLICY "admins read all copilot usage" ON copilot_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid()
        AND u.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "users read their own copilot usage" ON copilot_usage;
CREATE POLICY "users read their own copilot usage" ON copilot_usage
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "service role full access copilot usage" ON copilot_usage;
CREATE POLICY "service role full access copilot usage" ON copilot_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fast kill-switch check: today's spend on a given surface (UTC day).
CREATE OR REPLACE FUNCTION copilot_usage_today(surface_filter TEXT DEFAULT 'admin')
RETURNS TABLE (
  total_cost_usd NUMERIC,
  total_turns BIGINT,
  total_input_tokens BIGINT,
  total_output_tokens BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(SUM(cost_usd), 0)::NUMERIC AS total_cost_usd,
    COUNT(*)::BIGINT AS total_turns,
    COALESCE(SUM(input_tokens + cache_creation_tokens + cache_read_tokens), 0)::BIGINT AS total_input_tokens,
    COALESCE(SUM(output_tokens + thinking_tokens), 0)::BIGINT AS total_output_tokens
  FROM copilot_usage
  WHERE created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC')
    AND surface = surface_filter;
$$;

COMMENT ON TABLE copilot_usage IS 'Per-turn LLM cost log for admin copilot. Kill-switch compares today''s SUM(cost_usd) against COPILOT_DAILY_USD_CAP env var.';
