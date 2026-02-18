-- Performance indexes for common dashboard queries
-- These cover the most frequent query patterns identified in the dashboard layout and pages.

-- Leads by workspace + delivered_at (dashboard counts, daily leads page)
CREATE INDEX IF NOT EXISTS idx_leads_workspace_delivered
  ON leads(workspace_id, delivered_at DESC);

-- Leads by workspace + enrichment_status (enriched count, activity log)
CREATE INDEX IF NOT EXISTS idx_leads_workspace_enrichment
  ON leads(workspace_id, enrichment_status);

-- User lead assignments by user + workspace (my-leads page)
CREATE INDEX IF NOT EXISTS idx_ula_user_workspace
  ON user_lead_assignments(user_id, workspace_id, assigned_at DESC);

-- Users by auth_user_id (used in every authenticated request)
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id
  ON users(auth_user_id);

-- Pixel by workspace + active (dashboard pixel check)
CREATE INDEX IF NOT EXISTS idx_pixels_workspace_active
  ON audiencelab_pixels(workspace_id, is_active);
