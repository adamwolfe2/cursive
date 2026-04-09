-- webhook_events table for Stripe webhook idempotency + audit trail.
--
-- Code in src/app/api/webhooks/stripe/route.ts references this table for
-- duplicate detection and processing tracking, but the table was never
-- created in production. Without it, every duplicate Stripe webhook gets
-- reprocessed (since the dedup query returns count:null on missing tables).
--
-- Schema reverse-engineered from the columns the Stripe handler reads/writes:
--   - stripe_event_id (unique, dedup key)
--   - event_type
--   - payload (full Stripe event JSON for debugging)
--   - processed_at
--   - processing_duration_ms
--   - error_message
--   - resource_id (e.g. credit_purchase_id, purchase_id)
--
-- Distinct from processed_webhook_events (used by AL pixel webhook for a
-- different dedup pattern) — that's a separate table with a different schema.

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Stripe-specific identifiers
  stripe_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,

  -- Full payload for debugging / replay
  payload JSONB,

  -- Processing tracking
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  processing_duration_ms INTEGER,
  error_message TEXT,

  -- Resource the event acted on (e.g. credit purchase id, lead purchase id)
  resource_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Idempotency: one row per stripe_event_id (allows the race-condition
  -- handling in the Stripe handler to detect 23505 unique violations)
  CONSTRAINT webhook_events_stripe_event_id_unique UNIQUE (stripe_event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON webhook_events(processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_error_filtered ON webhook_events(processed_at DESC) WHERE error_message IS NOT NULL;

-- Service role only (admin client writes from webhook handlers)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role webhook_events" ON webhook_events;
CREATE POLICY "Service role webhook_events" ON webhook_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE webhook_events IS 'Stripe webhook idempotency + processing audit. One row per stripe_event_id.';
