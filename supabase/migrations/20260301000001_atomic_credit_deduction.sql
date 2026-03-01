-- Atomic credit deduction function
-- Replaces the two-step check+deduct pattern in the enrich route to prevent TOCTOU race conditions.
-- Returns TRUE if credits were successfully deducted, FALSE if insufficient credits.

CREATE OR REPLACE FUNCTION atomic_deduct_credits(p_user_id uuid, p_amount int)
RETURNS boolean
LANGUAGE plpgsql AS $$
DECLARE
  rows_updated int;
BEGIN
  UPDATE users
  SET daily_credits_used = daily_credits_used + p_amount
  WHERE id = p_user_id
    AND (daily_credit_limit - daily_credits_used) >= p_amount;
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;
