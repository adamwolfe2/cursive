-- Service Tiers System Migration
-- Creates infrastructure for 4-tier service offering: Data, Outbound, Pipeline, Studio

-- ============================================================================
-- Service Tiers Table
-- ============================================================================
CREATE TABLE service_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  display_order INTEGER NOT NULL,
  is_public BOOLEAN DEFAULT true,

  -- Pricing
  setup_fee DECIMAL(10,2) DEFAULT 0,
  monthly_price_min DECIMAL(10,2) NOT NULL,
  monthly_price_max DECIMAL(10,2),

  -- Service details
  description TEXT NOT NULL,
  features JSONB DEFAULT '[]',
  deliverables JSONB DEFAULT '[]',

  -- Platform features unlocked by this tier
  -- Example: { "lead_downloads": true, "campaigns": true, "ai_agents": true, "api_access": true, "team_seats": 5, "daily_lead_limit": 100 }
  platform_features JSONB DEFAULT '{}',

  -- Metadata
  qualification_required BOOLEAN DEFAULT false,
  onboarding_required BOOLEAN DEFAULT false,
  contract_required BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Service Subscriptions Table
-- ============================================================================
CREATE TABLE service_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  service_tier_id UUID NOT NULL REFERENCES service_tiers(id),

  status VARCHAR(20) NOT NULL DEFAULT 'pending_payment',
  -- Status values: 'pending_payment', 'onboarding', 'active', 'paused', 'cancelled', 'expired'

  -- Actual pricing (negotiated)
  setup_fee_paid DECIMAL(10,2) DEFAULT 0,
  monthly_price DECIMAL(10,2) NOT NULL,

  -- Stripe integration
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  -- Contract terms (primarily for Studio tier)
  contract_start_date DATE,
  contract_end_date DATE,
  equity_percentage DECIMAL(5,4),

  -- Lifecycle
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,

  -- Onboarding & support
  onboarding_completed BOOLEAN DEFAULT false,
  assigned_success_manager_id UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, service_tier_id)
);

-- ============================================================================
-- Service Deliveries Table
-- ============================================================================
CREATE TABLE service_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_subscription_id UUID NOT NULL REFERENCES service_subscriptions(id) ON DELETE CASCADE,

  delivery_period_start DATE NOT NULL,
  delivery_period_end DATE NOT NULL,
  delivery_type VARCHAR(50) NOT NULL, -- 'lead_list', 'campaign_setup', 'campaign_report', 'pipeline_report'
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'delivered', 'cancelled'

  -- Flexible structure per delivery type
  -- Example for lead_list: { "count": 500, "industries": ["SaaS", "E-commerce"], "file_url": "..." }
  -- Example for campaign_report: { "emails_sent": 1000, "open_rate": 0.35, "reply_rate": 0.08 }
  deliverable_data JSONB,
  delivered_at TIMESTAMPTZ,

  -- Client feedback
  client_rating INTEGER, -- 1-5
  client_feedback TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_service_subscriptions_workspace ON service_subscriptions(workspace_id);
CREATE INDEX idx_service_subscriptions_status ON service_subscriptions(status);
CREATE INDEX idx_service_subscriptions_stripe ON service_subscriptions(stripe_subscription_id);
CREATE INDEX idx_service_deliveries_subscription ON service_deliveries(service_subscription_id);
CREATE INDEX idx_service_deliveries_period ON service_deliveries(delivery_period_start, delivery_period_end);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Service Tiers: Public can read public tiers
ALTER TABLE service_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public tiers are viewable by all authenticated users"
  ON service_tiers FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Admin can view all tiers including private"
  ON service_tiers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage service tiers"
  ON service_tiers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Service Subscriptions: Users can view their workspace subscriptions
ALTER TABLE service_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workspace subscriptions"
  ON service_subscriptions FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all subscriptions"
  ON service_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage all subscriptions"
  ON service_subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Service Deliveries: Users can view their workspace deliveries
