-- Migration: User-Centric Lead Targeting and Assignments
-- This implements the self-service tier where users select their industry + location
-- and receive auto-routed leads based on their preferences.
--
-- IMPORTANT: This is ADDITIVE - does not modify existing tables.
-- The client_profiles table (from previous migration) can be used for B2B/agency model.
-- This user_targeting table is for the simpler self-service user model.

-- ============================================================================
-- USER TARGETING PREFERENCES
-- When a user signs up, they select their industry and service area
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_targeting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Industry targeting (simple selection)
  target_industries TEXT[] DEFAULT '{}', -- Industry category names: 'Manufacturing', 'Healthcare', etc.
  target_sic_codes TEXT[] DEFAULT '{}', -- Specific SIC codes if they want granular control

  -- Geographic targeting
  target_states TEXT[] DEFAULT '{}', -- State codes: ['CA', 'TX']
  target_cities TEXT[] DEFAULT '{}', -- City names
  target_zips TEXT[] DEFAULT '{}', -- Zip codes

  -- Lead caps (for free tier)
  daily_lead_cap INTEGER DEFAULT 5, -- Free tier default
  weekly_lead_cap INTEGER DEFAULT 25,
  monthly_lead_cap INTEGER DEFAULT 100,

  -- Current counts (reset by scheduled jobs)
  daily_lead_count INTEGER DEFAULT 0,
  weekly_lead_count INTEGER DEFAULT 0,
  monthly_lead_count INTEGER DEFAULT 0,

  -- Notification preferences
  email_notifications BOOLEAN DEFAULT true,
  notification_frequency VARCHAR(20) DEFAULT 'instant', -- 'instant', 'daily_digest', 'weekly_digest'

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One targeting config per user per workspace
  UNIQUE(user_id, workspace_id)
);

-- ============================================================================
-- USER LEAD ASSIGNMENTS
-- Links leads to users (simpler than client_profiles model)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Match details
  matched_industry TEXT, -- Which industry matched
  matched_sic_code TEXT, -- Which SIC code matched
  matched_geo TEXT, -- Which location matched (e.g., "CA" or "Los Angeles")

  -- Source tracking
  source VARCHAR(50) DEFAULT 'auto_route', -- 'auto_route', 'manual', 'campaign', 'import'

  -- User interaction status
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'viewed', 'contacted', 'converted', 'archived'
  viewed_at TIMESTAMPTZ,
  contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,

  -- Notes from user
  user_notes TEXT,

  -- Notification tracking
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,

  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate assignments
  UNIQUE(lead_id, user_id)
);

-- ============================================================================
-- SIMPLE INDUSTRY CATEGORIES (lookup table)
-- For the industry dropdown in user onboarding
-- ============================================================================

-- Check if industry_categories already exists (from previous migration)
-- If so, this will just add missing entries

INSERT INTO industry_categories (category_name, category_slug, sic_codes, description, display_order) VALUES
  ('Real Estate', 'real-estate', ARRAY['6512', '6513', '6531', '6541', '6552', '6553'], 'Real estate agents, brokers, and property management', 1),
  ('Home Services', 'home-services', ARRAY['1711', '1721', '1731', '1751', '1761', '1771', '7349'], 'HVAC, plumbing, electrical, roofing, cleaning', 2),
  ('Healthcare', 'healthcare', ARRAY['8011', '8021', '8031', '8041', '8049', '8062', '8069'], 'Doctors, dentists, clinics, hospitals', 3),
  ('Legal Services', 'legal', ARRAY['8111'], 'Law firms and legal services', 4),
  ('Financial Services', 'financial', ARRAY['6021', '6022', '6211', '6282', '6311', '6411'], 'Banking, insurance, financial advisors', 5),
  ('Manufacturing', 'manufacturing', ARRAY['2011', '2013', '2015', '2024', '2033', '3089', '3559', '3571'], 'Industrial and consumer goods manufacturing', 6),
  ('Technology', 'technology', ARRAY['7371', '7372', '7373', '7374', '7375', '7379'], 'Software, IT services, tech consulting', 7),
  ('Professional Services', 'professional', ARRAY['8711', '8712', '8721', '8742', '8743', '8748'], 'Accounting, engineering, consulting', 8),
  ('Restaurants & Food', 'restaurants', ARRAY['5812', '5813', '5814'], 'Restaurants, bars, catering', 9),
  ('Retail', 'retail', ARRAY['5311', '5411', '5541', '5611', '5621', '5651', '5712', '5731'], 'Retail stores and e-commerce', 10),
  ('Automotive', 'automotive', ARRAY['5511', '5521', '5531', '7532', '7538'], 'Auto dealers and repair shops', 11),
  ('Construction', 'construction', ARRAY['1521', '1522', '1531', '1541', '1542', '1611', '1623'], 'General contractors and builders', 12),
  ('Education', 'education', ARRAY['8211', '8221', '8222', '8243', '8299'], 'Schools, colleges, training', 13),
  ('Hospitality', 'hospitality', ARRAY['7011', '7021', '7032', '7041'], 'Hotels, motels, travel', 14),
  ('Marketing & Advertising', 'marketing', ARRAY['7311', '7312', '7319', '7331'], 'Ad agencies, marketing firms', 15)
