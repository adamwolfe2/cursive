-- Company analysis cache table
-- Stores AI-generated company analysis results keyed by domain
-- Prevents re-running AI calls for the same domain across multiple workspaces/users
CREATE TABLE IF NOT EXISTS company_analysis_cache (
  domain            TEXT PRIMARY KEY,
  analysis          JSONB NOT NULL,
  analyzed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TTL index: queries can filter for entries newer than N hours
CREATE INDEX IF NOT EXISTS idx_company_analysis_cache_analyzed_at
  ON company_analysis_cache (analyzed_at);

-- No RLS needed — this is a service-level read-through cache with no PII
-- Access is only via service role key (admin client) or trusted server code
