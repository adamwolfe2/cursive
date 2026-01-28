-- Migration: Lead Routing Platform Schema
-- Implements client targeting, lead routing, and manual upload handling

-- ============================================================================
-- INDUSTRY CATEGORIES (SIC code groupings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS industry_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name VARCHAR(100) NOT NULL UNIQUE,
  category_slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  sic_codes TEXT[] NOT NULL DEFAULT '{}', -- All SIC codes in this category
  parent_category_id UUID REFERENCES industry_categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed industry categories with SIC codes
INSERT INTO industry_categories (category_name, category_slug, sic_codes, description) VALUES
-- Technology & Software
('Technology & Software', 'technology',
 ARRAY['7371', '7372', '7373', '7374', '7375', '7376', '7377', '7378', '7379'],
 'Computer programming, software, data processing, and IT services'),

-- Professional Services
('Professional Services', 'professional-services',
 ARRAY['8711', '8712', '8713', '8721', '8731', '8732', '8733', '8734', '8741', '8742', '8743', '8744', '8748'],
 'Engineering, accounting, legal, consulting, and business services'),

-- Healthcare
('Healthcare', 'healthcare',
 ARRAY['8011', '8021', '8031', '8041', '8042', '8043', '8049', '8051', '8052', '8059', '8062', '8063', '8069', '8071', '8072', '8082', '8092', '8093', '8099'],
 'Medical practices, hospitals, clinics, and healthcare services'),

-- Manufacturing
('Manufacturing', 'manufacturing',
 ARRAY['2011', '2013', '2015', '2021', '2022', '2023', '2024', '2026', '2032', '2033', '2034', '2035', '2037', '2038', '2041', '2043', '2044', '2045', '2046', '2047', '2048', '2051', '2052', '2053', '2061', '2062', '2063', '2064', '2066', '2067', '2068', '2074', '2075', '2076', '2077', '2079', '2082', '2083', '2084', '2085', '2086', '2087', '2091', '2092', '2095', '2096', '2097', '2098', '2099', '3011', '3021', '3052', '3053', '3061', '3069', '3081', '3082', '3083', '3084', '3085', '3086', '3087', '3088', '3089'],
 'Industrial and consumer goods manufacturing'),

-- Construction
('Construction', 'construction',
 ARRAY['1521', '1522', '1531', '1541', '1542', '1611', '1622', '1623', '1629', '1711', '1721', '1731', '1741', '1742', '1743', '1751', '1752', '1761', '1771', '1781', '1791', '1793', '1794', '1795', '1796', '1799'],
 'General contractors, specialty trades, and construction services'),

-- HVAC & Mechanical
('HVAC & Mechanical', 'hvac',
 ARRAY['1711', '3585', '3589', '5074', '5075', '7623'],
 'Heating, ventilation, air conditioning, and refrigeration'),

-- Plumbing
('Plumbing', 'plumbing',
 ARRAY['1711', '3431', '3432', '3433', '5074', '7699'],
 'Plumbing contractors and supplies'),

-- Electrical
('Electrical', 'electrical',
 ARRAY['1731', '3612', '3613', '3621', '3625', '3629', '5063', '7629'],
 'Electrical contractors and equipment'),

-- Roofing
('Roofing', 'roofing',
 ARRAY['1761', '2952', '3292', '5033'],
 'Roofing contractors and materials'),

-- Real Estate
('Real Estate', 'real-estate',
 ARRAY['6512', '6513', '6514', '6515', '6517', '6519', '6531', '6541', '6552', '6553'],
 'Real estate agents, property management, and development'),

-- Financial Services
('Financial Services', 'financial-services',
 ARRAY['6011', '6019', '6021', '6022', '6029', '6035', '6036', '6061', '6062', '6081', '6082', '6091', '6099', '6111', '6141', '6153', '6159', '6162', '6163', '6211', '6221', '6231', '6282', '6289', '6311', '6321', '6324', '6331', '6351', '6361', '6371', '6399', '6411'],
 'Banking, insurance, investment, and financial services'),

-- Retail
('Retail', 'retail',
 ARRAY['5211', '5231', '5251', '5261', '5271', '5311', '5331', '5399', '5411', '5421', '5431', '5441', '5451', '5461', '5499', '5511', '5521', '5531', '5541', '5551', '5561', '5571', '5599', '5611', '5621', '5632', '5641', '5651', '5661', '5699', '5712', '5713', '5714', '5719', '5722', '5731', '5734', '5735', '5736'],
 'Retail stores and e-commerce'),

-- Restaurants & Food Service
('Restaurants & Food Service', 'restaurants',
 ARRAY['5812', '5813', '5814'],
 'Restaurants, bars, and food service'),

-- Automotive
('Automotive', 'automotive',
 ARRAY['5511', '5521', '5531', '5541', '5551', '5561', '5571', '5599', '7532', '7533', '7534', '7536', '7537', '7538', '7539', '7542', '7549'],
 'Auto dealers, repair, and services'),

-- Education
('Education', 'education',
 ARRAY['8211', '8221', '8222', '8231', '8243', '8244', '8249', '8299'],
 'Schools, colleges, and educational services'),

-- Legal Services
('Legal Services', 'legal',
 ARRAY['8111'],
 'Law firms and legal services'),

-- Transportation & Logistics
('Transportation & Logistics', 'transportation',
 ARRAY['4011', '4013', '4111', '4119', '4121', '4131', '4141', '4142', '4151', '4173', '4212', '4213', '4214', '4215', '4221', '4222', '4225', '4226', '4231', '4311', '4412', '4424', '4432', '4449', '4481', '4482', '4489', '4491', '4492', '4493', '4499', '4512', '4513', '4522', '4581', '4582', '4724', '4725', '4729', '4731', '4741', '4783', '4785', '4789'],
 'Trucking, shipping, freight, and logistics'),

-- Hospitality
('Hospitality', 'hospitality',
 ARRAY['7011', '7021', '7032', '7033', '7041', '7992', '7996', '7999'],
 'Hotels, motels, and hospitality services'),

-- Marketing & Advertising
('Marketing & Advertising', 'marketing',
 ARRAY['7311', '7312', '7313', '7319', '7331', '7335', '7336'],
 'Advertising agencies and marketing services'),

-- Agriculture
('Agriculture', 'agriculture',
 ARRAY['0111', '0112', '0115', '0116', '0119', '0131', '0132', '0133', '0134', '0139', '0161', '0171', '0172', '0173', '0174', '0175', '0179', '0181', '0182', '0191', '0211', '0212', '0213', '0214', '0219', '0241', '0251', '0252', '0253', '0254', '0259', '0271', '0272', '0273', '0279', '0291'],
 'Farming, ranching, and agricultural services')

ON CONFLICT (category_slug) DO UPDATE SET
  sic_codes = EXCLUDED.sic_codes,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- CLIENT PROFILES (targeting criteria for lead routing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Client identification
  client_name VARCHAR(255) NOT NULL,
  client_code VARCHAR(50), -- Short code for reporting
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),

  -- Industry targeting
  target_sic_codes TEXT[] DEFAULT '{}', -- Specific SIC codes (e.g., ['7371', '7372'])
  target_industry_categories UUID[] DEFAULT '{}', -- References to industry_categories
  target_sic_prefix TEXT[] DEFAULT '{}', -- SIC prefixes for broader matching (e.g., ['73'] for all 73xx)

  -- Geographic targeting
  target_states TEXT[] DEFAULT '{}', -- State codes (e.g., ['CA', 'TX', 'FL'])
  target_cities TEXT[] DEFAULT '{}', -- City names
  target_zips TEXT[] DEFAULT '{}', -- Zip codes
  target_zip_prefixes TEXT[] DEFAULT '{}', -- Zip prefixes (e.g., ['902', '903'] for LA area)
  target_counties TEXT[] DEFAULT '{}', -- County names
  target_dmas INTEGER[] DEFAULT '{}', -- DMA codes

  -- Radius-based targeting
  target_radius_miles INTEGER, -- Radius in miles
  target_radius_center_lat DECIMAL(10, 7),
  target_radius_center_lng DECIMAL(10, 7),
  target_radius_address TEXT, -- Human-readable center address

  -- Lead caps
  daily_lead_cap INTEGER, -- NULL = unlimited
  weekly_lead_cap INTEGER,
  monthly_lead_cap INTEGER,
  total_lead_cap INTEGER, -- Lifetime cap

  -- Current cap counts (reset by scheduled jobs)
  daily_lead_count INTEGER DEFAULT 0,
  weekly_lead_count INTEGER DEFAULT 0,
  monthly_lead_count INTEGER DEFAULT 0,
  total_lead_count INTEGER DEFAULT 0,
  cap_reset_day INTEGER DEFAULT 1, -- Day of month to reset monthly cap

  -- Routing configuration
  routing_priority INTEGER DEFAULT 100, -- Lower = higher priority
  routing_weight INTEGER DEFAULT 1, -- For weighted round-robin
  is_exclusive BOOLEAN DEFAULT false, -- If true, lead won't route to other clients

  -- Lead filtering
  min_quality_score INTEGER, -- Minimum DataShopper quality score
  require_email BOOLEAN DEFAULT false,
  require_phone BOOLEAN DEFAULT false,
  require_company BOOLEAN DEFAULT false,
  excluded_domains TEXT[] DEFAULT '{}', -- Competitor domains to exclude

  -- Delivery configuration
  webhook_url TEXT,
  webhook_secret TEXT,
  notification_emails TEXT[] DEFAULT '{}',
  delivery_format VARCHAR(20) DEFAULT 'json', -- 'json', 'csv', 'email'

  -- Status
  is_active BOOLEAN DEFAULT true,
  paused_at TIMESTAMPTZ,
  paused_reason TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, client_code)
);

