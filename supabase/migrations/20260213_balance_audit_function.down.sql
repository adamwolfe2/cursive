-- =====================================================
-- ROLLBACK: Phase 1 - Balance Audit Function
-- Reverses: 20260213_balance_audit_function.sql
-- Date: 2026-02-13
-- =====================================================

-- Drop the audit function
DROP FUNCTION IF EXISTS audit_partner_balances();

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================

-- NOTE: This removes the balance audit verification function.
-- Any scheduled jobs or cron tasks calling this function will fail after rollback.
