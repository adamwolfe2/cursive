-- =====================================================
-- Phase 1: Critical Security & Data Integrity
-- Migration: Database Schema Hardening
-- Date: 2026-02-13
-- =====================================================

-- =====================================================
-- 1. ADD WORKSPACE_ID TO FINANCIAL TABLES
-- =====================================================

-- Track which workspace generated partner earnings
ALTER TABLE partner_earnings
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);

-- Track which workspace requested payouts
ALTER TABLE payout_requests
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);

-- Backfill workspace_id from marketplace_purchases
-- Partner earnings come from purchases, which have buyer_workspace_id
UPDATE partner_earnings pe
SET workspace_id = (
  SELECT mp.buyer_workspace_id
  FROM marketplace_purchase_items mpi
  JOIN marketplace_purchases mp ON mp.id = mpi.purchase_id
  WHERE mpi.id = pe.purchase_item_id
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Backfill payout_requests workspace_id from partner
UPDATE payout_requests pr
SET workspace_id = (
  SELECT p.workspace_id
  FROM partners p
  WHERE p.id = pr.partner_id
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE partner_earnings
  ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE payout_requests
  ALTER COLUMN workspace_id SET NOT NULL;

-- =====================================================
-- 2. CHANGE SET NULL TO RESTRICT ON FINANCIAL FKs
-- =====================================================

-- Prevent orphaned commission records when partner is deleted
ALTER TABLE marketplace_purchase_items
  DROP CONSTRAINT IF EXISTS marketplace_purchase_items_partner_id_fkey,
  ADD CONSTRAINT marketplace_purchase_items_partner_id_fkey
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE RESTRICT;

-- Prevent orphaned conversion records
ALTER TABLE lead_conversions
  DROP CONSTRAINT IF EXISTS lead_conversions_partner_id_fkey,
  ADD CONSTRAINT lead_conversions_partner_id_fkey
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE RESTRICT;

-- Prevent orphaned earnings records
ALTER TABLE partner_earnings
  DROP CONSTRAINT IF EXISTS partner_earnings_lead_id_fkey,
  ADD CONSTRAINT partner_earnings_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE RESTRICT;

ALTER TABLE partner_earnings
  DROP CONSTRAINT IF EXISTS partner_earnings_partner_id_fkey,
  ADD CONSTRAINT partner_earnings_partner_id_fkey
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE RESTRICT;

-- =====================================================
-- 3. ADD CHECK CONSTRAINTS ON FINANCIAL AMOUNTS
-- =====================================================

-- Ensure marketplace prices are positive
ALTER TABLE leads
  ADD CONSTRAINT IF NOT EXISTS positive_marketplace_price
  CHECK (marketplace_price IS NULL OR marketplace_price > 0);

-- Ensure commission rates are valid percentages (0-100%)
ALTER TABLE partners
  ADD CONSTRAINT IF NOT EXISTS valid_commission_rate
  CHECK (commission_rate >= 0 AND commission_rate <= 1);

-- Ensure partner scores are valid (0-100)
ALTER TABLE partners
  ADD CONSTRAINT IF NOT EXISTS valid_partner_score
  CHECK (partner_score >= 0 AND partner_score <= 100);

-- Ensure commission amounts are non-negative
ALTER TABLE marketplace_purchase_items
  ADD CONSTRAINT IF NOT EXISTS positive_commission
  CHECK (commission_amount >= 0);

-- Ensure payout amounts are positive
ALTER TABLE payout_requests
  ADD CONSTRAINT IF NOT EXISTS positive_payout_amount
  CHECK (amount > 0);

-- Ensure partner balances are non-negative
ALTER TABLE partners
  ADD CONSTRAINT IF NOT EXISTS non_negative_pending_balance
  CHECK (pending_balance >= 0);

ALTER TABLE partners
  ADD CONSTRAINT IF NOT EXISTS non_negative_available_balance
  CHECK (available_balance >= 0);

-- =====================================================
-- 4. STANDARDIZE DECIMAL PRECISION
-- =====================================================

-- All prices use DECIMAL(10,4) - supports up to $999,999.9999
-- This is already correct in most tables, but let's ensure consistency

-- Verify leads.marketplace_price precision (should already be correct)
-- ALTER TABLE leads ALTER COLUMN marketplace_price TYPE DECIMAL(10,4);

-- Verify marketplace_purchase_items.price_at_purchase precision
-- ALTER TABLE marketplace_purchase_items ALTER COLUMN price_at_purchase TYPE DECIMAL(10,4);

-- All rates use DECIMAL(5,4) - supports 0.0000 to 1.0000 (already correct in partners.commission_rate)

-- =====================================================
-- 5. ADD INDEXES FOR NEW COLUMNS
-- =====================================================

-- Index for filtering earnings by workspace
CREATE INDEX IF NOT EXISTS idx_partner_earnings_workspace_id
  ON partner_earnings(workspace_id);

-- Index for filtering payout requests by workspace
CREATE INDEX IF NOT EXISTS idx_payout_requests_workspace_id
  ON payout_requests(workspace_id);

-- =====================================================
-- VERIFICATION QUERIES (commented out)
-- =====================================================

-- Verify no NULL workspace_ids remain:
-- SELECT COUNT(*) FROM partner_earnings WHERE workspace_id IS NULL;
-- SELECT COUNT(*) FROM payout_requests WHERE workspace_id IS NULL;

-- Verify constraints are in place:
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name IN ('leads', 'partners', 'marketplace_purchase_items', 'payout_requests')
-- ORDER BY table_name, constraint_name;
