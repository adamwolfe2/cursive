-- Cursive Platform - Security RLS Policies
-- Migration to add missing RLS policies for critical tables

-- ============================================================================
-- ENABLE RLS ON MISSING TABLES
-- ============================================================================
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_conversions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTNERS TABLE POLICIES
-- Partners should only be accessible by platform admins
-- ============================================================================

-- Admins can view all partners
CREATE POLICY "Admins can view partners" ON partners
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins pa
      WHERE pa.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ) AND pa.is_active = true
    )
  );

-- Admins can insert partners
CREATE POLICY "Admins can create partners" ON partners
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM platform_admins pa
      WHERE pa.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ) AND pa.is_active = true
    )
  );

-- Admins can update partners
CREATE POLICY "Admins can update partners" ON partners
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins pa
      WHERE pa.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ) AND pa.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM platform_admins pa
      WHERE pa.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ) AND pa.is_active = true
    )
  );

-- Admins can delete partners
CREATE POLICY "Admins can delete partners" ON partners
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins pa
      WHERE pa.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ) AND pa.is_active = true
    )
  );

-- ============================================================================
-- PAYOUTS TABLE POLICIES
-- Payouts should only be accessible by platform admins
-- ============================================================================

-- Admins can view all payouts
CREATE POLICY "Admins can view payouts" ON payouts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins pa
      WHERE pa.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ) AND pa.is_active = true
    )
  );

-- Admins can manage payouts
CREATE POLICY "Admins can manage payouts" ON payouts
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
-- LEAD CONVERSIONS TABLE POLICIES
-- Lead conversions should be workspace-scoped and admin-accessible
-- ============================================================================

-- Workspace users can view their lead conversions
CREATE POLICY "Workspace can view lead conversions" ON lead_conversions
  FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE workspace_id IN (
        SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM platform_admins pa
      WHERE pa.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ) AND pa.is_active = true
    )
  );

-- Admins can manage all lead conversions
CREATE POLICY "Admins can manage lead conversions" ON lead_conversions
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
-- SERVICE ROLE BYPASS POLICIES
-- Allow service role to bypass RLS for backend operations
-- ============================================================================

-- Note: Service role already bypasses RLS by default in Supabase
-- These policies are for regular authenticated users

-- ============================================================================
-- SECURITY DEFINER FUNCTIONS FOR PARTNER OPERATIONS
-- These functions allow specific operations without direct table access
-- ============================================================================

-- Function to validate partner and get stats (for partner portal)
CREATE OR REPLACE FUNCTION get_partner_by_api_key(p_api_key TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  company_name TEXT,
  payout_rate DECIMAL,
  total_leads_uploaded INTEGER,
  total_earnings DECIMAL,
  pending_balance DECIMAL,
  available_balance DECIMAL,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.email,
    p.company_name,
    p.payout_rate,
    p.total_leads_uploaded,
    p.total_earnings,
    p.pending_balance,
    p.available_balance,
    p.stripe_account_id,
    p.stripe_onboarding_complete
  FROM partners p
  WHERE p.api_key = p_api_key
    AND p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get partner payout history (for partner portal)
CREATE OR REPLACE FUNCTION get_partner_payouts(p_api_key TEXT)
RETURNS TABLE (
  id UUID,
  amount DECIMAL,
  status TEXT,
  requested_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rejection_reason TEXT
) AS $$
DECLARE
  v_partner_id UUID;
BEGIN
  -- Get partner ID from API key
  SELECT p.id INTO v_partner_id
  FROM partners p
  WHERE p.api_key = p_api_key
    AND p.is_active = true;

  IF v_partner_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    pr.id,
    pr.amount,
    pr.status,
    pr.requested_at,
    pr.completed_at,
    pr.rejection_reason
  FROM payout_requests pr
  WHERE pr.partner_id = v_partner_id
  ORDER BY pr.requested_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to request payout (for partner portal)
CREATE OR REPLACE FUNCTION request_partner_payout(
  p_api_key TEXT,
  p_amount DECIMAL
)
RETURNS UUID AS $$
DECLARE
  v_partner_id UUID;
  v_available_balance DECIMAL;
  v_payout_threshold DECIMAL;
  v_pending_request_count INTEGER;
  v_payout_id UUID;
BEGIN
  -- Get partner info
  SELECT p.id, p.available_balance, p.payout_threshold
  INTO v_partner_id, v_available_balance, v_payout_threshold
  FROM partners p
  WHERE p.api_key = p_api_key
    AND p.is_active = true;

  IF v_partner_id IS NULL THEN
    RAISE EXCEPTION 'Invalid API key';
  END IF;

  -- Check amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  IF p_amount > v_available_balance THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  IF p_amount < v_payout_threshold THEN
    RAISE EXCEPTION 'Amount below minimum threshold';
  END IF;

  -- Check for pending requests
  SELECT COUNT(*) INTO v_pending_request_count
  FROM payout_requests
  WHERE partner_id = v_partner_id
    AND status = 'pending';

  IF v_pending_request_count > 0 THEN
    RAISE EXCEPTION 'Pending payout request exists';
  END IF;

  -- Create payout request
  INSERT INTO payout_requests (partner_id, amount)
  VALUES (v_partner_id, p_amount)
  RETURNING id INTO v_payout_id;

  -- Deduct from available balance
  UPDATE partners
  SET available_balance = available_balance - p_amount,
      updated_at = NOW()
  WHERE id = v_partner_id;

  RETURN v_payout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION get_partner_by_api_key IS 'Safely get partner info by API key (for partner portal)';
COMMENT ON FUNCTION get_partner_payouts IS 'Get partner payout history by API key';
COMMENT ON FUNCTION request_partner_payout IS 'Submit payout request for partner';
