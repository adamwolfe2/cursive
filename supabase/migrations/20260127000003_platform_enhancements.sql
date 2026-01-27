-- Migration: Add partner lead acceptance and workspace enhancements
-- Cursive Platform

-- Add accepts_partner_leads field to workspaces for partner upload security
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS accepts_partner_leads BOOLEAN DEFAULT false;

-- Add index for partner lead routing queries
CREATE INDEX IF NOT EXISTS idx_workspaces_partner_leads
ON workspaces (accepts_partner_leads, subscription_status)
WHERE accepts_partner_leads = true;

-- Add allowed_industries and allowed_regions if they don't exist
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS allowed_industries TEXT[] DEFAULT '{}';

ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS allowed_regions TEXT[] DEFAULT '{}';

-- Create index for industry/region matching
CREATE INDEX IF NOT EXISTS idx_workspaces_industries
ON workspaces USING GIN (allowed_industries);

CREATE INDEX IF NOT EXISTS idx_workspaces_regions
ON workspaces USING GIN (allowed_regions);

-- Add rate limiting tracking table
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- IP address or user ID
  endpoint TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Index for rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup
ON rate_limit_tracking (identifier, endpoint, window_start DESC);

-- Cleanup old rate limit entries (auto-expire after 1 hour)
CREATE INDEX IF NOT EXISTS idx_rate_limit_cleanup
ON rate_limit_tracking (window_start)
WHERE window_start < NOW() - INTERVAL '1 hour';

-- Add API request logging table for analytics and debugging
CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for API log queries
CREATE INDEX IF NOT EXISTS idx_api_logs_workspace
ON api_request_logs (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint
ON api_request_logs (endpoint, created_at DESC);

-- Partition hint for future scaling (logs table will grow fast)
COMMENT ON TABLE api_request_logs IS 'Consider partitioning by created_at for production scale';

-- Add health check secret to be managed via env, but document it
COMMENT ON TABLE rate_limit_tracking IS 'Rate limiting data. HEALTH_CHECK_SECRET env var controls /api/health access.';