-- ============================================================================
-- LEAD SOURCES (pixels, uploads, API pushes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  source_type VARCHAR(50) NOT NULL, -- 'datashopper_pixel', 'manual_upload', 'api_push', 'csv_import', 'webhook'
  source_name VARCHAR(255) NOT NULL,
  source_code VARCHAR(50), -- Short code for tracking

  -- DataShopper pixel info
  datashopper_pixel_id TEXT,
  website_url TEXT,
  pixel_script TEXT,

  -- Implied intent from this source
  implied_intent_category UUID REFERENCES industry_categories(id),
  implied_sic_codes TEXT[] DEFAULT '{}',
  implied_intent_score VARCHAR(20) DEFAULT 'warm', -- 'hot', 'warm', 'cold'

  -- Statistics
  total_leads_received INTEGER DEFAULT 0,
  total_leads_matched INTEGER DEFAULT 0,
  total_leads_unroutable INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LEAD ASSIGNMENTS (routing decisions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,

  -- Match details
  matched_sic_codes TEXT[] DEFAULT '{}', -- Which SIC codes matched
  matched_industry_category UUID REFERENCES industry_categories(id),
  matched_geo_type VARCHAR(50), -- 'state', 'city', 'zip', 'radius', 'dma', 'county'
  matched_geo_value TEXT, -- The actual value that matched
  match_score INTEGER DEFAULT 0, -- Composite score for ranking

  -- Assignment metadata
  routing_priority_at_time INTEGER,
  was_exclusive BOOLEAN DEFAULT false,
  assignment_reason TEXT, -- Human-readable explanation

  -- Delivery status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'delivered', 'accepted', 'rejected', 'bounced', 'error'
  delivered_at TIMESTAMPTZ,
  delivery_method VARCHAR(50), -- 'webhook', 'email', 'api', 'manual'
  delivery_response JSONB, -- Webhook response or error details
  delivery_attempts INTEGER DEFAULT 0,
  last_delivery_attempt TIMESTAMPTZ,

  -- Client response
  client_response_at TIMESTAMPTZ,
  client_accepted BOOLEAN,
  client_rejection_reason TEXT,
  client_notes TEXT,

  -- Re-routing
  rerouted_from_assignment_id UUID REFERENCES lead_assignments(id),
  rerouted_at TIMESTAMPTZ,
  reroute_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate assignments
  UNIQUE(lead_id, client_profile_id)
);

-- ============================================================================
-- UNROUTABLE LEADS (leads that couldn't be matched)
-- ============================================================================

CREATE TABLE IF NOT EXISTS unroutable_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Reason for being unroutable
  reason VARCHAR(100) NOT NULL, -- 'no_sic', 'no_geo', 'no_matching_client', 'all_clients_capped', 'duplicate', 'filtered', 'quality_too_low'
  reason_details TEXT,

  -- Data snapshot at time of routing attempt
  lead_sic_codes TEXT[] DEFAULT '{}',
  lead_city TEXT,
  lead_state TEXT,
  lead_zip TEXT,
  lead_quality_score INTEGER,

  -- Clients that were considered
  considered_client_ids UUID[] DEFAULT '{}',
  rejection_reasons JSONB, -- { client_id: reason }

  -- Status
  status VARCHAR(50) DEFAULT 'unprocessed', -- 'unprocessed', 'manually_routed', 'expired', 'ignored'
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES users(id),
  manually_assigned_to UUID REFERENCES client_profiles(id),

  -- Auto-retry
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  last_retry_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(lead_id)
);

-- ============================================================================
-- UPLOAD JOBS (manual data imports)
-- ============================================================================

CREATE TABLE IF NOT EXISTS upload_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),

  -- File info
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT, -- Storage URL
  file_size_bytes BIGINT,
  file_type VARCHAR(50), -- 'csv', 'xlsx', 'json'

  -- Field mappings
  field_mappings JSONB NOT NULL DEFAULT '[]',
  -- Format: [{ sourceColumn: 'Email Address', targetField: 'email', transform: 'lowercase' }, ...]

  -- Import configuration
  source_id UUID REFERENCES lead_sources(id), -- Which source to attribute leads to
  default_source_name VARCHAR(255),
  skip_invalid_rows BOOLEAN DEFAULT true,
  dedupe_strategy VARCHAR(50) DEFAULT 'email', -- 'email', 'phone', 'name_address', 'none'
  dedupe_window_days INTEGER DEFAULT 30, -- Check for dupes in last X days

  -- Processing status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'mapping', 'validating', 'processing', 'completed', 'failed', 'cancelled'

  -- Statistics
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  valid_rows INTEGER DEFAULT 0,
  invalid_rows INTEGER DEFAULT 0,
  duplicate_rows INTEGER DEFAULT 0,
  created_leads INTEGER DEFAULT 0,
  routed_leads INTEGER DEFAULT 0,
  unroutable_leads INTEGER DEFAULT 0,

  -- Preview data (first 10 rows)
  preview_data JSONB,
  detected_columns TEXT[] DEFAULT '{}',

  -- Error tracking
  error_message TEXT,
  error_log JSONB DEFAULT '[]', -- Array of { row: number, error: string, data: {} }

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- UPLOAD FIELD MAPPING TEMPLATES (reusable mappings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS upload_mapping_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  template_name VARCHAR(255) NOT NULL,
  description TEXT,
  field_mappings JSONB NOT NULL DEFAULT '[]',

  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, template_name)
);

