-- ================================================
-- Affiliate launch blockers — DB backstops
-- Created: 2026-06-12
--
-- Companion to the application-level fixes for the pre-launch critical sweep:
--   B2  Self-referral perpetual kickback  → BEFORE-INSERT/UPDATE trigger that
--       rejects attributing a partner to their own email / auth user / workspace,
--       plus a one-time cleanup of any pre-existing self-referral rows.
--   B3  Clawback cash reversal            → add a 'reversed' commission status for
--       rows whose cash was pulled back via transfers.createReversal (so they are
--       not also netted against a future payout).
--
-- B4 (claim-before-transfer) is migration-free: it reuses the existing
-- stripe_transfer_id column as an atomic claim marker.
-- ================================================

-- ── 1. Allow the 'reversed' commission status (B3) ──────────────────
ALTER TABLE affiliate_commissions DROP CONSTRAINT IF EXISTS affiliate_commissions_status_check;
ALTER TABLE affiliate_commissions
  ADD CONSTRAINT affiliate_commissions_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'reversed'));

-- ── 2. Self-referral rejection trigger (B2) ─────────────────────────
-- Authoritative backstop behind the attribution-time application guards. Rejects
-- any referral whose referred party IS the affiliate themselves, by ANY identity
-- dimension: email, linked auth user, or owned workspace.
CREATE OR REPLACE FUNCTION affiliate_reject_self_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aff_email     TEXT;
  v_aff_user_id   TEXT;
  v_aff_workspace UUID;
BEGIN
  SELECT lower(email), user_id INTO v_aff_email, v_aff_user_id
  FROM affiliates WHERE id = NEW.affiliate_id;

  -- Email match (case-insensitive)
  IF NEW.referred_email IS NOT NULL AND v_aff_email IS NOT NULL
     AND lower(NEW.referred_email) = v_aff_email THEN
    RAISE EXCEPTION 'self-referral blocked (email) for affiliate %', NEW.affiliate_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- Auth user match
  IF NEW.referred_user_id IS NOT NULL AND v_aff_user_id IS NOT NULL
     AND NEW.referred_user_id = v_aff_user_id THEN
    RAISE EXCEPTION 'self-referral blocked (user) for affiliate %', NEW.affiliate_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- Owned-workspace match
  IF NEW.workspace_id IS NOT NULL AND v_aff_user_id IS NOT NULL THEN
    SELECT workspace_id INTO v_aff_workspace
    FROM users WHERE auth_user_id = v_aff_user_id LIMIT 1;
    IF v_aff_workspace IS NOT NULL AND NEW.workspace_id = v_aff_workspace THEN
      RAISE EXCEPTION 'self-referral blocked (workspace) for affiliate %', NEW.affiliate_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_affiliate_reject_self_referral ON affiliate_referrals;
CREATE TRIGGER trg_affiliate_reject_self_referral
  BEFORE INSERT OR UPDATE OF referred_email, referred_user_id, workspace_id, affiliate_id
  ON affiliate_referrals
  FOR EACH ROW
  EXECUTE FUNCTION affiliate_reject_self_referral();

-- ── 3. One-time cleanup of any pre-existing self-referral rows (B2) ──
-- The reusable predicate (a referral that is its own affiliate) is repeated below
-- because Postgres CTEs cannot span multiple statements.

-- 3a. Void any PENDING commissions on self-referrals — never pay them out.
UPDATE affiliate_commissions c
SET status = 'failed'
WHERE c.commission_amount > 0
  AND c.status = 'pending'
  AND c.referral_id IN (
    SELECT r.id
    FROM affiliate_referrals r
    JOIN affiliates a ON a.id = r.affiliate_id
    LEFT JOIN users u ON u.auth_user_id = a.user_id
    WHERE (r.referred_email IS NOT NULL AND lower(r.referred_email) = lower(a.email))
       OR (r.referred_user_id IS NOT NULL AND r.referred_user_id = a.user_id)
       OR (r.workspace_id IS NOT NULL AND r.workspace_id = u.workspace_id)
  );

-- 3b. Surface any PAID self-referral commissions for manual cash clawback.
--     (We do NOT auto-reverse historical cash from a migration.)
DO $$
DECLARE
  v_paid INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_paid
  FROM affiliate_commissions c
  WHERE c.commission_amount > 0
    AND c.status = 'paid'
    AND c.referral_id IN (
      SELECT r.id
      FROM affiliate_referrals r
      JOIN affiliates a ON a.id = r.affiliate_id
      LEFT JOIN users u ON u.auth_user_id = a.user_id
      WHERE (r.referred_email IS NOT NULL AND lower(r.referred_email) = lower(a.email))
         OR (r.referred_user_id IS NOT NULL AND r.referred_user_id = a.user_id)
         OR (r.workspace_id IS NOT NULL AND r.workspace_id = u.workspace_id)
    );
  IF v_paid > 0 THEN
    RAISE WARNING 'MANUAL REVIEW REQUIRED: % paid self-referral commission(s) need manual cash clawback', v_paid;
  END IF;
END $$;

-- 3c. Churn the self-referral referrals so they stop matching future renewals.
UPDATE affiliate_referrals r
SET status = 'churned'
WHERE r.status <> 'churned'
  AND r.id IN (
    SELECT r2.id
    FROM affiliate_referrals r2
    JOIN affiliates a ON a.id = r2.affiliate_id
    LEFT JOIN users u ON u.auth_user_id = a.user_id
    WHERE (r2.referred_email IS NOT NULL AND lower(r2.referred_email) = lower(a.email))
       OR (r2.referred_user_id IS NOT NULL AND r2.referred_user_id = a.user_id)
       OR (r2.workspace_id IS NOT NULL AND r2.workspace_id = u.workspace_id)
  );
