-- Migration: Atomic Credit Purchase Completion
-- Created: 2026-03-18
-- Description: Creates an atomic RPC that marks a credit purchase as completed
-- AND adds credits in a single transaction, preventing double-credit or
-- lost-credit race conditions on Stripe webhook retries.

CREATE OR REPLACE FUNCTION complete_stripe_credit_purchase(
  p_credit_purchase_id UUID,
  p_workspace_id UUID,
  p_credits INTEGER,
  p_source VARCHAR DEFAULT 'purchase'
) RETURNS TABLE (
  already_completed BOOLEAN,
  success BOOLEAN,
  new_balance INTEGER
) AS $$
DECLARE
  v_status TEXT;
  v_new_balance INTEGER;
BEGIN
  -- 1. Lock and check the purchase record
  SELECT cp.status INTO v_status
  FROM credit_purchases cp
  WHERE cp.id = p_credit_purchase_id
  FOR UPDATE;

  -- Purchase not found
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit purchase % not found', p_credit_purchase_id;
  END IF;

  -- Already completed — idempotent return
  IF v_status = 'completed' THEN
    SELECT wc.balance INTO v_new_balance
    FROM workspace_credits wc
    WHERE wc.workspace_id = p_workspace_id;

    RETURN QUERY SELECT TRUE, TRUE, COALESCE(v_new_balance, 0);
    RETURN;
  END IF;

  -- 2. Mark purchase as completed
  UPDATE credit_purchases
  SET status = 'completed', completed_at = NOW()
  WHERE id = p_credit_purchase_id;

  -- 3. Add credits atomically (upsert workspace_credits)
  INSERT INTO workspace_credits (workspace_id, balance, total_purchased, total_earned)
  VALUES (p_workspace_id, p_credits,
    CASE WHEN p_source = 'purchase' THEN p_credits ELSE 0 END,
    CASE WHEN p_source = 'referral' THEN p_credits ELSE 0 END
  )
  ON CONFLICT (workspace_id) DO UPDATE SET
    balance = workspace_credits.balance + p_credits,
    total_purchased = workspace_credits.total_purchased +
      CASE WHEN p_source = 'purchase' THEN p_credits ELSE 0 END,
    total_earned = workspace_credits.total_earned +
      CASE WHEN p_source = 'referral' THEN p_credits ELSE 0 END,
    updated_at = NOW()
  RETURNING balance INTO v_new_balance;

  RETURN QUERY SELECT FALSE, TRUE, v_new_balance;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION complete_stripe_credit_purchase IS
  'Atomically marks a credit purchase as completed and adds credits to workspace. '
  'Idempotent: returns already_completed=true if purchase was already completed. '
  'Runs in a single transaction to prevent double-credit or lost-credit bugs on webhook retries.';

-- Security: only service_role can call this
REVOKE EXECUTE ON FUNCTION complete_stripe_credit_purchase FROM PUBLIC;
GRANT EXECUTE ON FUNCTION complete_stripe_credit_purchase TO service_role;
