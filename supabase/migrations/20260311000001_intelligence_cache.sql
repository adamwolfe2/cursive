-- Intelligence Cache Table
-- Stores cached results from external intelligence APIs (Perplexity, Proxycurl, etc.)
-- Workspace-agnostic: same person = same data regardless of who looks them up.
-- No RLS — accessed only via admin (service role) client.

CREATE TABLE IF NOT EXISTS intelligence_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  cache_key text NOT NULL,
  result jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: one cached entry per provider + key
ALTER TABLE intelligence_cache
  ADD CONSTRAINT intelligence_cache_provider_cache_key_key
  UNIQUE (provider, cache_key);

-- Index for expired-entry cleanup jobs
CREATE INDEX idx_intelligence_cache_expires_at
  ON intelligence_cache (expires_at);

-- Index for fast lookups by provider
CREATE INDEX idx_intelligence_cache_provider
  ON intelligence_cache (provider);
