-- Migration: Webhook Retry Queue
-- Stores failed webhooks for retry with exponential backoff

-- Create webhook retry queue table
CREATE TABLE IF NOT EXISTS webhook_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ NOT NULL,
  last_error TEXT,
  last_attempt_at TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);

-- Index for processing queue (ordered by next_retry_at)
CREATE INDEX IF NOT EXISTS idx_webhook_retry_queue_next_retry
ON webhook_retry_queue(next_retry_at)
WHERE status = 'pending';

-- Index for status lookup
CREATE INDEX IF NOT EXISTS idx_webhook_retry_queue_status
ON webhook_retry_queue(status);

-- Index for event lookup
CREATE INDEX IF NOT EXISTS idx_webhook_retry_queue_event
ON webhook_retry_queue(stripe_event_id);

-- Enable RLS
ALTER TABLE webhook_retry_queue ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access" ON webhook_retry_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Admins can view
CREATE POLICY "Admins can view" ON webhook_retry_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Function to calculate next retry time with exponential backoff
CREATE OR REPLACE FUNCTION calculate_webhook_retry_time(
  p_retry_count INTEGER
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_delay_minutes INTEGER;
BEGIN
  -- Exponential backoff: 1min, 5min, 15min, 1hr, 6hr
  v_delay_minutes := CASE p_retry_count
    WHEN 0 THEN 1      -- 1 minute
    WHEN 1 THEN 5      -- 5 minutes
    WHEN 2 THEN 15     -- 15 minutes
    WHEN 3 THEN 60     -- 1 hour
    WHEN 4 THEN 360    -- 6 hours
    ELSE 1440          -- 24 hours (fallback)
  END;

  RETURN NOW() + (v_delay_minutes || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to add webhook to retry queue
CREATE OR REPLACE FUNCTION queue_webhook_retry(
  p_stripe_event_id VARCHAR(255),
  p_event_type VARCHAR(100),
  p_event_data JSONB,
  p_error TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
  v_retry_count INTEGER;
BEGIN
  -- Check if webhook already in queue
  SELECT id, retry_count INTO v_queue_id, v_retry_count
  FROM webhook_retry_queue
  WHERE stripe_event_id = p_stripe_event_id
  AND status IN ('pending', 'processing');

  IF v_queue_id IS NOT NULL THEN
    -- Update existing queue entry
    UPDATE webhook_retry_queue
    SET
      retry_count = retry_count + 1,
      next_retry_at = calculate_webhook_retry_time(retry_count + 1),
      last_error = p_error,
      last_attempt_at = NOW(),
      status = CASE
        WHEN retry_count + 1 >= max_retries THEN 'failed'
        ELSE 'pending'
      END,
      failed_at = CASE
        WHEN retry_count + 1 >= max_retries THEN NOW()
        ELSE NULL
      END
    WHERE id = v_queue_id
    RETURNING id INTO v_queue_id;
  ELSE
    -- Insert new queue entry
    INSERT INTO webhook_retry_queue (
      stripe_event_id,
      event_type,
      event_data,
      retry_count,
      next_retry_at,
      last_error,
      last_attempt_at,
      status
    ) VALUES (
      p_stripe_event_id,
      p_event_type,
      p_event_data,
      0,
      calculate_webhook_retry_time(0),
      p_error,
      NOW(),
      'pending'
    )
    RETURNING id INTO v_queue_id;
  END IF;

  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get webhooks ready for retry
CREATE OR REPLACE FUNCTION get_webhooks_ready_for_retry(
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  id UUID,
  stripe_event_id VARCHAR(255),
  event_type VARCHAR(100),
  event_data JSONB,
  retry_count INTEGER
) AS $$
BEGIN
  -- Mark webhooks as processing
  UPDATE webhook_retry_queue
  SET
    status = 'processing',
    last_attempt_at = NOW()
  WHERE id IN (
    SELECT wrq.id
    FROM webhook_retry_queue wrq
    WHERE wrq.status = 'pending'
    AND wrq.next_retry_at <= NOW()
    ORDER BY wrq.next_retry_at ASC
    LIMIT p_limit
  )
  RETURNING
    webhook_retry_queue.id,
    webhook_retry_queue.stripe_event_id,
    webhook_retry_queue.event_type,
    webhook_retry_queue.event_data,
    webhook_retry_queue.retry_count
  INTO
    id,
    stripe_event_id,
    event_type,
    event_data,
    retry_count;

  RETURN QUERY
  SELECT * FROM (VALUES (id, stripe_event_id, event_type, event_data, retry_count)) AS t;
END;
$$ LANGUAGE plpgsql;

-- Function to mark webhook retry as completed
CREATE OR REPLACE FUNCTION complete_webhook_retry(
  p_queue_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE webhook_retry_queue
  SET
    status = 'completed',
    completed_at = NOW()
  WHERE id = p_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE webhook_retry_queue IS
'Queue for failed Stripe webhook events that need retry.
Uses exponential backoff: 1min, 5min, 15min, 1hr, 6hr.
After 5 failed attempts, webhooks are marked as permanently failed.';

COMMENT ON COLUMN webhook_retry_queue.stripe_event_id IS
'Stripe event ID (e.g., evt_xxxxx)';

COMMENT ON COLUMN webhook_retry_queue.event_data IS
'Full Stripe event payload for retry';

COMMENT ON COLUMN webhook_retry_queue.retry_count IS
'Number of retry attempts (0-5)';

COMMENT ON COLUMN webhook_retry_queue.next_retry_at IS
'Timestamp when next retry should be attempted';

COMMENT ON COLUMN webhook_retry_queue.status IS
'Queue status: pending (waiting), processing (in progress), completed (success), failed (gave up)';

COMMENT ON FUNCTION calculate_webhook_retry_time IS
'Calculates next retry time using exponential backoff based on retry count';

COMMENT ON FUNCTION queue_webhook_retry IS
'Adds a failed webhook to the retry queue or increments retry count if already queued';

COMMENT ON FUNCTION get_webhooks_ready_for_retry IS
'Returns webhooks ready for retry and marks them as processing';

COMMENT ON FUNCTION complete_webhook_retry IS
'Marks a webhook retry as successfully completed';
