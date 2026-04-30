-- =====================================================
-- Phase 1: Critical Security & Data Integrity
-- Migration: Balance Audit Function
-- Date: 2026-02-13
-- =====================================================

-- Purpose: Verify partner balance denormalization is accurate
-- The partners table stores pending_balance and available_balance
-- These should match the sum of partner_earnings filtered by status
-- This function helps detect discrepancies for nightly audits

-- =====================================================
-- 1. CREATE BALANCE AUDIT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION audit_partner_balances()
RETURNS TABLE(
  partner_id UUID,
  partner_name TEXT,
  stored_pending DECIMAL(10,2),
  calculated_pending DECIMAL(10,2),
  pending_diff DECIMAL(10,2),
  stored_available DECIMAL(10,2),
  calculated_available DECIMAL(10,2),
  available_diff DECIMAL(10,2),
  has_discrepancy BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS partner_id,
    p.name AS partner_name,
    p.pending_balance AS stored_pending,
    COALESCE(SUM(pe.amount) FILTER (WHERE pe.status = 'pending'), 0)::DECIMAL(10,2) AS calculated_pending,
    (p.pending_balance - COALESCE(SUM(pe.amount) FILTER (WHERE pe.status = 'pending'), 0))::DECIMAL(10,2) AS pending_diff,
    p.available_balance AS stored_available,
    COALESCE(SUM(pe.amount) FILTER (WHERE pe.status = 'available'), 0)::DECIMAL(10,2) AS calculated_available,
    (p.available_balance - COALESCE(SUM(pe.amount) FILTER (WHERE pe.status = 'available'), 0))::DECIMAL(10,2) AS available_diff,
    (
      ABS(p.pending_balance - COALESCE(SUM(pe.amount) FILTER (WHERE pe.status = 'pending'), 0)) > 0.01
      OR ABS(p.available_balance - COALESCE(SUM(pe.amount) FILTER (WHERE pe.status = 'available'), 0)) > 0.01
    ) AS has_discrepancy
  FROM partners p
  LEFT JOIN partner_earnings pe ON pe.partner_id = p.id
  GROUP BY p.id, p.name, p.pending_balance, p.available_balance
  ORDER BY has_discrepancy DESC, p.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to service_role for Inngest jobs
GRANT EXECUTE ON FUNCTION audit_partner_balances() TO service_role;
GRANT EXECUTE ON FUNCTION audit_partner_balances() TO authenticated;

-- =====================================================
-- 2. CREATE HELPER FUNCTION TO FIX DISCREPANCIES
-- =====================================================

CREATE OR REPLACE FUNCTION fix_partner_balance(p_partner_id UUID)
RETURNS JSON AS $$
DECLARE
  v_calculated_pending DECIMAL(10,2);
  v_calculated_available DECIMAL(10,2);
  v_old_pending DECIMAL(10,2);
  v_old_available DECIMAL(10,2);
BEGIN
  -- Get current balances
  SELECT pending_balance, available_balance
  INTO v_old_pending, v_old_available
  FROM partners
  WHERE id = p_partner_id;

  -- Calculate correct balances from earnings
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0),
    COALESCE(SUM(amount) FILTER (WHERE status = 'available'), 0)
  INTO v_calculated_pending, v_calculated_available
  FROM partner_earnings
  WHERE partner_id = p_partner_id;

  -- Update partner balances
  UPDATE partners
  SET
    pending_balance = v_calculated_pending,
    available_balance = v_calculated_available,
    updated_at = NOW()
  WHERE id = p_partner_id;

  -- Return summary
  RETURN json_build_object(
    'partner_id', p_partner_id,
    'old_pending', v_old_pending,
    'new_pending', v_calculated_pending,
    'old_available', v_old_available,
    'new_available', v_calculated_available,
    'fixed', true
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION fix_partner_balance(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION fix_partner_balance(UUID) TO authenticated;

-- =====================================================
-- 3. CREATE VIEW FOR QUICK DISCREPANCY CHECK
-- =====================================================

CREATE OR REPLACE VIEW partner_balance_discrepancies AS
SELECT
  partner_id,
  partner_name,
  stored_pending,
  calculated_pending,
  pending_diff,
  stored_available,
  calculated_available,
  available_diff
FROM audit_partner_balances()
WHERE has_discrepancy = true;

-- Grant select permission
GRANT SELECT ON partner_balance_discrepancies TO service_role;
GRANT SELECT ON partner_balance_discrepancies TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES (commented out)
-- =====================================================

-- Check for any discrepancies:
-- SELECT * FROM partner_balance_discrepancies;

-- Run full audit:
-- SELECT * FROM audit_partner_balances();

-- Fix a specific partner's balance:
-- SELECT fix_partner_balance('[partner-id]');

-- Test the audit function performance:
-- EXPLAIN ANALYZE SELECT * FROM audit_partner_balances();
