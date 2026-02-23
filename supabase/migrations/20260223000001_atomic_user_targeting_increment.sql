-- Atomic increment function for user_targeting lead counts
-- Fixes race condition: multiple concurrent Inngest invocations could read the same
-- count value and each write count+1 instead of incrementing atomically.
CREATE OR REPLACE FUNCTION increment_user_targeting_counts(
  p_user_id UUID,
  p_workspace_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_targeting
  SET
    daily_lead_count   = daily_lead_count + 1,
    weekly_lead_count  = weekly_lead_count + 1,
    monthly_lead_count = monthly_lead_count + 1,
    updated_at         = NOW()
  WHERE user_id      = p_user_id
    AND workspace_id = p_workspace_id;
END;
$$;