ALTER TABLE service_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workspace deliveries"
  ON service_deliveries FOR SELECT
  TO authenticated
  USING (
    service_subscription_id IN (
      SELECT ss.id FROM service_subscriptions ss
      INNER JOIN users u ON u.workspace_id = ss.workspace_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all deliveries"
  ON service_deliveries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage all deliveries"
  ON service_deliveries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- Seed Data: 4 Service Tiers
-- ============================================================================

INSERT INTO service_tiers (slug, name, display_order, is_public, setup_fee, monthly_price_min, monthly_price_max, description, features, deliverables, platform_features, qualification_required, onboarding_required, contract_required) VALUES

-- Tier 1: Cursive Data
(
  'cursive-data',
  'Cursive Data',
  1,
  true,
  0,
  1000,
  3000,
  'High-intent lead lists delivered monthly. Custom research based on your ideal customer profile.',
  '[
    "Custom lead research based on ICP",
    "500-1500 leads per month",
    "Multi-channel contact data (email, phone, LinkedIn)",
    "Enriched company & contact details",
    "Monthly lead list delivery",
    "Quality guarantee & replacements"
  ]',
  '[
    "CSV export of verified leads",
    "Monthly delivery report",
    "Lead quality metrics"
  ]',
  '{
    "lead_downloads": true,
    "campaigns": false,
    "ai_agents": false,
    "api_access": false,
    "team_seats": 3,
    "daily_lead_limit": 100
  }',
  false,
  false,
  false
),

-- Tier 2: Cursive Outbound
(
  'cursive-outbound',
  'Cursive Outbound',
  2,
  true,
  2500,
  3000,
  5000,
  'Done-for-you cold email campaigns. We build and manage your entire outbound engine using your brand voice.',
  '[
    "Everything in Cursive Data",
    "Custom email sequence creation",
    "AI-powered personalization",
    "Campaign management & optimization",
    "Reply handling & lead qualification",
    "Weekly performance reports",
    "Dedicated campaign manager"
  ]',
  '[
    "Campaign setup & launch",
    "1000-2000 emails sent per month",
    "Weekly performance reports",
    "Qualified opportunities delivered"
  ]',
  '{
    "lead_downloads": true,
    "campaigns": true,
    "ai_agents": true,
    "api_access": false,
    "team_seats": 5,
    "daily_lead_limit": 200
  }',
  true,
  true,
  false
),

-- Tier 3: Cursive Pipeline
(
  'cursive-pipeline',
  'Cursive Pipeline',
  3,
  true,
  5000,
  5000,
  10000,
  'Full-stack pipeline with AI SDR. Multi-channel outreach, meeting booking, and pipeline management.',
  '[
    "Everything in Cursive Outbound",
    "Multi-channel outreach (email, LinkedIn, phone)",
    "AI SDR for lead qualification",
    "Meeting booking & calendar integration",
    "CRM integration & pipeline sync",
    "Custom reporting dashboards",
    "Dedicated account manager",
    "Priority support"
  ]',
  '[
    "Full pipeline setup",
    "2000-4000 touchpoints per month",
    "Qualified meetings booked",
    "Pipeline reports & forecasting"
  ]',
  '{
    "lead_downloads": true,
    "campaigns": true,
    "ai_agents": true,
    "api_access": true,
    "team_seats": 10,
    "daily_lead_limit": -1
  }',
  true,
  true,
  true
),

-- Tier 4: Cursive Studio (NOT PUBLIC)
(
  'cursive-studio',
  'Cursive Studio',
  4,
  false,
  0,
  25000,
  150000,
  'Strategic growth partnership. We become your growth team, with equity alignment and white-glove service.',
  '[
    "Everything in Cursive Pipeline",
    "Strategic growth consulting",
    "Custom GTM strategy & execution",
    "Dedicated growth team",
    "Equity partnership alignment",
    "Unlimited outreach volume",
    "Direct founder access",
    "Quarterly business reviews"
  ]',
  '[
    "Custom growth roadmap",
    "Full-service growth execution",
    "Monthly strategic reviews",
    "Unlimited pipeline development"
  ]',
  '{
    "lead_downloads": true,
    "campaigns": true,
    "ai_agents": true,
    "api_access": true,
    "team_seats": -1,
    "daily_lead_limit": -1,
    "white_label": true,
    "custom_integrations": true
  }',
  true,
  true,
  true
);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_service_tier_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_tiers_updated_at
  BEFORE UPDATE ON service_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_service_tier_updated_at();

CREATE TRIGGER service_subscriptions_updated_at
  BEFORE UPDATE ON service_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_service_tier_updated_at();
