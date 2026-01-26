-- Error Handling & Retry Logic
-- Failed job tracking and retry mechanisms

-- Failed jobs table for tracking and retrying
CREATE TABLE IF NOT EXISTS failed_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Job identification
  job_type VARCHAR(100) NOT NULL, -- email_send, enrichment, webhook, etc.
  job_id VARCHAR(255), -- Original job ID (e.g., Inngest function ID)
  job_name VARCHAR(255),

  -- Related entities
  related_type VARCHAR(50), -- campaign, lead, email_send, etc.
  related_id UUID,

  -- Error details
  error_type VARCHAR(100), -- timeout, rate_limit, api_error, validation, etc.
  error_code VARCHAR(50),
  error_message TEXT NOT NULL,
  error_stack TEXT,

  -- Job payload (for retry)
  payload JSONB DEFAULT '{}',

  -- Retry tracking
  attempts INTEGER DEFAULT 1,
  max_attempts INTEGER DEFAULT 5,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  next_retry_at TIMESTAMPTZ,

  -- Status
  status VARCHAR(50) DEFAULT 'failed' CHECK (status IN ('failed', 'pending_retry', 'retrying', 'resolved', 'abandoned')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID, -- User who resolved it
  resolution_notes TEXT,

  -- Metadata
  context JSONB DEFAULT '{}', -- Additional context about the failure
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System health metrics
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Metric identification
  metric_name VARCHAR(100) NOT NULL, -- api_latency, error_rate, queue_depth, etc.
  metric_type VARCHAR(50) NOT NULL, -- gauge, counter, histogram

  -- Values
  value DECIMAL(20, 6) NOT NULL,
  tags JSONB DEFAULT '{}', -- Additional dimensions

  -- Time
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE failed_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Workspace isolation for failed jobs" ON failed_jobs
  FOR ALL USING (
    workspace_id IS NULL OR
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- System metrics are read-only for authenticated users
CREATE POLICY "Authenticated users can view metrics" ON system_health_metrics
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Function to log a failed job
CREATE OR REPLACE FUNCTION log_failed_job(
  p_job_type VARCHAR(100),
  p_error_message TEXT,
  p_workspace_id UUID DEFAULT NULL,
  p_job_id VARCHAR(255) DEFAULT NULL,
  p_job_name VARCHAR(255) DEFAULT NULL,
  p_related_type VARCHAR(50) DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_error_type VARCHAR(100) DEFAULT 'unknown',
  p_error_code VARCHAR(50) DEFAULT NULL,
  p_error_stack TEXT DEFAULT NULL,
  p_payload JSONB DEFAULT '{}',
  p_max_attempts INTEGER DEFAULT 5,
  p_context JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_id UUID;
  v_next_retry TIMESTAMPTZ;
BEGIN
  -- Calculate next retry with exponential backoff
  -- 1 min, 5 min, 15 min, 30 min, 1 hour
  v_next_retry := NOW() + INTERVAL '1 minute';

  INSERT INTO failed_jobs (
    workspace_id,
    job_type,
    job_id,
    job_name,
    related_type,
    related_id,
    error_type,
    error_code,
    error_message,
    error_stack,
    payload,
    max_attempts,
    next_retry_at,
    status,
    context
  ) VALUES (
    p_workspace_id,
    p_job_type,
    p_job_id,
    p_job_name,
    p_related_type,
    p_related_id,
    p_error_type,
    p_error_code,
    p_error_message,
    p_error_stack,
    p_payload,
    p_max_attempts,
    v_next_retry,
    'pending_retry',
    p_context
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

-- Function to get jobs ready for retry
CREATE OR REPLACE FUNCTION get_jobs_for_retry(p_limit INTEGER DEFAULT 50)
RETURNS TABLE(
  job_id UUID,
  job_type VARCHAR(100),
  payload JSONB,
  attempts INTEGER,
  max_attempts INTEGER,
  workspace_id UUID,
  related_type VARCHAR(50),
  related_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE failed_jobs f
  SET
    status = 'retrying',
    last_attempt_at = NOW(),
    attempts = f.attempts + 1
  WHERE f.id IN (
    SELECT fj.id
    FROM failed_jobs fj
    WHERE fj.status = 'pending_retry'
      AND fj.next_retry_at <= NOW()
      AND fj.attempts < fj.max_attempts
    ORDER BY fj.next_retry_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING
    f.id AS job_id,
    f.job_type,
    f.payload,
    f.attempts,
    f.max_attempts,
    f.workspace_id,
    f.related_type,
    f.related_id;
END;
$$;

-- Function to mark a retry as successful
CREATE OR REPLACE FUNCTION mark_retry_success(p_job_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE failed_jobs
  SET
    status = 'resolved',
    resolved_at = NOW(),
    resolution_notes = 'Resolved via automatic retry'
  WHERE id = p_job_id;
END;
$$;

-- Function to mark a retry as failed
CREATE OR REPLACE FUNCTION mark_retry_failed(
  p_job_id UUID,
  p_error_message TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_attempts INTEGER;
  v_max_attempts INTEGER;
  v_next_retry TIMESTAMPTZ;
BEGIN
  -- Get current attempts
  SELECT attempts, max_attempts INTO v_attempts, v_max_attempts
  FROM failed_jobs WHERE id = p_job_id;

  -- Calculate next retry with exponential backoff
  IF v_attempts >= v_max_attempts THEN
    -- Mark as abandoned
    UPDATE failed_jobs
    SET
      status = 'abandoned',
      error_message = p_error_message,
      resolution_notes = 'Max retry attempts exceeded'
    WHERE id = p_job_id;
  ELSE
    -- Calculate next retry time (exponential backoff)
    v_next_retry := NOW() + (POWER(2, v_attempts) || ' minutes')::INTERVAL;
    IF v_next_retry > NOW() + INTERVAL '1 hour' THEN
      v_next_retry := NOW() + INTERVAL '1 hour';
    END IF;

    UPDATE failed_jobs
    SET
      status = 'pending_retry',
      error_message = p_error_message,
      next_retry_at = v_next_retry
    WHERE id = p_job_id;
  END IF;
END;
$$;

-- Function to get error statistics
CREATE OR REPLACE FUNCTION get_error_stats(
  p_workspace_id UUID DEFAULT NULL,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE(
  error_type VARCHAR(100),
  job_type VARCHAR(100),
  count BIGINT,
  resolved_count BIGINT,
  abandoned_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.error_type,
    f.job_type,
    COUNT(*) AS count,
    COUNT(*) FILTER (WHERE f.status = 'resolved') AS resolved_count,
    COUNT(*) FILTER (WHERE f.status = 'abandoned') AS abandoned_count
  FROM failed_jobs f
  WHERE f.created_at >= NOW() - (p_hours || ' hours')::INTERVAL
    AND (p_workspace_id IS NULL OR f.workspace_id = p_workspace_id)
  GROUP BY f.error_type, f.job_type
  ORDER BY count DESC;
END;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_failed_jobs_workspace ON failed_jobs(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_failed_jobs_retry ON failed_jobs(status, next_retry_at)
  WHERE status = 'pending_retry';
CREATE INDEX IF NOT EXISTS idx_failed_jobs_type ON failed_jobs(job_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_jobs_related ON failed_jobs(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_name ON system_health_metrics(metric_name, recorded_at DESC);

-- Cleanup old resolved jobs (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_failed_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM failed_jobs
  WHERE status IN ('resolved', 'abandoned')
    AND created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Comments
COMMENT ON TABLE failed_jobs IS 'Tracks failed background jobs for retry and monitoring';
COMMENT ON TABLE system_health_metrics IS 'System health and performance metrics';
COMMENT ON FUNCTION log_failed_job IS 'Logs a failed job with automatic retry scheduling';
COMMENT ON FUNCTION get_jobs_for_retry IS 'Gets jobs ready for retry with row locking';
