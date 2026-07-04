-- ============================================================================
-- Reseller RPC Lockdown + Delivery Taxonomy (forward migration)
-- ============================================================================
-- Hardens the reseller money-path RPCs added in 20260701000000_reseller_layer.sql
-- and fixes the delivery-outcome rollup taxonomy. Two concerns:
--
--   1. [P1] reseller_consume_delivery / reseller_record_delivery are SECURITY
--      DEFINER with the Postgres/Supabase default EXECUTE grant to PUBLIC and no
--      pinned search_path. Because SECURITY DEFINER bypasses RLS and Supabase
--      exposes public-schema functions at /rest/v1/rpc/, anyone holding the anon
--      key + a reseller/pixel UUID could burn a partner's cap or inflate billing
--      counters. This migration REVOKEs EXECUTE from PUBLIC/anon/authenticated,
--      GRANTs only to service_role, and pins search_path = public on both.
--      (Matches 20260318000001_atomic_credit_purchase.sql:72-73 + README.md:86.)
--
--   2. [P2] Delivery skips for inactive/suspended pixels were recorded as
--      'skipped_cap' and 'no_destination' was invisible in the daily rollup.
--      This adds distinct statuses + rollup columns and re-buckets them in
--      reseller_record_delivery so partner/admin usage reflects reality.
--
-- TODO: MUST BE APPLIED MANUALLY to production (Supabase CLI not linked; the
-- Management-API PAT is 403ing). Apply via the dashboard SQL editor or:
--   psql "postgresql://postgres:[DB_PASSWORD]@db.lrbftjspiiakfnydxbgk.supabase.co:5432/postgres" \
--     -f supabase/migrations/20260703000000_reseller_rpc_lockdown.sql
-- ============================================================================

-- ─── 1. Lock down reseller_consume_delivery (unchanged body, pin search_path) ─
ALTER FUNCTION reseller_consume_delivery(UUID, UUID) SET search_path = public;

REVOKE EXECUTE ON FUNCTION reseller_consume_delivery(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION reseller_consume_delivery(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION reseller_consume_delivery(UUID, UUID) FROM authenticated;
GRANT  EXECUTE ON FUNCTION reseller_consume_delivery(UUID, UUID) TO service_role;

-- ─── 2. Delivery taxonomy: new statuses + rollup columns ─────────────────────
-- Extend the per-lead audit status CHECK so inactive/suspended skips are
-- distinguishable from real cap skips (the constraint is auto-named by Postgres).
ALTER TABLE reseller_lead_deliveries
  DROP CONSTRAINT IF EXISTS reseller_lead_deliveries_status_check;
ALTER TABLE reseller_lead_deliveries
  ADD CONSTRAINT reseller_lead_deliveries_status_check
  CHECK (status IN (
    'delivered', 'throttled', 'skipped_cap', 'failed', 'no_destination',
    'skipped_inactive', 'skipped_suspended'
  ));

-- Add rollup buckets so these outcomes are visible in reseller_usage_daily
-- instead of being mis-counted as leads_skipped_cap (or invisible entirely).
ALTER TABLE reseller_usage_daily
  ADD COLUMN IF NOT EXISTS leads_skipped_inactive  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE reseller_usage_daily
  ADD COLUMN IF NOT EXISTS leads_skipped_suspended INTEGER NOT NULL DEFAULT 0;
ALTER TABLE reseller_usage_daily
  ADD COLUMN IF NOT EXISTS leads_no_destination    INTEGER NOT NULL DEFAULT 0;

-- ─── 3. Re-bucket reseller_record_delivery (adds search_path pin + new cols) ──
-- p_outcome: 'delivered' | 'throttled' | 'skipped_cap' | 'failed'
--          | 'no_destination' | 'skipped_inactive' | 'skipped_suspended'
CREATE OR REPLACE FUNCTION reseller_record_delivery(
  p_reseller_id       UUID,
  p_reseller_pixel_id UUID,
  p_outcome           TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO reseller_usage_daily (
    reseller_id, reseller_pixel_id, usage_date,
    leads_delivered, leads_throttled, leads_skipped_cap, leads_failed,
    leads_skipped_inactive, leads_skipped_suspended, leads_no_destination
  ) VALUES (
    p_reseller_id, p_reseller_pixel_id, now()::date,
    CASE WHEN p_outcome IN ('delivered', 'throttled') THEN 1 ELSE 0 END,
    CASE WHEN p_outcome = 'throttled'         THEN 1 ELSE 0 END,
    CASE WHEN p_outcome = 'skipped_cap'       THEN 1 ELSE 0 END,
    CASE WHEN p_outcome = 'failed'            THEN 1 ELSE 0 END,
    CASE WHEN p_outcome = 'skipped_inactive'  THEN 1 ELSE 0 END,
    CASE WHEN p_outcome = 'skipped_suspended' THEN 1 ELSE 0 END,
    CASE WHEN p_outcome = 'no_destination'    THEN 1 ELSE 0 END
  )
  ON CONFLICT (reseller_id, reseller_pixel_id, usage_date) DO UPDATE SET
    leads_delivered         = reseller_usage_daily.leads_delivered         + EXCLUDED.leads_delivered,
    leads_throttled         = reseller_usage_daily.leads_throttled         + EXCLUDED.leads_throttled,
    leads_skipped_cap       = reseller_usage_daily.leads_skipped_cap       + EXCLUDED.leads_skipped_cap,
    leads_failed            = reseller_usage_daily.leads_failed            + EXCLUDED.leads_failed,
    leads_skipped_inactive  = reseller_usage_daily.leads_skipped_inactive  + EXCLUDED.leads_skipped_inactive,
    leads_skipped_suspended = reseller_usage_daily.leads_skipped_suspended + EXCLUDED.leads_skipped_suspended,
    leads_no_destination    = reseller_usage_daily.leads_no_destination    + EXCLUDED.leads_no_destination;
END;
$$;

-- Re-apply least-privilege after CREATE OR REPLACE (default privileges re-grant
-- EXECUTE to PUBLIC on every replace — see README.md:83-86).
REVOKE EXECUTE ON FUNCTION reseller_record_delivery(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION reseller_record_delivery(UUID, UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION reseller_record_delivery(UUID, UUID, TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION reseller_record_delivery(UUID, UUID, TEXT) TO service_role;
