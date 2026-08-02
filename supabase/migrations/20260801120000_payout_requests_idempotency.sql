-- ============================================================================
-- payout_requests: the columns the weekly payout cron has always written
-- ============================================================================
--
-- `weeklyPartnerPayouts` (src/inngest/functions/partner-payouts.ts, live and
-- registered in the Inngest route) reads and writes `idempotency_key` and
-- `stripe_transfer_id` on payout_requests. Neither column exists. PostgREST
-- rejects both statements, and supabase-js RESOLVES rather than rejects, so:
--
--   * the weekly duplicate-payout guard never matched anything — it is inert,
--     and Stripe's own 24h idempotency key is the only protection against
--     paying a partner twice;
--   * no payout_requests row was ever created by the cron, so money left the
--     platform with no record on this table.
--
-- This mirrors the same pair already present on the `payouts` table
-- (20260128120000_payout_enhancements.sql), including the partial unique index,
-- so the two payout tables agree on what an idempotency key means.
--
-- NOT APPLIED. Run the verification block at the bottom first.

ALTER TABLE payout_requests
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

ALTER TABLE payout_requests
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;

-- Third missing column, same function: the failed-transfer branch writes
-- `failure_reason`. The table only ever had `rejection_reason` (the manual
-- review flow), so failed automated payouts recorded nothing at all.
ALTER TABLE payout_requests
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Partial: manual payout requests (the request/approve flow) carry no key.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payout_requests_idempotency_key
  ON payout_requests(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- The cron looks up by (partner_id, idempotency_key, status).
CREATE INDEX IF NOT EXISTS idx_payout_requests_partner_idempotency
  ON payout_requests(partner_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMENT ON COLUMN payout_requests.idempotency_key IS
  'Weekly cron key, payout-<partner_id>-<week_start>. Also passed to Stripe as the transfer idempotency key. NULL for manual requests.';

COMMENT ON COLUMN payout_requests.stripe_transfer_id IS
  'Stripe Transfer id for automated weekly payouts. Manual payouts use stripe_payout_id.';

COMMENT ON COLUMN payout_requests.failure_reason IS
  'Why an automated transfer failed. Manual rejections use rejection_reason.';

-- ============================================================================
-- Before applying, confirm what is actually out there
-- ============================================================================
--
-- 1. Are the columns genuinely absent (this migration is a no-op if not)?
--
--    SELECT column_name, data_type, is_nullable
--    FROM information_schema.columns
--    WHERE table_name = 'payout_requests'
--    ORDER BY ordinal_position;
--
-- 2. UNRESOLVED, needs a live DB — is workspace_id NOT NULL here?
--
--    20260213_critical_security_fixes.sql (archived) adds workspace_id to
--    payout_requests and then makes it NOT NULL. The cron's insert does not
--    supply it, which would be a further independent reason the write fails.
--
--    But that same migration backfills from `partners.workspace_id`, and NO
--    migration in this repo ever adds workspace_id to `partners`. So either
--    the column was added out of band, or that migration never ran — and if
--    it never ran, payout_requests has no workspace_id constraint at all and
--    the missing columns above are the whole story.
--
--    Deliberately not guessing: adding a partners.workspace_id lookup to the
--    cron would fail outright if the column does not exist. Settle it first:
--
--    SELECT table_name, column_name, is_nullable
--    FROM information_schema.columns
--    WHERE column_name = 'workspace_id'
--      AND table_name IN ('partners', 'payout_requests');
--
--    If payout_requests.workspace_id is NOT NULL, the cron insert needs the
--    value threaded through getPartnersEligibleForPayout() before the weekly
--    payout can write a row at all.
--
-- 3. Would the unique index build? Any pre-existing duplicate keys must be
--    resolved first (there should be none — nothing has ever written this
--    column — but check rather than assume):
--
--    SELECT idempotency_key, COUNT(*) FROM payout_requests
--    WHERE idempotency_key IS NOT NULL
--    GROUP BY idempotency_key HAVING COUNT(*) > 1;
--
-- 4. Reconciliation, separate from this migration: weekly transfers that
--    succeeded at Stripe have no row here. Compare Stripe transfers with
--    metadata.payout_type = 'weekly' against payout_requests before trusting
--    any payout total.
