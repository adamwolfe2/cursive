-- =====================================================
-- ROLLBACK: Phase 3 - Webhook Idempotency
-- Reverses: 20260213_webhook_idempotency.sql
-- Date: 2026-02-13
-- =====================================================

-- Drop the webhook_events table
DROP TABLE IF EXISTS webhook_events CASCADE;

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================

-- NOTE: This removes webhook event tracking and idempotency protection.
-- Duplicate webhook processing may occur after rollback.
-- Historical webhook event data will be lost.
