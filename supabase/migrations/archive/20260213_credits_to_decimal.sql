-- Migrate workspace_credits columns from INTEGER to DECIMAL for fractional precision
-- This prevents rounding errors in fractional credit calculations

-- Change column types to DECIMAL(10,2)
ALTER TABLE workspace_credits
  ALTER COLUMN balance TYPE DECIMAL(10,2),
  ALTER COLUMN total_purchased TYPE DECIMAL(10,2),
  ALTER COLUMN total_used TYPE DECIMAL(10,2),
  ALTER COLUMN total_earned TYPE DECIMAL(10,2);

-- Update existing integer values (they will be preserved as whole numbers)
-- No data migration needed since integers convert cleanly to decimals

-- Add constraint to ensure balances are non-negative
ALTER TABLE workspace_credits
  ADD CONSTRAINT check_balance_non_negative CHECK (balance >= 0),
  ADD CONSTRAINT check_totals_non_negative CHECK (
    total_purchased >= 0 AND
    total_used >= 0 AND
    total_earned >= 0
  );

COMMENT ON COLUMN workspace_credits.balance IS 'Current credit balance (DECIMAL for fractional credits)';
COMMENT ON COLUMN workspace_credits.total_purchased IS 'Total credits purchased (DECIMAL for fractional credits)';
COMMENT ON COLUMN workspace_credits.total_used IS 'Total credits used (DECIMAL for fractional credits)';
COMMENT ON COLUMN workspace_credits.total_earned IS 'Total credits earned from referrals (DECIMAL for fractional credits)';
