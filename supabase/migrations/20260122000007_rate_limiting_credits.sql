-- Rate Limiting and Credit Tracking Enhancement
-- Adds RPC functions and optimizations for credit system

-- Create function to atomically increment credits
CREATE OR REPLACE FUNCTION increment_credits(
  user_id UUID,
  amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET daily_credits_used = daily_credits_used + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check and reset credits if needed
CREATE OR REPLACE FUNCTION check_and_reset_credits(
  user_id UUID
)
RETURNS TABLE(
  remaining INTEGER,
  limit_amount INTEGER,
  reset_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  user_record RECORD;
  credits_limit INTEGER;
  should_reset BOOLEAN;
BEGIN
  -- Get user data
  SELECT u.plan, u.daily_credits_used, u.daily_credits_reset_at
  INTO user_record
  FROM users u
  WHERE u.id = user_id;

  -- Determine limit based on plan
  IF user_record.plan = 'pro' THEN
    credits_limit := 1000;
  ELSE
    credits_limit := 3;
  END IF;

  -- Check if reset needed
  should_reset := NOW() > user_record.daily_credits_reset_at;

  IF should_reset THEN
    -- Reset credits
    UPDATE users
    SET
      daily_credits_used = 0,
      daily_credits_reset_at = (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE
    WHERE users.id = user_id;

    -- Return reset values
    RETURN QUERY SELECT
      credits_limit AS remaining,
      credits_limit AS limit_amount,
      (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE AS reset_at;
  ELSE
    -- Return current values
    RETURN QUERY SELECT
      (credits_limit - user_record.daily_credits_used) AS remaining,
      credits_limit AS limit_amount,
      user_record.daily_credits_reset_at AS reset_at;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for faster credit_usage queries
CREATE INDEX IF NOT EXISTS idx_credit_usage_workspace_timestamp
ON credit_usage(workspace_id, timestamp DESC);

-- Add index for faster credit_usage by user
CREATE INDEX IF NOT EXISTS idx_credit_usage_user_timestamp
ON credit_usage(user_id, timestamp DESC);

-- Add index for faster credit_usage by action type
CREATE INDEX IF NOT EXISTS idx_credit_usage_action_type
ON credit_usage(action_type, timestamp DESC);

-- Add constraint to ensure credits can't go negative
ALTER TABLE users
ADD CONSTRAINT check_credits_non_negative
CHECK (daily_credits_used >= 0);

-- Create materialized view for credit usage stats (optional, for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS credit_usage_stats AS
SELECT
  workspace_id,
  action_type,
  DATE_TRUNC('day', timestamp) as date,
  COUNT(*) as action_count,
  SUM(credits_used) as total_credits
FROM credit_usage
WHERE timestamp > NOW() - INTERVAL '90 days'
GROUP BY workspace_id, action_type, DATE_TRUNC('day', timestamp);

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_credit_usage_stats_workspace_date
ON credit_usage_stats(workspace_id, date DESC);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_credits TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_reset_credits TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION increment_credits IS 'Atomically increments daily credit usage for a user';
COMMENT ON FUNCTION check_and_reset_credits IS 'Checks if credits need reset and returns current credit status';
