-- Migration: Fix Critical Payment Race Conditions
-- Created: 2026-02-05
-- Description: Adds atomic database functions to prevent race conditions in:
--   1. Lead purchase validation (SELECT FOR UPDATE locks)
--   2. Credit deduction + lead marking (single transaction)
--   3. Atomic lead purchase completion

-- ============================================================================
-- FUNCTION: Atomically validate and lock leads for purchase
-- ============================================================================
-- Purpose: Prevents race condition where two users can buy the same lead
-- Uses SELECT FOR UPDATE to lock rows during validation
-- Returns locked leads or raises exception if any are unavailable

CREATE OR REPLACE FUNCTION validate_and_lock_leads_for_purchase(
  p_lead_ids UUID[],
  p_buyer_workspace_id UUID
) RETURNS TABLE (
  id UUID,
  marketplace_price DECIMAL(10,4),
  partner_id UUID,
  created_at TIMESTAMPTZ,
  intent_score_calculated INTEGER,
  freshness_score INTEGER
) AS $$
DECLARE
  v_lead_count INTEGER;
  v_requested_count INTEGER;
BEGIN
  -- Get the count of requested leads
  v_requested_count := array_length(p_lead_ids, 1);

  -- Lock and validate leads atomically
  -- This SELECT FOR UPDATE prevents concurrent purchases of same leads
  RETURN QUERY
  SELECT
    l.id,
    l.marketplace_price,
    l.partner_id,
    l.created_at,
    l.intent_score_calculated,
    l.freshness_score
  FROM leads l
  WHERE l.id = ANY(p_lead_ids)
    AND l.marketplace_status = 'available'
    AND l.sold_at IS NULL
    AND l.marketplace_price IS NOT NULL
    AND l.is_marketplace_listed = true
    -- Ensure buyer hasn't already purchased these leads
    AND NOT EXISTS (
      SELECT 1
      FROM marketplace_purchase_items mpi
      JOIN marketplace_purchases mp ON mp.id = mpi.purchase_id
      WHERE mpi.lead_id = l.id
        AND mp.buyer_workspace_id = p_buyer_workspace_id
        AND mp.status IN ('completed', 'pending')
    )
  FOR UPDATE OF l NOWAIT; -- Fail fast if another transaction holds the lock

  -- Verify all requested leads were locked
  GET DIAGNOSTICS v_lead_count = ROW_COUNT;

  IF v_lead_count < v_requested_count THEN
    RAISE EXCEPTION 'Some leads are no longer available for purchase. Requested: %, Available: %',
      v_requested_count, v_lead_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_and_lock_leads_for_purchase IS
  'Atomically validates lead availability and locks rows to prevent race conditions. Uses SELECT FOR UPDATE NOWAIT.';

-- ============================================================================
-- FUNCTION: Complete credit purchase atomically
-- ============================================================================
-- Purpose: Wraps purchase creation, credit deduction, lead marking, and completion
-- in a single transaction to prevent partial failures

