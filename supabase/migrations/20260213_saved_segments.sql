/**
 * Saved Segments - Persist audience filter definitions
 * Allows users to save and reuse complex segment queries
 */

-- Create saved_segments table
CREATE TABLE IF NOT EXISTS saved_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL,
  last_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_saved_segments_workspace ON saved_segments(workspace_id, status, created_at DESC);
CREATE INDEX idx_saved_segments_user ON saved_segments(user_id);
CREATE INDEX idx_saved_segments_status ON saved_segments(status) WHERE status = 'active';

-- RLS policies
ALTER TABLE saved_segments ENABLE ROW LEVEL SECURITY;

-- Users can view segments in their workspace
CREATE POLICY "Users can view workspace segments" ON saved_segments
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Users can create segments in their workspace
CREATE POLICY "Users can create segments" ON saved_segments
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
    AND user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Users can update their own segments
CREATE POLICY "Users can update own segments" ON saved_segments
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Users can delete their own segments
CREATE POLICY "Users can delete own segments" ON saved_segments
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_segments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_saved_segments_updated_at
  BEFORE UPDATE ON saved_segments
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_segments_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON saved_segments TO authenticated;
