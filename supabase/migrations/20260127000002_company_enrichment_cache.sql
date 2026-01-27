-- Company Enrichment Cache
-- Caches company enrichment results to avoid repeated API calls

-- ============================================================================
-- COMPANY ENRICHMENT CACHE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_enrichment_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL UNIQUE,

  -- Cached enrichment result (full JSON)
  enrichment_data JSONB NOT NULL,

  -- Metadata
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hit_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_enrichment_cache_domain ON company_enrichment_cache(domain);
CREATE INDEX IF NOT EXISTS idx_company_enrichment_cache_cached_at ON company_enrichment_cache(cached_at);

-- RLS (public read for logo lookups, admin write)
ALTER TABLE company_enrichment_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read from cache (for logo lookups)
CREATE POLICY "Public can read enrichment cache" ON company_enrichment_cache
  FOR SELECT
  USING (true);

-- Only authenticated users can write to cache
CREATE POLICY "Authenticated can write cache" ON company_enrichment_cache
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update cache" ON company_enrichment_cache
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- CLEANUP FUNCTION
-- Run periodically to remove stale cache entries
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_enrichment_cache(max_age_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM company_enrichment_cache
  WHERE cached_at < NOW() - (max_age_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRACK CACHE HITS
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_cache_hit(p_domain TEXT)
RETURNS void AS $$
BEGIN
  UPDATE company_enrichment_cache
  SET hit_count = hit_count + 1
  WHERE domain = p_domain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE company_enrichment_cache IS 'Caches company enrichment API results to reduce external API calls';
COMMENT ON FUNCTION cleanup_enrichment_cache(INTEGER) IS 'Removes cache entries older than specified days';
COMMENT ON FUNCTION increment_cache_hit(TEXT) IS 'Tracks cache hit statistics';