-- ============================================================================
-- ROUTING AUDIT LOG (detailed routing decisions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS routing_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Routing decision
  action VARCHAR(50) NOT NULL, -- 'matched', 'unroutable', 'rerouted', 'manual_assignment', 'cap_reached'

  -- Details
  matched_clients JSONB, -- Array of { client_id, score, reasons }
  selected_client_id UUID REFERENCES client_profiles(id),
  selection_reason TEXT,

  -- Context at decision time
  lead_snapshot JSONB, -- Relevant lead data at routing time
  client_caps_snapshot JSONB, -- Cap status of considered clients

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LEAD DEDUPLICATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_dedupe_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Dedupe keys
  email_key VARCHAR(255), -- Normalized email
  phone_key VARCHAR(20), -- Normalized phone (digits only)
  name_address_key VARCHAR(500), -- Normalized name + address hash

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, email_key),
  UNIQUE(workspace_id, phone_key)
);

-- Add index for name_address lookups (can't be unique due to potential false positives)
CREATE INDEX IF NOT EXISTS idx_lead_dedupe_name_address ON lead_dedupe_keys(workspace_id, name_address_key);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Industry categories
CREATE INDEX IF NOT EXISTS idx_industry_categories_sic ON industry_categories USING GIN(sic_codes);

-- Client profiles
CREATE INDEX IF NOT EXISTS idx_client_profiles_workspace ON client_profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_active ON client_profiles(workspace_id, is_active);
CREATE INDEX IF NOT EXISTS idx_client_profiles_sic ON client_profiles USING GIN(target_sic_codes);
CREATE INDEX IF NOT EXISTS idx_client_profiles_states ON client_profiles USING GIN(target_states);
CREATE INDEX IF NOT EXISTS idx_client_profiles_zips ON client_profiles USING GIN(target_zips);
CREATE INDEX IF NOT EXISTS idx_client_profiles_priority ON client_profiles(routing_priority);

-- Lead sources
CREATE INDEX IF NOT EXISTS idx_lead_sources_workspace ON lead_sources(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lead_sources_type ON lead_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_lead_sources_pixel ON lead_sources(datashopper_pixel_id);

-- Lead assignments
CREATE INDEX IF NOT EXISTS idx_lead_assignments_workspace ON lead_assignments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead ON lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_client ON lead_assignments(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_status ON lead_assignments(status);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_created ON lead_assignments(created_at);

-- Unroutable leads
CREATE INDEX IF NOT EXISTS idx_unroutable_leads_workspace ON unroutable_leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_unroutable_leads_reason ON unroutable_leads(reason);
CREATE INDEX IF NOT EXISTS idx_unroutable_leads_status ON unroutable_leads(status);
CREATE INDEX IF NOT EXISTS idx_unroutable_leads_retry ON unroutable_leads(next_retry_at) WHERE status = 'unprocessed';

-- Upload jobs
CREATE INDEX IF NOT EXISTS idx_upload_jobs_workspace ON upload_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_upload_jobs_status ON upload_jobs(status);
CREATE INDEX IF NOT EXISTS idx_upload_jobs_created ON upload_jobs(created_at);

-- Routing audit
CREATE INDEX IF NOT EXISTS idx_routing_audit_workspace ON routing_audit_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_routing_audit_lead ON routing_audit_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_routing_audit_created ON routing_audit_log(created_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE industry_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE unroutable_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_mapping_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_dedupe_keys ENABLE ROW LEVEL SECURITY;

-- Industry categories are global (readable by all)
CREATE POLICY "Industry categories are viewable by all" ON industry_categories
  FOR SELECT USING (true);

-- Workspace isolation for all other tables
CREATE POLICY "Workspace isolation" ON client_profiles
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workspace isolation" ON lead_sources
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workspace isolation" ON lead_assignments
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workspace isolation" ON unroutable_leads
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workspace isolation" ON upload_jobs
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workspace isolation" ON upload_mapping_templates
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workspace isolation" ON routing_audit_log
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workspace isolation" ON lead_dedupe_keys
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a SIC code matches client targeting
CREATE OR REPLACE FUNCTION matches_sic_targeting(
  p_sic_code TEXT,
  p_target_sic_codes TEXT[],
  p_target_sic_prefixes TEXT[],
  p_target_category_ids UUID[]
) RETURNS BOOLEAN AS $$
DECLARE
  v_prefix TEXT;
  v_category_id UUID;
BEGIN
  -- Check exact SIC code match
  IF p_sic_code = ANY(p_target_sic_codes) THEN
    RETURN TRUE;
  END IF;

  -- Check SIC prefix match
  FOREACH v_prefix IN ARRAY p_target_sic_prefixes LOOP
    IF p_sic_code LIKE v_prefix || '%' THEN
      RETURN TRUE;
    END IF;
  END LOOP;

  -- Check industry category match
  FOREACH v_category_id IN ARRAY p_target_category_ids LOOP
    IF EXISTS (
      SELECT 1 FROM industry_categories
      WHERE id = v_category_id AND p_sic_code = ANY(sic_codes)
    ) THEN
      RETURN TRUE;
    END IF;
  END LOOP;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if a location matches client targeting
CREATE OR REPLACE FUNCTION matches_geo_targeting(
  p_state TEXT,
  p_city TEXT,
  p_zip TEXT,
  p_lat DECIMAL,
  p_lng DECIMAL,
  p_dma INTEGER,
  p_county TEXT,
  p_target_states TEXT[],
  p_target_cities TEXT[],
  p_target_zips TEXT[],
  p_target_zip_prefixes TEXT[],
  p_target_dmas INTEGER[],
  p_target_counties TEXT[],
  p_target_radius_miles INTEGER,
  p_target_radius_lat DECIMAL,
  p_target_radius_lng DECIMAL
) RETURNS TABLE (matched BOOLEAN, match_type TEXT, match_value TEXT) AS $$
DECLARE
  v_distance DECIMAL;
  v_prefix TEXT;
BEGIN
  -- Check state match
  IF p_state = ANY(p_target_states) THEN
    RETURN QUERY SELECT TRUE, 'state'::TEXT, p_state;
    RETURN;
  END IF;

  -- Check city match (case-insensitive)
  IF LOWER(p_city) = ANY(SELECT LOWER(unnest(p_target_cities))) THEN
    RETURN QUERY SELECT TRUE, 'city'::TEXT, p_city;
    RETURN;
  END IF;

  -- Check exact zip match
  IF p_zip = ANY(p_target_zips) THEN
    RETURN QUERY SELECT TRUE, 'zip'::TEXT, p_zip;
    RETURN;
  END IF;

  -- Check zip prefix match
  FOREACH v_prefix IN ARRAY p_target_zip_prefixes LOOP
    IF p_zip LIKE v_prefix || '%' THEN
      RETURN QUERY SELECT TRUE, 'zip_prefix'::TEXT, v_prefix;
      RETURN;
    END IF;
  END LOOP;

  -- Check DMA match
  IF p_dma = ANY(p_target_dmas) THEN
    RETURN QUERY SELECT TRUE, 'dma'::TEXT, p_dma::TEXT;
    RETURN;
  END IF;

  -- Check county match (case-insensitive)
  IF LOWER(p_county) = ANY(SELECT LOWER(unnest(p_target_counties))) THEN
    RETURN QUERY SELECT TRUE, 'county'::TEXT, p_county;
    RETURN;
  END IF;

  -- Check radius match (using Haversine formula)
  IF p_target_radius_miles IS NOT NULL AND p_target_radius_lat IS NOT NULL AND p_target_radius_lng IS NOT NULL AND p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
    v_distance := 3959 * acos(
      cos(radians(p_target_radius_lat)) * cos(radians(p_lat)) *
      cos(radians(p_lng) - radians(p_target_radius_lng)) +
      sin(radians(p_target_radius_lat)) * sin(radians(p_lat))
    );
    IF v_distance <= p_target_radius_miles THEN
      RETURN QUERY SELECT TRUE, 'radius'::TEXT, ROUND(v_distance::NUMERIC, 1)::TEXT || ' miles';
      RETURN;
    END IF;
  END IF;

  -- No match
  RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to increment client lead counts
CREATE OR REPLACE FUNCTION increment_client_lead_count(p_client_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE client_profiles
  SET
    daily_lead_count = daily_lead_count + 1,
    weekly_lead_count = weekly_lead_count + 1,
    monthly_lead_count = monthly_lead_count + 1,
    total_lead_count = total_lead_count + 1,
    updated_at = NOW()
  WHERE id = p_client_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if client is at cap
CREATE OR REPLACE FUNCTION is_client_at_cap(p_client_id UUID)
RETURNS TABLE (at_cap BOOLEAN, cap_type TEXT) AS $$
DECLARE
  v_client client_profiles;
BEGIN
  SELECT * INTO v_client FROM client_profiles WHERE id = p_client_id;

  IF v_client.daily_lead_cap IS NOT NULL AND v_client.daily_lead_count >= v_client.daily_lead_cap THEN
    RETURN QUERY SELECT TRUE, 'daily'::TEXT;
    RETURN;
  END IF;

  IF v_client.weekly_lead_cap IS NOT NULL AND v_client.weekly_lead_count >= v_client.weekly_lead_cap THEN
    RETURN QUERY SELECT TRUE, 'weekly'::TEXT;
    RETURN;
  END IF;

  IF v_client.monthly_lead_cap IS NOT NULL AND v_client.monthly_lead_count >= v_client.monthly_lead_cap THEN
    RETURN QUERY SELECT TRUE, 'monthly'::TEXT;
    RETURN;
  END IF;

  IF v_client.total_lead_cap IS NOT NULL AND v_client.total_lead_count >= v_client.total_lead_cap THEN
    RETURN QUERY SELECT TRUE, 'total'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT FALSE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to reset daily caps (call from cron job)
CREATE OR REPLACE FUNCTION reset_daily_lead_caps()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE client_profiles
  SET daily_lead_count = 0, updated_at = NOW()
  WHERE daily_lead_count > 0;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to reset weekly caps (call from cron job on Mondays)
CREATE OR REPLACE FUNCTION reset_weekly_lead_caps()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE client_profiles
  SET weekly_lead_count = 0, updated_at = NOW()
  WHERE weekly_lead_count > 0;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly caps (call from cron job on 1st of month)
CREATE OR REPLACE FUNCTION reset_monthly_lead_caps()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE client_profiles
  SET monthly_lead_count = 0, updated_at = NOW()
  WHERE monthly_lead_count > 0;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE industry_categories IS 'Industry categories with SIC code mappings for lead targeting';
COMMENT ON TABLE client_profiles IS 'Client targeting profiles with industry, geography, and cap settings';
COMMENT ON TABLE lead_sources IS 'Tracking for lead origins - pixels, uploads, API pushes';
COMMENT ON TABLE lead_assignments IS 'Lead-to-client routing assignments with delivery tracking';
COMMENT ON TABLE unroutable_leads IS 'Leads that could not be matched to any client';
COMMENT ON TABLE upload_jobs IS 'Manual file upload import jobs with field mappings';
COMMENT ON TABLE routing_audit_log IS 'Detailed audit trail of all routing decisions';
COMMENT ON TABLE lead_dedupe_keys IS 'Normalized keys for lead deduplication';

COMMENT ON COLUMN client_profiles.target_sic_codes IS 'Specific 4-digit SIC codes to match';
COMMENT ON COLUMN client_profiles.target_sic_prefix IS 'SIC prefixes for broader matching (e.g., 73 matches all 73xx)';
COMMENT ON COLUMN client_profiles.routing_priority IS 'Lower number = higher priority for routing';
COMMENT ON COLUMN client_profiles.is_exclusive IS 'If true, matched leads will not also route to other clients';
