-- Migration: API Request Idempotency
-- Prevents duplicate API requests (double-clicks, network retries)

-- Create table to track processed API requests
CREATE TABLE IF NOT EXISTS api_idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  request_hash TEXT, -- Hash of request body for additional validation
  response_data JSONB, -- Cached response for duplicate requests
  status VARCHAR(50) NOT NULL, -- 'processing', 'completed', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  completed_at TIMESTAMPTZ
);

-- Index for fast lookup by key
CREATE INDEX IF NOT EXISTS idx_api_idempotency_keys_key
ON api_idempotency_keys(idempotency_key);

-- Index for workspace lookup
CREATE INDEX IF NOT EXISTS idx_api_idempotency_keys_workspace
ON api_idempotency_keys(workspace_id);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_api_idempotency_keys_expires
ON api_idempotency_keys(expires_at);

-- Enable RLS
ALTER TABLE api_idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Users can only access their workspace's keys
CREATE POLICY "Workspace isolation" ON api_idempotency_keys
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "Service role full access" ON api_idempotency_keys
  FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up expired keys
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM api_idempotency_keys
  WHERE expires_at < NOW();

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE api_idempotency_keys IS
'Tracks processed API requests to prevent duplicate operations.
Idempotency keys are client-generated UUIDs sent with requests.
Keys expire after 24 hours.';

COMMENT ON COLUMN api_idempotency_keys.idempotency_key IS
'Client-generated UUID sent with request. Must be unique within 24-hour window.';

COMMENT ON COLUMN api_idempotency_keys.request_hash IS
'Hash of request body to validate request hasn''t changed for same idempotency key.';

COMMENT ON COLUMN api_idempotency_keys.response_data IS
'Cached response to return for duplicate requests with same idempotency key.';

COMMENT ON COLUMN api_idempotency_keys.status IS
'Request status: processing (in-flight), completed (success), failed (error).';

COMMENT ON FUNCTION cleanup_expired_idempotency_keys IS
'Removes expired idempotency keys (older than 24 hours). Run periodically.';