ON CONFLICT (category_slug) DO UPDATE SET
  sic_codes = EXCLUDED.sic_codes,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================================================
-- ADD ROLE/PLAN FIELDS TO USERS IF NOT EXISTS
-- ============================================================================

-- These may already exist from initial schema, but ensure they're there
DO $$
BEGIN
  -- Add plan column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'plan') THEN
    ALTER TABLE users ADD COLUMN plan VARCHAR(50) DEFAULT 'free';
  END IF;

  -- Add role column if not exists (should already exist as per exploration)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'member';
  END IF;
END $$;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_targeting_user ON user_targeting(user_id);
CREATE INDEX IF NOT EXISTS idx_user_targeting_workspace ON user_targeting(workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_targeting_industries ON user_targeting USING GIN(target_industries);
CREATE INDEX IF NOT EXISTS idx_user_targeting_states ON user_targeting USING GIN(target_states);
CREATE INDEX IF NOT EXISTS idx_user_targeting_active ON user_targeting(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_lead_assignments_user ON user_lead_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lead_assignments_lead ON user_lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_user_lead_assignments_workspace ON user_lead_assignments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_lead_assignments_status ON user_lead_assignments(status);
CREATE INDEX IF NOT EXISTS idx_user_lead_assignments_date ON user_lead_assignments(assigned_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE user_targeting ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lead_assignments ENABLE ROW LEVEL SECURITY;

-- User targeting: Users can only see/modify their own
CREATE POLICY "Users can view own targeting" ON user_targeting
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert own targeting" ON user_targeting
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own targeting" ON user_targeting
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- User lead assignments: Users can only see their assigned leads
CREATE POLICY "Users can view own assignments" ON user_lead_assignments
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own assignments" ON user_lead_assignments
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Admins can manage all (for manual assignment)
CREATE POLICY "Admins can manage all targeting" ON user_targeting
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can manage all assignments" ON user_lead_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('admin', 'owner')
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get users matching a lead's criteria
CREATE OR REPLACE FUNCTION find_matching_users_for_lead(
  p_lead_id UUID,
  p_workspace_id UUID
) RETURNS TABLE (
  user_id UUID,
  matched_industry TEXT,
  matched_sic TEXT,
  matched_geo TEXT
) AS $$
DECLARE
  v_lead RECORD;
  v_sic_code TEXT;
BEGIN
  -- Get lead data
  SELECT
    l.id,
    l.state_code,
    l.state,
    l.city,
    l.postal_code,
    l.company_industry,
    COALESCE(
      (SELECT lc.sic_code FROM lead_companies lc WHERE lc.lead_id = l.id LIMIT 1),
      NULL
    ) as sic_code
  INTO v_lead
  FROM leads l
  WHERE l.id = p_lead_id;

  IF v_lead IS NULL THEN
    RETURN;
  END IF;

  -- Find matching users
  RETURN QUERY
  SELECT
    ut.user_id,
    -- Match industry by checking if lead's SIC code starts with any target SIC prefix
    CASE
      WHEN v_lead.sic_code IS NOT NULL AND EXISTS (
        SELECT 1 FROM unnest(ut.target_sic_codes) ts
        WHERE v_lead.sic_code LIKE ts || '%'
      ) THEN v_lead.company_industry
      WHEN v_lead.company_industry = ANY(ut.target_industries) THEN v_lead.company_industry
      ELSE NULL
    END as matched_industry,
    -- Match SIC
    CASE
      WHEN v_lead.sic_code IS NOT NULL AND v_lead.sic_code = ANY(ut.target_sic_codes) THEN v_lead.sic_code
      ELSE NULL
    END as matched_sic,
    -- Match geo
    CASE
      WHEN COALESCE(v_lead.state_code, v_lead.state) = ANY(ut.target_states) THEN COALESCE(v_lead.state_code, v_lead.state)
      WHEN v_lead.city = ANY(ut.target_cities) THEN v_lead.city
      WHEN v_lead.postal_code = ANY(ut.target_zips) THEN v_lead.postal_code
      ELSE NULL
    END as matched_geo
  FROM user_targeting ut
  WHERE ut.workspace_id = p_workspace_id
    AND ut.is_active = true
    AND (
      -- Must match on geo
      COALESCE(v_lead.state_code, v_lead.state) = ANY(ut.target_states)
      OR v_lead.city = ANY(ut.target_cities)
      OR v_lead.postal_code = ANY(ut.target_zips)
      OR (array_length(ut.target_states, 1) IS NULL AND array_length(ut.target_cities, 1) IS NULL AND array_length(ut.target_zips, 1) IS NULL)
    )
    AND (
      -- Must match on industry/SIC
      v_lead.company_industry = ANY(ut.target_industries)
      OR (v_lead.sic_code IS NOT NULL AND v_lead.sic_code = ANY(ut.target_sic_codes))
      OR (v_lead.sic_code IS NOT NULL AND EXISTS (
        SELECT 1 FROM unnest(ut.target_sic_codes) ts
        WHERE v_lead.sic_code LIKE ts || '%'
      ))
      OR (array_length(ut.target_industries, 1) IS NULL AND array_length(ut.target_sic_codes, 1) IS NULL)
    )
    -- Check caps
    AND ut.daily_lead_count < COALESCE(ut.daily_lead_cap, 999999)
    AND ut.weekly_lead_count < COALESCE(ut.weekly_lead_cap, 999999)
    AND ut.monthly_lead_count < COALESCE(ut.monthly_lead_cap, 999999);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to reset daily lead counts (call from cron job)
CREATE OR REPLACE FUNCTION reset_user_daily_caps()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE user_targeting
  SET daily_lead_count = 0, updated_at = NOW()
  WHERE daily_lead_count > 0;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to reset weekly lead counts (call on Mondays)
CREATE OR REPLACE FUNCTION reset_user_weekly_caps()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE user_targeting
  SET weekly_lead_count = 0, updated_at = NOW()
  WHERE weekly_lead_count > 0;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly lead counts (call on 1st of month)
CREATE OR REPLACE FUNCTION reset_user_monthly_caps()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE user_targeting
  SET monthly_lead_count = 0, updated_at = NOW()
  WHERE monthly_lead_count > 0;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_targeting IS 'User preferences for lead routing - industry and geographic targeting';
COMMENT ON TABLE user_lead_assignments IS 'Leads assigned to users based on their targeting preferences';
COMMENT ON COLUMN user_targeting.target_industries IS 'Industry category names from industry_categories table';
COMMENT ON COLUMN user_targeting.daily_lead_cap IS 'Maximum leads per day (free tier: 5, pro: unlimited)';
COMMENT ON COLUMN user_lead_assignments.source IS 'How the lead was assigned: auto_route, manual, campaign, import';
COMMENT ON COLUMN user_lead_assignments.status IS 'User interaction status: new, viewed, contacted, converted, archived';
