-- Migration: Payout Enhancements
-- Add idempotency key and additional tracking fields for partner payouts

-- Add new columns to payouts table if they don't exist
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create unique index on idempotency key to prevent duplicate payouts
CREATE UNIQUE INDEX IF NOT EXISTS idx_payouts_idempotency_key
ON payouts(idempotency_key)
WHERE idempotency_key IS NOT NULL;

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_payouts_status_created
ON payouts(status, created_at DESC);

-- Add commission_payable_at and commission_paid_at to purchase items
ALTER TABLE marketplace_purchase_items
ADD COLUMN IF NOT EXISTS commission_payable_at TIMESTAMPTZ;

ALTER TABLE marketplace_purchase_items
ADD COLUMN IF NOT EXISTS commission_paid_at TIMESTAMPTZ;

-- Add total_paid_out to partners if not exists
ALTER TABLE partners ADD COLUMN IF NOT EXISTS total_paid_out DECIMAL(10,2) DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS last_payout_at TIMESTAMPTZ;

-- Create index for commission status queries
CREATE INDEX IF NOT EXISTS idx_purchase_items_commission_status
ON marketplace_purchase_items(partner_id, commission_status);

-- RLS for payouts (admin and partner can view their own)
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Partners can view own payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can manage all payouts" ON payouts;

-- Partners can view their own payouts
CREATE POLICY "Partners can view own payouts" ON payouts
  FOR SELECT USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Admins can manage all payouts
CREATE POLICY "Admins can manage all payouts" ON payouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Comment on the idempotency key purpose
COMMENT ON COLUMN payouts.idempotency_key IS
'Unique key to prevent duplicate payouts. Format: payout-{partner_id}-{week_start_date}';
