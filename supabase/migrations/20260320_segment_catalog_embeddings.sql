-- Enable pgvector (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to segment catalog
ALTER TABLE al_segment_catalog
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create HNSW index for fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_al_segment_catalog_embedding
  ON al_segment_catalog
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- SQL function: semantic search with optional type/category filters
CREATE OR REPLACE FUNCTION match_segments(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 24,
  filter_type text DEFAULT NULL,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  segment_id text,
  name text,
  category text,
  sub_category text,
  description text,
  type text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.segment_id,
    s.name,
    s.category,
    s.sub_category,
    s.description,
    s.type,
    (1 - (s.embedding <=> query_embedding))::float AS similarity
  FROM al_segment_catalog s
  WHERE
    s.embedding IS NOT NULL
    AND 1 - (s.embedding <=> query_embedding) > match_threshold
    AND (filter_type IS NULL OR s.type = filter_type)
    AND (filter_category IS NULL OR s.category = filter_category)
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
