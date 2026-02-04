-- ============================================================================
-- SERVICE SUBSCRIPTIONS PRODUCTION DEPLOYMENT
-- ============================================================================
-- This file combines all migrations needed for service subscription system
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
--
-- IMPORTANT: Run each section separately and verify success before proceeding
-- ============================================================================

-- ============================================================================
-- SECTION 1: Create Tables & Seed Data
-- From: 20260203000001_service_tiers_system.sql
-- ============================================================================

-- Service Tiers Table
CREATE TABLE IF NOT EXISTS service_tiers (
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
  platform_features JSONB DEFAULT '{}',

  -- Metadata
  qualification_required BOOLEAN DEFAULT false,
  onboarding_required BOOLEAN DEFAULT false,
  contract_required BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Subscriptions Table
CREATE TABLE IF NOT EXISTS service_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  service_tier_id UUID NOT NULL REFERENCES service_tiers(id),

  status VARCHAR(20) NOT NULL DEFAULT 'pending_payment',

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
  onboarding_data JSONB DEFAULT '{}',
  assigned_success_manager_id UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, service_tier_id)
);

-- Service Deliveries Table
CREATE TABLE IF NOT EXISTS service_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_subscription_id UUID NOT NULL REFERENCES service_subscriptions(id) ON DELETE CASCADE,

  delivery_period_start DATE NOT NULL,
  delivery_period_end DATE NOT NULL,
  delivery_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',

  deliverable_data JSONB,
  delivered_at TIMESTAMPTZ,

  -- File storage
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,

  -- Client feedback
  client_rating INTEGER,
  client_feedback TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_service_subscriptions_workspace ON service_subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_service_subscriptions_status ON service_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_service_subscriptions_stripe ON service_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_service_deliveries_subscription ON service_deliveries(service_subscription_id);
CREATE INDEX IF NOT EXISTS idx_service_deliveries_period ON service_deliveries(delivery_period_start, delivery_period_end);

-- ============================================================================
-- SECTION 2: Enable RLS Policies
-- ============================================================================

-- Service Tiers RLS
ALTER TABLE service_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public tiers are viewable by all authenticated users" ON service_tiers;
CREATE POLICY "Public tiers are viewable by all authenticated users"
  ON service_tiers FOR SELECT
  TO authenticated
  USING (is_public = true);

DROP POLICY IF EXISTS "Admin can view all tiers including private" ON service_tiers;
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

DROP POLICY IF EXISTS "Admin can manage service tiers" ON service_tiers;
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

-- Service Subscriptions RLS
ALTER TABLE service_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their workspace subscriptions" ON service_subscriptions;
CREATE POLICY "Users can view their workspace subscriptions"
  ON service_subscriptions FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin can view all subscriptions" ON service_subscriptions;
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

DROP POLICY IF EXISTS "Admin can manage all subscriptions" ON service_subscriptions;
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

-- Service Deliveries RLS
ALTER TABLE service_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their workspace deliveries" ON service_deliveries;
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

DROP POLICY IF EXISTS "Admin can view all deliveries" ON service_deliveries;
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

DROP POLICY IF EXISTS "Admin can manage all deliveries" ON service_deliveries;
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
-- SECTION 3: Create Storage Bucket & Policies
-- From: 20260203000005_create_delivery_storage.sql
-- ============================================================================

-- Create storage bucket (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-deliveries', 'service-deliveries', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for service deliveries bucket
DROP POLICY IF EXISTS "Admins can upload delivery files" ON storage.objects;
CREATE POLICY "Admins can upload delivery files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-deliveries' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update delivery files" ON storage.objects;
CREATE POLICY "Admins can update delivery files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-deliveries' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete delivery files" ON storage.objects;
CREATE POLICY "Admins can delete delivery files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-deliveries' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Users can download their workspace's delivery files
-- FIXED: Removed incorrect ::uuid cast
DROP POLICY IF EXISTS "Users can download their delivery files" ON storage.objects;
CREATE POLICY "Users can download their delivery files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'service-deliveries' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT workspace_id::text FROM users
    WHERE users.auth_user_id = auth.uid()
  )
);

-- ============================================================================
-- SECTION 4: Create Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_service_tier_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS service_tiers_updated_at ON service_tiers;
CREATE TRIGGER service_tiers_updated_at
  BEFORE UPDATE ON service_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_service_tier_updated_at();

DROP TRIGGER IF EXISTS service_subscriptions_updated_at ON service_subscriptions;
CREATE TRIGGER service_subscriptions_updated_at
  BEFORE UPDATE ON service_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_service_tier_updated_at();

-- ============================================================================
-- SECTION 5: Seed Service Tiers Data
-- ============================================================================

-- Delete existing tiers (if re-running)
-- DELETE FROM service_tiers WHERE slug IN ('cursive-data', 'cursive-outbound', 'cursive-pipeline', 'cursive-venture-studio');

-- Insert 4 service tiers
INSERT INTO service_tiers (slug, name, display_order, is_public, setup_fee, monthly_price_min, monthly_price_max, description, features, deliverables, platform_features, qualification_required, onboarding_required, contract_required)
VALUES

-- Tier 1: Cursive Data
(
  'cursive-data',
  'Cursive Data',
  1,
  true,
  0,
  1000,
  1000,
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
  true,
  false
),

-- Tier 2: Cursive Outbound
(
  'cursive-outbound',
  'Cursive Outbound',
  2,
  true,
  0,
  2500,
  2500,
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

-- Tier 3: Cursive Automated Pipeline
(
  'cursive-pipeline',
  'Cursive Automated Pipeline',
  3,
  true,
  0,
  5000,
  5000,
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

-- Tier 4: Cursive Venture Studio (PRIVATE - NOT PUBLIC)
(
  'cursive-venture-studio',
  'Cursive Venture Studio',
  4,
  false,
  0,
  25000,
  150000,
  'Use our custom AI infrastructure & software while we provide white-glove onboarding service, delivering a full growth partnership. Cursive becomes your growth team, building you a site, integrating tracking pixels, creating custom ICP-aligned audiences, enriching leads, crafting email campaigns for outbound, and booking your leads to your calendar. All you do is close & sell them.',
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
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  is_public = EXCLUDED.is_public,
  setup_fee = EXCLUDED.setup_fee,
  monthly_price_min = EXCLUDED.monthly_price_min,
  monthly_price_max = EXCLUDED.monthly_price_max,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  deliverables = EXCLUDED.deliverables,
  platform_features = EXCLUDED.platform_features,
  qualification_required = EXCLUDED.qualification_required,
  onboarding_required = EXCLUDED.onboarding_required,
  contract_required = EXCLUDED.contract_required;

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify deployment was successful
-- ============================================================================

-- Check service_tiers table exists and has 4 rows
SELECT COUNT(*) as tier_count FROM service_tiers;
-- Expected: 4

-- View all service tiers
SELECT slug, name, monthly_price_min, is_public, onboarding_required FROM service_tiers ORDER BY display_order;

-- Check service_subscriptions table exists
SELECT COUNT(*) FROM service_subscriptions;
-- Expected: 0 (empty initially)

-- Check service_deliveries table exists
SELECT COUNT(*) FROM service_deliveries;
-- Expected: 0 (empty initially)

-- Check storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'service-deliveries';
-- Expected: 1 row

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('service_tiers', 'service_subscriptions', 'service_deliveries');
-- Expected: All should have rowsecurity = true

-- Check indexes exist
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('service_subscriptions', 'service_deliveries')
ORDER BY indexname;
-- Expected: 5 indexes total
