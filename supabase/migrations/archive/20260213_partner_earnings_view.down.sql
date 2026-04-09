-- =====================================================
-- ROLLBACK: Phase 4 - Partner Earnings Materialized View
-- Reverses: 20260213_partner_earnings_view.sql
-- Date: 2026-02-13
-- =====================================================

-- Drop refresh function
DROP FUNCTION IF EXISTS refresh_partner_earnings_summary();

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS partner_earnings_summary CASCADE;

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================

-- NOTE: This removes the materialized view for partner earnings aggregations.
-- Partner earnings dashboard will query raw data after rollback.
-- Performance will degrade significantly for partners with many transactions.
-- Hourly refresh job will fail if not removed.
