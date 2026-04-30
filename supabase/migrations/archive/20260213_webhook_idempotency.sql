-- =====================================================
-- Phase 3: Error Handling & Validation
-- Migration: Webhook Idempotency Table
-- Date: 2026-02-13
-- =====================================================

-- Purpose: Prevent duplicate webhook processing
-- Critical for financial operations - ensures webhooks are processed exactly once
-- Prevents race conditions and duplicate charges/credits

-- =====================================================
-- 1. CREATE WEBHOOK EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Webhook identifiers
  stripe_event_id TEXT UNIQUE NOT NULL, -- Stripe's unique event ID
  event_type TEXT NOT NULL, -- e.g., 'checkout.session.completed'

  -- Processing metadata
  resource_id TEXT, -- Related resource (purchase_id, subscription_id, etc.)
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  processing_duration_ms INTEGER, -- How long processing took

  -- Error tracking
  error_message TEXT, -- If processing failed
  retry_count INTEGER DEFAULT 0,

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Webhook payload (for debugging)
  payload JSONB -- Store full webhook data for troubleshooting
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

-- Primary lookup - check if event already processed
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_stripe_id
  ON webhook_events(stripe_event_id);

-- Query by event type for monitoring
CREATE INDEX IF NOT EXISTS idx_webhook_events_type
  ON webhook_events(event_type);

-- Query by resource for troubleshooting
CREATE INDEX IF NOT EXISTS idx_webhook_events_resource
  ON webhook_events(resource_id)
  WHERE resource_id IS NOT NULL;

-- Query recent events
CREATE INDEX IF NOT EXISTS idx_webhook_events_created
  ON webhook_events(created_at DESC);

-- Find failed events for retry
CREATE INDEX IF NOT EXISTS idx_webhook_events_failed
  ON webhook_events(processed_at)
  WHERE error_message IS NOT NULL;

-- =====================================================
-- 3. GRANT PERMISSIONS
-- =====================================================

-- Service role needs to insert/query webhook events
GRANT SELECT, INSERT, UPDATE ON webhook_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE webhook_events_id_seq TO service_role;

-- Authenticated users should not access this table
-- (webhooks are processed server-side only)

-- =====================================================
-- 4. CREATE CLEANUP FUNCTION
-- =====================================================

-- Function to clean up old webhook events (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_events
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND error_message IS NULL; -- Keep failed events longer for debugging

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION cleanup_old_webhook_events() TO service_role;

-- =====================================================
-- 5. CREATE HELPER FUNCTION TO CHECK IDEMPOTENCY
-- =====================================================

CREATE OR REPLACE FUNCTION check_webhook_processed(p_stripe_event_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM webhook_events
    WHERE stripe_event_id = p_stripe_event_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION check_webhook_processed(TEXT) TO service_role;

-- =====================================================
-- VERIFICATION QUERIES (commented out)
-- =====================================================

-- Check for duplicate events:
-- SELECT stripe_event_id, COUNT(*) as count
-- FROM webhook_events
-- GROUP BY stripe_event_id
-- HAVING COUNT(*) > 1;

-- View recent webhook activity:
-- SELECT event_type, COUNT(*) as count,
--        AVG(processing_duration_ms) as avg_duration_ms,
--        COUNT(*) FILTER (WHERE error_message IS NOT NULL) as error_count
-- FROM webhook_events
-- WHERE created_at > NOW() - INTERVAL '24 hours'
-- GROUP BY event_type
-- ORDER BY count DESC;

-- Find events that took a long time to process:
-- SELECT stripe_event_id, event_type, processing_duration_ms, created_at
-- FROM webhook_events
-- WHERE processing_duration_ms > 5000 -- More than 5 seconds
-- ORDER BY processing_duration_ms DESC
-- LIMIT 20;
