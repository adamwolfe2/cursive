-- =====================================================
-- ROLLBACK: Phase 4 - Payout Totals SQL Function
-- Reverses: 20260213_payout_totals_function.sql
-- Date: 2026-02-13
-- =====================================================

-- Drop the aggregation function
DROP FUNCTION IF EXISTS get_payout_totals(TEXT, UUID, UUID);

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================

-- NOTE: This removes the SQL aggregation function for payout totals.
-- Admin payout dashboard will need to calculate totals in-app after rollback.
-- Performance will degrade for large datasets.
