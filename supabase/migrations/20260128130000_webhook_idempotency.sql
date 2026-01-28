-- Migration: Webhook Idempotency and Stripe Payment Enhancements
-- Prevents duplicate webhook processing and enables direct Stripe payments for leads

-- Create table to track processed webhook events
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_stripe_id
ON processed_webhook_events(stripe_event_id);

-- Auto-cleanup old events (keep 30 days)
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_created
ON processed_webhook_events(created_at);

-- Add stripe_session_id to marketplace_purchases
ALTER TABLE marketplace_purchases
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);

-- Add index for session lookup
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_stripe_session
ON marketplace_purchases(stripe_session_id)
WHERE stripe_session_id IS NOT NULL;

-- Enable RLS on processed_webhook_events (admin only)
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only admins/service role can access
CREATE POLICY "Service role only access" ON processed_webhook_events
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Comment for documentation
COMMENT ON TABLE processed_webhook_events IS
'Tracks processed Stripe webhook events to prevent duplicate processing.
Used for idempotency in webhook handlers.';

COMMENT ON COLUMN processed_webhook_events.stripe_event_id IS
'Unique Stripe event ID (e.g., evt_xxxxx)';

-- Create function to clean up old webhook events
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM processed_webhook_events
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Comment on cleanup function
COMMENT ON FUNCTION cleanup_old_webhook_events IS
'Removes processed webhook events older than 30 days. Run periodically to manage table size.';
