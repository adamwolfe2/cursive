-- =====================================================
-- ROLLBACK: Phase 1 - Critical Security & Data Integrity
-- Reverses: 20260213_critical_security_fixes.sql
-- Date: 2026-02-13
-- =====================================================

-- =====================================================
-- 1. DROP INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_partner_earnings_workspace_id;
DROP INDEX IF EXISTS idx_payout_requests_workspace_id;

-- =====================================================
-- 2. DROP CHECK CONSTRAINTS
-- =====================================================

-- Remove positive/validation constraints
ALTER TABLE partners
  DROP CONSTRAINT IF EXISTS non_negative_available_balance;

ALTER TABLE partners
  DROP CONSTRAINT IF EXISTS non_negative_pending_balance;

ALTER TABLE payout_requests
  DROP CONSTRAINT IF EXISTS positive_payout_amount;

ALTER TABLE marketplace_purchase_items
  DROP CONSTRAINT IF EXISTS positive_commission;

ALTER TABLE partners
  DROP CONSTRAINT IF EXISTS valid_partner_score;

ALTER TABLE partners
  DROP CONSTRAINT IF EXISTS valid_commission_rate;

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS positive_marketplace_price;

-- =====================================================
-- 3. REVERT FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Change RESTRICT back to SET NULL
ALTER TABLE partner_earnings
  DROP CONSTRAINT IF EXISTS partner_earnings_partner_id_fkey,
  ADD CONSTRAINT partner_earnings_partner_id_fkey
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL;

ALTER TABLE partner_earnings
  DROP CONSTRAINT IF EXISTS partner_earnings_lead_id_fkey,
  ADD CONSTRAINT partner_earnings_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;

ALTER TABLE lead_conversions
  DROP CONSTRAINT IF EXISTS lead_conversions_partner_id_fkey,
  ADD CONSTRAINT lead_conversions_partner_id_fkey
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL;

ALTER TABLE marketplace_purchase_items
  DROP CONSTRAINT IF EXISTS marketplace_purchase_items_partner_id_fkey,
  ADD CONSTRAINT marketplace_purchase_items_partner_id_fkey
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL;

-- =====================================================
-- 4. REMOVE WORKSPACE_ID COLUMNS
-- =====================================================

-- Drop NOT NULL constraint first
ALTER TABLE payout_requests
  ALTER COLUMN workspace_id DROP NOT NULL;

ALTER TABLE partner_earnings
  ALTER COLUMN workspace_id DROP NOT NULL;

-- Remove columns
ALTER TABLE payout_requests
  DROP COLUMN IF EXISTS workspace_id;

ALTER TABLE partner_earnings
  DROP COLUMN IF EXISTS workspace_id;

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================

-- NOTE: This rollback removes workspace tracking from financial tables.
-- Only use if you need to revert to the pre-Phase-1 schema.
