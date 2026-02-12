-- Performance indexes for common query patterns
-- Applied as part of production optimization audit

-- My Leads: user_lead_assignments by user + status + assigned_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ula_user_status
  ON user_lead_assignments(user_id, status, assigned_at DESC);

-- Leads: workspace + created_at for dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_workspace_created
  ON leads(workspace_id, created_at DESC);

-- AudienceLab: unprocessed events by workspace
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_al_events_unprocessed
  ON audiencelab_events(workspace_id) WHERE processed = false;

-- Rate limit logs: key + created_at for token bucket lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_limit_logs_key_created
  ON rate_limit_logs(key, created_at DESC);
