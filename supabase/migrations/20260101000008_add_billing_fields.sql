-- Migration: Add Billing Fields
-- Description: Add Stripe subscription fields to users table and create billing_events table

-- Add Stripe subscription fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS subscription_period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Create index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);

-- Update billing_events table with more fields
ALTER TABLE billing_events
ADD COLUMN IF NOT EXISTS stripe_event_id TEXT,
ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for billing event lookups
CREATE INDEX IF NOT EXISTS idx_billing_events_stripe_event_id ON billing_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_workspace_created ON billing_events(workspace_id, created_at DESC);

-- Add unique constraint to prevent duplicate webhook processing
ALTER TABLE billing_events
ADD CONSTRAINT unique_stripe_event_id UNIQUE (stripe_event_id);

-- Function: Get user's current plan limits
CREATE OR REPLACE FUNCTION get_user_plan_limits(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan TEXT;
  v_limits JSONB;
BEGIN
  -- Get user's plan
  SELECT plan INTO v_plan
  FROM users
  WHERE id = p_user_id;

  -- Return plan limits
  IF v_plan = 'pro' THEN
    v_limits := jsonb_build_object(
      'daily_credits', 1000,
      'max_queries', 5,
      'max_saved_searches', 50,
      'export_limit', 10000
    );
  ELSE
    v_limits := jsonb_build_object(
      'daily_credits', 3,
      'max_queries', 1,
      'max_saved_searches', 5,
      'export_limit', 100
    );
  END IF;

  RETURN v_limits;
END;
$$;

-- Function: Check if user can create query (respects plan limits)
CREATE OR REPLACE FUNCTION can_create_query(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workspace_id UUID;
  v_plan TEXT;
  v_query_count INTEGER;
  v_max_queries INTEGER;
BEGIN
  -- Get user's workspace and plan
  SELECT workspace_id, plan INTO v_workspace_id, v_plan
  FROM users
  WHERE id = p_user_id;

  -- Count active queries for workspace
  SELECT COUNT(*) INTO v_query_count
  FROM queries
  WHERE workspace_id = v_workspace_id
    AND status = 'active';

  -- Get max queries for plan
  IF v_plan = 'pro' THEN
    v_max_queries := 5;
  ELSE
    v_max_queries := 1;
  END IF;

  -- Return true if under limit
  RETURN v_query_count < v_max_queries;
END;
$$;

-- Function: Check if user can create saved search (respects plan limits)
CREATE OR REPLACE FUNCTION can_create_saved_search(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workspace_id UUID;
  v_plan TEXT;
  v_search_count INTEGER;
  v_max_searches INTEGER;
BEGIN
  -- Get user's workspace and plan
  SELECT workspace_id, plan INTO v_workspace_id, v_plan
  FROM users
  WHERE id = p_user_id;

  -- Count saved searches for workspace
  SELECT COUNT(*) INTO v_search_count
  FROM saved_searches
  WHERE workspace_id = v_workspace_id;

  -- Get max saved searches for plan
  IF v_plan = 'pro' THEN
    v_max_searches := 50;
  ELSE
    v_max_searches := 5;
  END IF;

  -- Return true if under limit
  RETURN v_search_count < v_max_searches;
END;
$$;

-- Function: Get billing summary for workspace
CREATE OR REPLACE FUNCTION get_billing_summary(p_workspace_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_summary JSONB;
  v_total_spent INTEGER;
  v_event_count INTEGER;
  v_last_payment TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate total amount spent
  SELECT COALESCE(SUM(amount), 0), COUNT(*)
  INTO v_total_spent, v_event_count
  FROM billing_events
  WHERE workspace_id = p_workspace_id
    AND event_type IN ('payment_succeeded');

  -- Get last payment date
  SELECT MAX(created_at) INTO v_last_payment
  FROM billing_events
  WHERE workspace_id = p_workspace_id
    AND event_type = 'payment_succeeded';

  -- Build summary
  v_summary := jsonb_build_object(
    'total_spent', v_total_spent,
    'payment_count', v_event_count,
    'last_payment', v_last_payment
  );

  RETURN v_summary;
END;
$$;

-- View: Active subscriptions
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT
  u.id AS user_id,
  u.email,
  u.workspace_id,
  u.plan,
  u.stripe_customer_id,
  u.stripe_subscription_id,
  u.subscription_status,
  u.subscription_period_start,
  u.subscription_period_end,
  u.cancel_at_period_end,
  w.name AS workspace_name
FROM users u
JOIN workspaces w ON u.workspace_id = w.id
WHERE u.stripe_subscription_id IS NOT NULL
  AND u.subscription_status IN ('active', 'trialing');

-- View: Recent billing events
CREATE OR REPLACE VIEW recent_billing_events AS
SELECT
  be.id,
  be.workspace_id,
  be.event_type,
  be.stripe_event_id,
  be.amount,
  be.currency,
  be.metadata,
  be.created_at,
  w.name AS workspace_name
FROM billing_events be
JOIN workspaces w ON be.workspace_id = w.id
ORDER BY be.created_at DESC
LIMIT 100;

-- Grant permissions
GRANT SELECT ON active_subscriptions TO authenticated;
GRANT SELECT ON recent_billing_events TO authenticated;

-- Comments
COMMENT ON FUNCTION get_user_plan_limits IS 'Get plan limits for a user based on their subscription';
COMMENT ON FUNCTION can_create_query IS 'Check if user can create another query based on plan limits';
COMMENT ON FUNCTION can_create_saved_search IS 'Check if user can create another saved search based on plan limits';
COMMENT ON FUNCTION get_billing_summary IS 'Get billing summary for a workspace';
COMMENT ON VIEW active_subscriptions IS 'View of all active subscriptions';
COMMENT ON VIEW recent_billing_events IS 'View of recent billing events';
