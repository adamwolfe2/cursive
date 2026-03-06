-- Add first enrichment celebration flag to workspaces
-- Used to show a one-time modal when the user's first lead gets enriched
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS has_seen_first_enrichment BOOLEAN NOT NULL DEFAULT FALSE;
