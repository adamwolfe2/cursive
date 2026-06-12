-- ================================================
-- Outbound Partner Program — Commission Ramp + Signable Agreement
-- Created: 2026-06-12
--
-- Re-tunes the affiliate program for OUTBOUND distribution partners:
--   * Ramp commission (15% → 40%) driven by # of CURRENTLY paying referrals
--   * Payment-based "paying" referral state (decoupled from audience-match)
--   * Atomic counter RPCs (race-safe across concurrent Stripe webhooks)
--   * In-portal signable agreement storage (affiliate_agreements)
--
-- Keep affiliate_ramp_rate() in lock-step with src/lib/affiliate/ramp.ts
-- ================================================

-- ── 1. Affiliate counters for the ramp ──────────────────────────────
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS active_paying_referrals   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lifetime_paying_referrals INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_commission_rate   INTEGER NOT NULL DEFAULT 15;

-- ── 2. Referral: payment-based "paying" state + attribution detail ───
ALTER TABLE affiliate_referrals DROP CONSTRAINT IF EXISTS affiliate_referrals_status_check;
ALTER TABLE affiliate_referrals
  ADD CONSTRAINT affiliate_referrals_status_check
  CHECK (status IN ('lead', 'activated', 'paying', 'churned'));

ALTER TABLE affiliate_referrals
  ADD COLUMN IF NOT EXISTS first_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS package_slug  TEXT,
  ADD COLUMN IF NOT EXISTS mrr_amount    INTEGER; -- cents, recurring amount of the referred sub

CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_workspace_status
  ON affiliate_referrals(workspace_id, status);

-- ── 3. Signed agreement storage (in-portal e-signature) ─────────────
CREATE TABLE IF NOT EXISTS affiliate_agreements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id  UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  version       TEXT NOT NULL,
  signer_name   TEXT NOT NULL,
  signer_email  TEXT NOT NULL,
  signature_svg TEXT,            -- drawn signature (SVG path / data URL)
  document_hash TEXT NOT NULL,   -- sha256 of the exact agreement text signed
  signed_ip     TEXT,
  user_agent    TEXT,
  accepted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(affiliate_id, version)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_agreements_affiliate_id
  ON affiliate_agreements(affiliate_id);

ALTER TABLE affiliate_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "affiliates_view_own_agreements" ON affiliate_agreements;
CREATE POLICY "affiliates_view_own_agreements" ON affiliate_agreements
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()::TEXT)
  );