CREATE OR REPLACE FUNCTION complete_credit_lead_purchase(
  p_purchase_id UUID,
  p_workspace_id UUID,
  p_credit_amount DECIMAL(10,2)
) RETURNS TABLE (
  success BOOLEAN,
  new_credit_balance INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_lead_ids UUID[];
BEGIN
  -- Start transaction isolation
  -- This entire function runs in one transaction, so all-or-nothing

  -- 1. Check and deduct credits atomically with row lock
  SELECT balance INTO v_current_balance
  FROM workspace_credits
  WHERE workspace_id = p_workspace_id
  FOR UPDATE; -- Lock the row to prevent concurrent credit deductions

  IF v_current_balance IS NULL OR v_current_balance < p_credit_amount THEN
    RETURN QUERY SELECT
      false,
      COALESCE(v_current_balance, 0),
      format('Insufficient credits. Current: %s, Required: %s',
        COALESCE(v_current_balance, 0), p_credit_amount);
    RETURN;
  END IF;

  -- 2. Deduct credits
  UPDATE workspace_credits
  SET
    balance = balance - p_credit_amount,
    total_used = total_used + p_credit_amount,
    updated_at = NOW()
  WHERE workspace_id = p_workspace_id
  RETURNING balance INTO v_new_balance;

  -- 3. Get lead IDs from purchase items
  SELECT array_agg(lead_id) INTO v_lead_ids
  FROM marketplace_purchase_items
  WHERE purchase_id = p_purchase_id;

  -- 4. Mark all leads as sold atomically
  UPDATE leads
  SET
    sold_count = sold_count + 1,
    first_sold_at = COALESCE(first_sold_at, NOW()),
    sold_at = NOW(),
    marketplace_status = 'sold'
  WHERE id = ANY(v_lead_ids);

  -- 5. Complete the purchase
  UPDATE marketplace_purchases
  SET
    status = 'completed',
    completed_at = NOW()
  WHERE id = p_purchase_id;

  -- Return success
  RETURN QUERY SELECT true, v_new_balance, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION complete_credit_lead_purchase IS
  'Atomically completes credit purchase: deducts credits, marks leads sold, completes purchase. All-or-nothing transaction.';

-- ============================================================================
-- FUNCTION: Complete Stripe purchase atomically (for webhooks)
-- ============================================================================
-- Purpose: Idempotent completion of Stripe purchases
-- Checks if already completed to handle duplicate webhook deliveries

CREATE OR REPLACE FUNCTION complete_stripe_lead_purchase(
  p_purchase_id UUID,
  p_download_url TEXT DEFAULT NULL
) RETURNS TABLE (
  success BOOLEAN,
  already_completed BOOLEAN,
  lead_ids_marked UUID[]
) AS $$
DECLARE
  v_current_status TEXT;
  v_lead_ids UUID[];
  v_download_expires_at TIMESTAMPTZ;
BEGIN
  -- 1. Check current purchase status (idempotency check)
  SELECT status INTO v_current_status
  FROM marketplace_purchases
  WHERE id = p_purchase_id
  FOR UPDATE; -- Lock to prevent concurrent webhook processing

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Purchase not found: %', p_purchase_id;
  END IF;

  -- 2. If already completed, return early (idempotent)
  IF v_current_status = 'completed' THEN
    RETURN QUERY SELECT false, true, ARRAY[]::UUID[];
    RETURN;
  END IF;

  -- 3. Get lead IDs from purchase items
  SELECT array_agg(lead_id) INTO v_lead_ids
  FROM marketplace_purchase_items
  WHERE purchase_id = p_purchase_id;

  IF v_lead_ids IS NULL OR array_length(v_lead_ids, 1) = 0 THEN
    RAISE EXCEPTION 'No leads found for purchase: %', p_purchase_id;
  END IF;

  -- 4. Mark all leads as sold atomically
  UPDATE leads
  SET
    sold_count = sold_count + 1,
    first_sold_at = COALESCE(first_sold_at, NOW()),
    sold_at = NOW(),
    marketplace_status = 'sold'
  WHERE id = ANY(v_lead_ids);

  -- 5. Complete the purchase with download URL
  v_download_expires_at := NOW() + INTERVAL '90 days';

  UPDATE marketplace_purchases
  SET
    status = 'completed',
    completed_at = NOW(),
    download_url = p_download_url,
    download_expires_at = v_download_expires_at
  WHERE id = p_purchase_id;

  -- Return success
  RETURN QUERY SELECT true, false, v_lead_ids;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION complete_stripe_lead_purchase IS
  'Idempotently completes Stripe purchase. Handles duplicate webhook deliveries by checking status first.';

-- ============================================================================
-- FUNCTION: Atomic bulk lead marking (replaces loop in repository)
-- ============================================================================
-- Purpose: Replaces the loop-based marking in marketplace.repository.ts (lines 329-335)
-- Marks all leads as sold in a single operation

CREATE OR REPLACE FUNCTION mark_leads_sold_bulk(
  p_lead_ids UUID[]
) RETURNS TABLE (
  leads_marked INTEGER
) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE leads
  SET
    sold_count = sold_count + 1,
    first_sold_at = COALESCE(first_sold_at, NOW()),
    sold_at = NOW(),
    marketplace_status = 'sold'
  WHERE id = ANY(p_lead_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_leads_sold_bulk IS
  'Bulk marks leads as sold in single operation. Replaces loop-based approach to prevent partial failures.';

-- ============================================================================
-- SECURITY: Grant appropriate permissions
-- ============================================================================

-- Revoke from public, grant to service_role only (called from API with admin client)
REVOKE EXECUTE ON FUNCTION validate_and_lock_leads_for_purchase FROM PUBLIC;
GRANT EXECUTE ON FUNCTION validate_and_lock_leads_for_purchase TO service_role;

REVOKE EXECUTE ON FUNCTION complete_credit_lead_purchase FROM PUBLIC;
GRANT EXECUTE ON FUNCTION complete_credit_lead_purchase TO service_role;

REVOKE EXECUTE ON FUNCTION complete_stripe_lead_purchase FROM PUBLIC;
GRANT EXECUTE ON FUNCTION complete_stripe_lead_purchase TO service_role;

REVOKE EXECUTE ON FUNCTION mark_leads_sold_bulk FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mark_leads_sold_bulk TO service_role;

-- ============================================================================
-- ADD MISSING COLUMNS (if not already present)
-- ============================================================================

-- Add sold_at and marketplace_status if they don't exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS marketplace_status VARCHAR(20) DEFAULT 'draft';

-- Create index for marketplace_status
CREATE INDEX IF NOT EXISTS idx_leads_marketplace_status ON leads(marketplace_status);

-- Update existing marketplace_listed leads to have 'available' status
UPDATE leads
SET marketplace_status = 'available'
WHERE is_marketplace_listed = true
  AND marketplace_status = 'draft'
  AND sold_at IS NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS 'Payment race conditions fixed: 2026-02-05';
