-- Cursive Platform - Stripe Connect Integration
-- Migration for partner Stripe Connect accounts and payout requests

-- ============================================================================
-- ADD STRIPE CONNECT FIELDS TO PARTNERS
-- ============================================================================
ALTER TABLE partners ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS payout_threshold DECIMAL(10,2) DEFAULT 50.00;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS pending_balance DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS available_balance DECIMAL(10,2) DEFAULT 0.00;

-- Index for Stripe account lookups
CREATE INDEX IF NOT EXISTS idx_partners_stripe_account ON partners(stripe_account_id) WHERE stripe_account_id IS NOT NULL;

-- ============================================================================
-- PAYOUT REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, processing, completed, rejected
  stripe_payout_id TEXT,
  admin_notes TEXT,
  rejection_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES platform_admins(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for payout requests
CREATE INDEX IF NOT EXISTS idx_payout_requests_partner ON payout_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);

-- ============================================================================
-- PARTNER EARNINGS LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS partner_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, available, paid_out
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for partner earnings
CREATE INDEX IF NOT EXISTS idx_partner_earnings_partner ON partner_earnings(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_status ON partner_earnings(status);

-- ============================================================================
-- FUNCTION TO INCREMENT PARTNER EARNINGS
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_partner_earnings(
  p_partner_id UUID,
  p_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE partners
  SET
    total_earnings = total_earnings + p_amount,
    pending_balance = pending_balance + p_amount,
    updated_at = NOW()
  WHERE id = p_partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION TO MOVE PENDING TO AVAILABLE (after 30 day hold)
-- ============================================================================
CREATE OR REPLACE FUNCTION process_pending_earnings()
RETURNS INTEGER AS $$
DECLARE
  processed_count INTEGER := 0;
BEGIN
  -- Update earnings older than 30 days from pending to available
  UPDATE partner_earnings
  SET status = 'available'
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS processed_count = ROW_COUNT;

  -- Update partner balances
  UPDATE partners p
  SET
    pending_balance = COALESCE((
      SELECT SUM(amount) FROM partner_earnings
      WHERE partner_id = p.id AND status = 'pending'
    ), 0),
    available_balance = COALESCE((
      SELECT SUM(amount) FROM partner_earnings
      WHERE partner_id = p.id AND status = 'available'
    ), 0),
    updated_at = NOW();

  RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_earnings ENABLE ROW LEVEL SECURITY;

-- Admins can view all payout requests
CREATE POLICY "Admins can manage payout requests" ON payout_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins pa
      WHERE pa.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ) AND pa.is_active = true
    )
  );

-- Admins can view all partner earnings
CREATE POLICY "Admins can view partner earnings" ON partner_earnings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins pa
      WHERE pa.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ) AND pa.is_active = true
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE payout_requests IS 'Partner payout request tracking';
COMMENT ON TABLE partner_earnings IS 'Detailed partner earnings log';
COMMENT ON FUNCTION increment_partner_earnings IS 'Add earnings to partner balance';
COMMENT ON FUNCTION process_pending_earnings IS 'Move pending earnings to available after hold period';
