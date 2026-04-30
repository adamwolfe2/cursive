-- Atomic Partner Balance Update Functions
-- Prevents race conditions in commission balance updates

-- Function to atomically update partner balance when recording commission
CREATE OR REPLACE FUNCTION increment_partner_balance(
  p_partner_id UUID,
  p_pending_amount DECIMAL(10,2),
  p_total_earnings_amount DECIMAL(10,2)
)
RETURNS VOID AS $$
BEGIN
  UPDATE partners
  SET
    pending_balance = pending_balance + p_pending_amount,
    total_earnings = total_earnings + p_total_earnings_amount,
    updated_at = NOW()
  WHERE id = p_partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to atomically move balance from pending to available
CREATE OR REPLACE FUNCTION move_pending_to_available(
  p_partner_id UUID,
  p_amount DECIMAL(10,2)
)
RETURNS VOID AS $$
BEGIN
  UPDATE partners
  SET
    pending_balance = GREATEST(0, pending_balance - p_amount),
    available_balance = available_balance + p_amount,
    updated_at = NOW()
  WHERE id = p_partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to atomically deduct from available balance (for payouts)
CREATE OR REPLACE FUNCTION deduct_available_balance(
  p_partner_id UUID,
  p_amount DECIMAL(10,2)
)
RETURNS VOID AS $$
BEGIN
  UPDATE partners
  SET
    available_balance = GREATEST(0, available_balance - p_amount),
    updated_at = NOW()
  WHERE id = p_partner_id
    AND available_balance >= p_amount; -- Prevent negative balance

  -- Check if update affected any rows
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance or partner not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users and service role
GRANT EXECUTE ON FUNCTION increment_partner_balance TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION move_pending_to_available TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION deduct_available_balance TO authenticated, service_role;

-- Add comments
COMMENT ON FUNCTION increment_partner_balance IS 'Atomically increments partner pending balance and total earnings';
COMMENT ON FUNCTION move_pending_to_available IS 'Atomically moves commission from pending to available balance';
COMMENT ON FUNCTION deduct_available_balance IS 'Atomically deducts from available balance for payouts (prevents negative)';