DROP POLICY IF EXISTS "admin_all_affiliate_agreements" ON affiliate_agreements;
CREATE POLICY "admin_all_affiliate_agreements" ON affiliate_agreements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- ── 4. Ramp rate function (mirror of src/lib/affiliate/ramp.ts) ─────
CREATE OR REPLACE FUNCTION affiliate_ramp_rate(p_count INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN COALESCE(p_count, 0) >= 45 THEN 40
    WHEN p_count >= 35 THEN 35
    WHEN p_count >= 25 THEN 30
    WHEN p_count >= 15 THEN 25
    WHEN p_count >= 5  THEN 20
    ELSE 15
  END;
$$;

-- ── 5. Atomic: mark a referral as paying on first payment ───────────
-- Returns the affiliate's new active-paying count + the live rate, plus
-- whether THIS call performed the lead→paying transition (was_first).
-- Race-safe: locks the affiliate row, transitions exactly once.
CREATE OR REPLACE FUNCTION affiliate_mark_paying(
  p_referral_id  UUID,
  p_package_slug TEXT DEFAULT NULL,
  p_mrr_amount   INTEGER DEFAULT NULL
)
RETURNS TABLE(active_paying INTEGER, rate INTEGER, was_first BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_id UUID;
  v_updated      INTEGER := 0;
  v_active       INTEGER := 0;
  v_rate         INTEGER := 15;
BEGIN
  SELECT affiliate_id INTO v_affiliate_id
  FROM affiliate_referrals
  WHERE id = p_referral_id
  FOR UPDATE;

  IF v_affiliate_id IS NULL THEN
    RETURN QUERY SELECT 0, affiliate_ramp_rate(0), FALSE;
    RETURN;
  END IF;

  -- Serialize concurrent invoices for the same affiliate.
  PERFORM 1 FROM affiliates WHERE id = v_affiliate_id FOR UPDATE;

  UPDATE affiliate_referrals
  SET status        = 'paying',
      first_paid_at = COALESCE(first_paid_at, NOW()),
      package_slug  = COALESCE(p_package_slug, package_slug),
      mrr_amount    = COALESCE(p_mrr_amount, mrr_amount),
      activated_at  = COALESCE(activated_at, NOW())
  WHERE id = p_referral_id
    AND status IN ('lead', 'activated');
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    UPDATE affiliates
    SET active_paying_referrals   = active_paying_referrals + 1,
        lifetime_paying_referrals = lifetime_paying_referrals + 1
    WHERE id = v_affiliate_id;
  END IF;

  SELECT active_paying_referrals INTO v_active FROM affiliates WHERE id = v_affiliate_id;
  v_rate := affiliate_ramp_rate(v_active);

  UPDATE affiliates SET current_commission_rate = v_rate WHERE id = v_affiliate_id;

  RETURN QUERY SELECT v_active, v_rate, (v_updated > 0);
END;
$$;

-- ── 6. Atomic: record churn for a workspace's referrals ─────────────
CREATE OR REPLACE FUNCTION affiliate_record_churn(p_workspace_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, affiliate_id
    FROM affiliate_referrals
    WHERE workspace_id = p_workspace_id AND status = 'paying'
    FOR UPDATE
  LOOP
    UPDATE affiliate_referrals SET status = 'churned' WHERE id = r.id;

    UPDATE affiliates
    SET active_paying_referrals = GREATEST(0, active_paying_referrals - 1)
    WHERE id = r.affiliate_id;

    UPDATE affiliates
    SET current_commission_rate = affiliate_ramp_rate(active_paying_referrals)
    WHERE id = r.affiliate_id;
  END LOOP;

  -- Non-paying leads for this workspace also become churned (no counter change).
  UPDATE affiliate_referrals
  SET status = 'churned'
  WHERE workspace_id = p_workspace_id AND status IN ('lead', 'activated');
END;
$$;

-- ── 7. Deterministic funnel attribution ────────────────────────────
-- Funnel buyers have no workspace at purchase time, so we stamp the partner
-- code (from checkout metadata) onto the order. Renewals/churn then attribute
-- to the exact partner who drove the sale — never an ambiguous email match.
ALTER TABLE funnel_orders
  ADD COLUMN IF NOT EXISTS affiliate_partner_code TEXT;

-- ── 8. Atomic earnings mutation (race-safe; never read-modify-write) ─
CREATE OR REPLACE FUNCTION affiliate_add_earnings(p_affiliate_id UUID, p_delta INTEGER)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE affiliates
  SET total_earnings = GREATEST(0, total_earnings + p_delta)
  WHERE id = p_affiliate_id;
$$;

-- ── 9. Atomic churn for a single referral (funnel email fallback) ────
CREATE OR REPLACE FUNCTION affiliate_churn_referral(p_referral_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_id UUID;
  v_updated      INTEGER := 0;
BEGIN
  SELECT affiliate_id INTO v_affiliate_id
  FROM affiliate_referrals
  WHERE id = p_referral_id
  FOR UPDATE;

  IF v_affiliate_id IS NULL THEN RETURN; END IF;

  PERFORM 1 FROM affiliates WHERE id = v_affiliate_id FOR UPDATE;

  UPDATE affiliate_referrals
  SET status = 'churned'
  WHERE id = p_referral_id AND status = 'paying';
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    UPDATE affiliates
    SET active_paying_referrals = GREATEST(0, active_paying_referrals - 1)
    WHERE id = v_affiliate_id;
    UPDATE affiliates
    SET current_commission_rate = affiliate_ramp_rate(active_paying_referrals)
    WHERE id = v_affiliate_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION affiliate_ramp_rate(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION affiliate_mark_paying(UUID, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION affiliate_record_churn(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION affiliate_add_earnings(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION affiliate_churn_referral(UUID) TO service_role;
