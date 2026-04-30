/**
 * Atomic Credit Transactions
 * Prevent race conditions on concurrent credit deductions
 * Uses row-level locking and transactions
 */

-- Function to atomically deduct credits with validation
CREATE OR REPLACE FUNCTION deduct_credits(
  p_workspace_id UUID,
  p_amount DECIMAL,
  p_user_id UUID,
  p_action_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS TABLE(
  success BOOLEAN,
  new_balance DECIMAL,
  error_message TEXT
) AS $$
DECLARE
  v_new_balance DECIMAL;
  v_current_balance DECIMAL;
BEGIN
  -- Lock row for update to prevent race conditions
  SELECT credits_balance INTO v_current_balance
  FROM workspaces
  WHERE id = p_workspace_id
  FOR UPDATE;

  -- Check if workspace exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE,
      NULL::DECIMAL,
      'Workspace not found';
    RETURN;
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT
      FALSE,
      v_current_balance,
      'Insufficient credits';
    RETURN;
  END IF;

  -- Deduct credits
  UPDATE workspaces
  SET credits_balance = credits_balance - p_amount
  WHERE id = p_workspace_id
  RETURNING credits_balance INTO v_new_balance;

  -- Log credit usage
  INSERT INTO credit_usage (
    workspace_id,
    user_id,
    credits_used,
    action_type,
    metadata,
    created_at
  ) VALUES (
    p_workspace_id,
    p_user_id,
    p_amount,
    p_action_type,
    p_metadata,
    NOW()
  );

  -- Return success
  RETURN QUERY SELECT
    TRUE,
    v_new_balance,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to refund credits (for failed operations)
CREATE OR REPLACE FUNCTION refund_credits(
  p_workspace_id UUID,
  p_amount DECIMAL,
  p_user_id UUID,
  p_reason TEXT,
  p_original_action TEXT DEFAULT NULL
) RETURNS TABLE(
  success BOOLEAN,
  new_balance DECIMAL,
  error_message TEXT
) AS $$
DECLARE
  v_new_balance DECIMAL;
BEGIN
  -- Lock row for update
  UPDATE workspaces
  SET credits_balance = credits_balance + p_amount
  WHERE id = p_workspace_id
  RETURNING credits_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE,
      NULL::DECIMAL,
      'Workspace not found';
    RETURN;
  END IF;

  -- Log refund as negative credit usage
  INSERT INTO credit_usage (
    workspace_id,
    user_id,
    credits_used,
    action_type,
    metadata,
    created_at
  ) VALUES (
    p_workspace_id,
    p_user_id,
    -p_amount, -- Negative to indicate refund
    'refund',
    jsonb_build_object(
      'reason', p_reason,
      'original_action', p_original_action
    ),
    NOW()
  );

  RETURN QUERY SELECT
    TRUE,
    v_new_balance,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION deduct_credits TO authenticated;
GRANT EXECUTE ON FUNCTION refund_credits TO authenticated;

-- Create index on credit_usage for faster queries
CREATE INDEX IF NOT EXISTS idx_credit_usage_workspace_created
  ON credit_usage(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_usage_action
  ON credit_usage(action_type, created_at DESC);
