-- Cursive Platform - Subscription Billing
-- Migration for subscription plans and billing

-- ============================================================================
-- SUBSCRIPTION PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB NOT NULL DEFAULT '[]',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, limits, sort_order) VALUES
  ('free', 'Free', 'Get started with basic features', 0, 0,
   '["Up to 10 leads/month", "Email notifications", "Basic analytics", "1 user"]'::jsonb,
   '{"leads_per_month": 10, "users": 1, "integrations": false, "api_access": false}'::jsonb,
   1),
  ('starter', 'Starter', 'Perfect for small businesses', 49, 470,
   '["Up to 100 leads/month", "Email + Slack notifications", "Full analytics", "3 users", "Priority support"]'::jsonb,
   '{"leads_per_month": 100, "users": 3, "integrations": true, "api_access": false}'::jsonb,
   2),
  ('pro', 'Pro', 'Best for growing businesses', 149, 1430,
   '["Up to 500 leads/month", "All integrations", "Advanced analytics", "10 users", "API access", "Webhook delivery", "Priority support"]'::jsonb,
   '{"leads_per_month": 500, "users": 10, "integrations": true, "api_access": true}'::jsonb,
   3),
  ('enterprise', 'Enterprise', 'For large organizations', 499, 4790,
   '["Unlimited leads", "All features", "Unlimited users", "Dedicated support", "Custom integrations", "SLA guarantee"]'::jsonb,
   '{"leads_per_month": -1, "users": -1, "integrations": true, "api_access": true}'::jsonb,
   4)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, past_due, cancelled, trialing
  billing_cycle TEXT DEFAULT 'monthly', -- monthly, yearly
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id)
);

-- Index for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_workspace ON subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'draft', -- draft, open, paid, void, uncollectible
  invoice_number TEXT,
  invoice_pdf_url TEXT,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_workspace ON invoices(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe ON invoices(stripe_invoice_id);

-- ============================================================================
-- USAGE RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL, -- leads, api_calls, enrichments, emails
  quantity INTEGER NOT NULL DEFAULT 1,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for usage
CREATE INDEX IF NOT EXISTS idx_usage_records_workspace ON usage_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_period ON usage_records(billing_period_start, billing_period_end);

-- ============================================================================
-- UPDATE WORKSPACES FOR BILLING
-- ============================================================================
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS billing_email TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS billing_address JSONB;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS leads_this_month INTEGER DEFAULT 0;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS leads_limit_reached BOOLEAN DEFAULT false;

-- ============================================================================
-- FUNCTION TO CHECK LEAD LIMITS
-- ============================================================================
CREATE OR REPLACE FUNCTION check_workspace_lead_limit(p_workspace_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_used INTEGER;
BEGIN
  -- Get workspace's plan limit
  SELECT (sp.limits->>'leads_per_month')::INTEGER INTO v_limit
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.workspace_id = p_workspace_id
  AND s.status = 'active';

  -- If no subscription or unlimited (-1), allow
  IF v_limit IS NULL OR v_limit = -1 THEN
    RETURN TRUE;
  END IF;

  -- Get leads used this month
  SELECT COALESCE(leads_this_month, 0) INTO v_used
  FROM workspaces
  WHERE id = p_workspace_id;

  RETURN v_used < v_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION TO INCREMENT LEAD USAGE
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_workspace_lead_usage(p_workspace_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE workspaces
  SET leads_this_month = COALESCE(leads_this_month, 0) + 1
  WHERE id = p_workspace_id;

  -- Check if limit reached
  PERFORM check_workspace_lead_limit(p_workspace_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MONTHLY USAGE RESET FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION reset_monthly_lead_counts()
RETURNS VOID AS $$
BEGIN
  UPDATE workspaces
  SET leads_this_month = 0,
      leads_limit_reached = false;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- Workspace isolation
CREATE POLICY "Workspace subscriptions" ON subscriptions
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace invoices" ON invoices
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace usage" ON usage_records
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE subscription_plans IS 'Available subscription plans';
COMMENT ON TABLE subscriptions IS 'Workspace subscriptions';
COMMENT ON TABLE invoices IS 'Billing invoices';
COMMENT ON TABLE usage_records IS 'Usage tracking for metered billing';
COMMENT ON FUNCTION check_workspace_lead_limit IS 'Check if workspace is within lead limit';
COMMENT ON FUNCTION reset_monthly_lead_counts IS 'Reset monthly lead counters (run on 1st of month)';
