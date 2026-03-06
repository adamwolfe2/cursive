-- Enable pg_trgm extension for trigram similarity searches
-- This allows GIN index to accelerate ILIKE with leading wildcard (%pixel%, %superpixel%)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram index on leads.source
-- Speeds up: .or('source.ilike.%pixel%,source.ilike.%superpixel%')
-- Without this index these queries do full table scans (seconds at scale → ~5ms with index)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_source_trgm
  ON leads USING GIN (source gin_trgm_ops)
  WHERE source IS NOT NULL;

-- Also index workspace_id + source for combined filter queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_workspace_source
  ON leads (workspace_id, source)
  WHERE source IS NOT NULL;
