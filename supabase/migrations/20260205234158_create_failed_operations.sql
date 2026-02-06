-- Create failed_operations table for dead letter queue
-- This table stores operations that failed after all retry attempts
-- Allows admin to review, manually retry, and track system reliability

CREATE TABLE IF NOT EXISTS failed_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Operation metadata
  operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('email', 'webhook', 'job')),
  operation_id UUID, -- Reference to purchase ID, webhook ID, job ID, etc.

  -- Failure details
  event_data JSONB NOT NULL, -- Original event data for retry
  error_message TEXT NOT NULL,
  error_stack TEXT,

  -- Retry tracking
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Resolution tracking
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id)
);

-- Indexes for common queries
CREATE INDEX idx_failed_ops_type_created ON failed_operations(operation_type, created_at DESC);
CREATE INDEX idx_failed_ops_unresolved ON failed_operations(created_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX idx_failed_ops_operation_id ON failed_operations(operation_id) WHERE operation_id IS NOT NULL;

-- RLS: Only admins can access failed operations
ALTER TABLE failed_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin access to failed operations" ON failed_operations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add comments
COMMENT ON TABLE failed_operations IS 'Dead letter queue for operations that failed after all retry attempts';
COMMENT ON COLUMN failed_operations.operation_type IS 'Type of operation: email, webhook, or job';
COMMENT ON COLUMN failed_operations.operation_id IS 'Reference ID for the failed operation (purchase_id, etc)';
COMMENT ON COLUMN failed_operations.event_data IS 'Original event data - can be used to retry the operation';
COMMENT ON COLUMN failed_operations.retry_count IS 'Number of times this operation has been retried';
COMMENT ON COLUMN failed_operations.resolved_at IS 'When the issue was resolved (either by successful retry or manual resolution)';
COMMENT ON COLUMN failed_operations.resolved_by IS 'Admin user who resolved the issue';
