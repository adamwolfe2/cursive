-- Migration: DataShopper Integration Schema
-- Based on actual DataShopper API v2 response structure
-- DataShopper is a visitor identification + data enrichment platform (NOT intent-based lead queries)

-- ============================================================================
-- UPDATE LEADS TABLE WITH DATASHOPPER FIELDS
-- ============================================================================

-- Drop columns from previous migration that don't apply to DataShopper
-- (intent_topic, intent_score are NOT provided by DataShopper)
ALTER TABLE leads DROP COLUMN IF EXISTS intent_topic CASCADE;
ALTER TABLE leads DROP COLUMN IF EXISTS intent_topic_id CASCADE;
ALTER TABLE leads DROP COLUMN IF EXISTS intent_score CASCADE;
ALTER TABLE leads DROP COLUMN IF EXISTS intent_signals CASCADE;

-- Core identity fields from DataShopper
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS datashopper_id BIGINT, -- Their internal ID
ADD COLUMN IF NOT EXISTS validated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_phone BOOLEAN DEFAULT false;

-- Geographic codes (DataShopper provides these)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS zip4 VARCHAR(10),
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS dpbc VARCHAR(10),
ADD COLUMN IF NOT EXISTS carrier_route VARCHAR(10),
ADD COLUMN IF NOT EXISTS fips_state_code VARCHAR(5),
ADD COLUMN IF NOT EXISTS fips_county_code VARCHAR(5),
ADD COLUMN IF NOT EXISTS county_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS address_type VARCHAR(10),
ADD COLUMN IF NOT EXISTS cbsa VARCHAR(10),
ADD COLUMN IF NOT EXISTS census_tract VARCHAR(20),
ADD COLUMN IF NOT EXISTS census_block_group VARCHAR(5),
ADD COLUMN IF NOT EXISTS census_block VARCHAR(10),
ADD COLUMN IF NOT EXISTS dma INTEGER,
ADD COLUMN IF NOT EXISTS congressional_district VARCHAR(10),
ADD COLUMN IF NOT EXISTS urbanicity_code VARCHAR(5);

-- Demographics from DataShopper
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS generation VARCHAR(50),
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS religion VARCHAR(50),
ADD COLUMN IF NOT EXISTS language VARCHAR(50),
ADD COLUMN IF NOT EXISTS speaks_english BOOLEAN,
ADD COLUMN IF NOT EXISTS multilingual BOOLEAN,
ADD COLUMN IF NOT EXISTS education VARCHAR(100),
ADD COLUMN IF NOT EXISTS urbanicity VARCHAR(50),
ADD COLUMN IF NOT EXISTS ethnicity_detail VARCHAR(100),
ADD COLUMN IF NOT EXISTS ethnic_group VARCHAR(50);

-- Household data
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS household_adults INTEGER,
ADD COLUMN IF NOT EXISTS household_persons INTEGER,
ADD COLUMN IF NOT EXISTS household_has_children BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS household_child_age_0_3 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS household_child_age_4_6 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS household_child_age_7_9 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS household_child_age_10_12 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS household_child_age_13_18 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS household_veteran BOOLEAN DEFAULT false;

-- Financial data
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS income_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS household_income VARCHAR(100),
ADD COLUMN IF NOT EXISTS household_income_midpoint INTEGER,
ADD COLUMN IF NOT EXISTS median_income INTEGER,
ADD COLUMN IF NOT EXISTS credit_range VARCHAR(50),
ADD COLUMN IF NOT EXISTS credit_midpoint INTEGER,
ADD COLUMN IF NOT EXISTS household_net_worth VARCHAR(100),
ADD COLUMN IF NOT EXISTS household_net_worth_midpoint INTEGER,
ADD COLUMN IF NOT EXISTS has_credit_card BOOLEAN,
ADD COLUMN IF NOT EXISTS has_bank_card BOOLEAN,
ADD COLUMN IF NOT EXISTS has_premium_card BOOLEAN,
ADD COLUMN IF NOT EXISTS has_amex_card BOOLEAN,
ADD COLUMN IF NOT EXISTS owns_investments BOOLEAN,
ADD COLUMN IF NOT EXISTS owns_stocks_bonds BOOLEAN,
ADD COLUMN IF NOT EXISTS owns_mutual_funds BOOLEAN,
ADD COLUMN IF NOT EXISTS is_investor BOOLEAN;

-- Property data
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS home_ownership VARCHAR(50),
ADD COLUMN IF NOT EXISTS home_value INTEGER,
ADD COLUMN IF NOT EXISTS median_home_value INTEGER,
ADD COLUMN IF NOT EXISTS mortgage_amount INTEGER,
ADD COLUMN IF NOT EXISTS mortgage_refinance_amount INTEGER,
ADD COLUMN IF NOT EXISTS mortgage_refinance_age INTEGER,
ADD COLUMN IF NOT EXISTS length_of_residence INTEGER,
ADD COLUMN IF NOT EXISTS dwelling_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS single_family_dwelling BOOLEAN,
ADD COLUMN IF NOT EXISTS home_purchased_years_ago INTEGER,
ADD COLUMN IF NOT EXISTS owns_swimming_pool BOOLEAN;

-- Occupation data
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS occupation_detail VARCHAR(100),
ADD COLUMN IF NOT EXISTS occupation_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS occupation_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_white_collar BOOLEAN,
ADD COLUMN IF NOT EXISTS is_blue_collar BOOLEAN;

-- Vehicle summary
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS household_vehicles INTEGER,
ADD COLUMN IF NOT EXISTS vehicle_type_suv BOOLEAN,
ADD COLUMN IF NOT EXISTS vehicle_type_sedan BOOLEAN,
ADD COLUMN IF NOT EXISTS vehicle_class_luxury BOOLEAN,
ADD COLUMN IF NOT EXISTS vehicle_year_earliest INTEGER,
ADD COLUMN IF NOT EXISTS vehicle_year_latest INTEGER;

-- Financial power summary
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS discretionary_income VARCHAR(100),
ADD COLUMN IF NOT EXISTS financial_power INTEGER; -- 1-10 scale

-- DataShopper metadata
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS datashopper_source_number INTEGER,
ADD COLUMN IF NOT EXISTS datashopper_eagles_18_segment VARCHAR(100),
ADD COLUMN IF NOT EXISTS datashopper_eagles_60_segment VARCHAR(100),
ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS enrichment_method VARCHAR(50); -- email, phone, ip, pii, visitor, etc.

-- ============================================================================
-- CREATE LEAD EMAILS TABLE (multiple emails per lead)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  md5_hash VARCHAR(64),
  opt_in BOOLEAN,
  quality_level INTEGER, -- 0-4 scale
  rank_order INTEGER, -- 1 = primary
  register_date DATE,
  update_date DATE,
  ip_address VARCHAR(45),
  source_url VARCHAR(500),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lead_id, email)
);

-- ============================================================================
-- CREATE LEAD PHONES TABLE (multiple phones per lead)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  phone_type INTEGER, -- 0=unknown, 1=landline, 3=mobile
  phone_type_label VARCHAR(20), -- 'landline', 'mobile', 'unknown'
  is_work_phone BOOLEAN DEFAULT false,
  dnc_status BOOLEAN DEFAULT false, -- Do Not Call registry
  carrier VARCHAR(100),
  contactability_score VARCHAR(5), -- A-K scale (A best)
  activity_status VARCHAR(10), -- A1, A7 = active, I4 = inactive
  quality_level INTEGER, -- 0-4 scale
  rank_order INTEGER, -- 1 = primary
  added_date DATE,
  update_date DATE,
  last_seen_date DATE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lead_id, phone)
);

-- ============================================================================
-- CREATE LEAD COMPANIES TABLE (B2B company associations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  job_title VARCHAR(255), -- "PRINCIPAL", "OWNER", "CEO", etc.
  company_name VARCHAR(255) NOT NULL,
  company_address VARCHAR(500),
  company_city VARCHAR(100),
  company_state VARCHAR(50),
  company_zip VARCHAR(20),
  company_phone VARCHAR(20),
  company_email VARCHAR(255),
  linkedin_url VARCHAR(500),
  sic_code VARCHAR(10), -- Standard Industrial Classification
  sic_description VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lead_id, company_name, job_title)
);

-- ============================================================================
-- CREATE LEAD VEHICLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  vin VARCHAR(20),
  make VARCHAR(50),
  model VARCHAR(100),
  manufacturer VARCHAR(100),
  manufacturer_origin VARCHAR(50), -- "European", "American", "Asian"
  year INTEGER,
  fuel_type VARCHAR(10), -- G=gas, D=diesel, E=electric, H=hybrid
  msrp INTEGER,
  style VARCHAR(200),
  body_type VARCHAR(50), -- SUV, Sedan, Truck, etc.
  vehicle_class VARCHAR(50), -- Luxury, Economy, etc.
  doors INTEGER,
  drive_type VARCHAR(10), -- AWD, FWD, RWD
  vehicle_type VARCHAR(50),
  size VARCHAR(50), -- Compact, Mid-Size, Full-Size
  trim VARCHAR(100),
  engine_cylinders INTEGER,
  transmission_type VARCHAR(5), -- A=auto, M=manual
  transmission_gears INTEGER,
  gvw_range VARCHAR(50),
  rank_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lead_id, vin)
);

-- ============================================================================
-- CREATE LEAD INTERESTS TABLE (100+ boolean interest fields)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_interests (
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  interest_key VARCHAR(100) NOT NULL, -- e.g., 'carsInterest', 'golf', 'travel'
  interest_value BOOLEAN DEFAULT true,
  affinity_score INTEGER, -- 1-5 scale where applicable
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (lead_id, interest_key)
);

-- ============================================================================
-- CREATE VISITOR SESSIONS TABLE (for pixel tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  datashopper_id BIGINT,
  visitor_ip VARCHAR(45),
  page_url VARCHAR(1000),
  page_path VARCHAR(500),
  referrer_url VARCHAR(1000),
  user_agent TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  session_start TIMESTAMPTZ DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  page_views INTEGER DEFAULT 1,
  identified BOOLEAN DEFAULT false,
  identified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE DATASHOPPER PIXELS TABLE (pixel management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS datashopper_pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  website_slug VARCHAR(100) NOT NULL UNIQUE,
  website_url VARCHAR(500) NOT NULL,
  filter_type VARCHAR(10) DEFAULT 'include', -- 'include' or 'exclude'
  routes TEXT[], -- Array of paths to include/exclude
  utm_filters JSONB DEFAULT '{}', -- campaign_source, campaign_medium, etc.
  zip_code_filter_type VARCHAR(10), -- 'include' or 'exclude'
  zip_codes TEXT[], -- Array of zip codes
  pixel_script TEXT, -- The actual JS snippet
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE DATASHOPPER BLACKLISTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS datashopper_blacklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  pixel_id UUID NOT NULL REFERENCES datashopper_pixels(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  blacklist_type VARCHAR(20) NOT NULL, -- 'email' or 'address'
  entries TEXT[] NOT NULL, -- Array of emails or addresses
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE ENRICHMENT JOBS TABLE (track batch enrichment)
-- ============================================================================

CREATE TABLE IF NOT EXISTS enrichment_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL, -- 'email', 'phone', 'pii', 'id', 'md5', 'ip'
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  matched_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  input_data JSONB, -- The input records
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Lead indexes
CREATE INDEX IF NOT EXISTS idx_leads_datashopper_id ON leads(datashopper_id);
CREATE INDEX IF NOT EXISTS idx_leads_zip ON leads(postal_code);
CREATE INDEX IF NOT EXISTS idx_leads_city_state ON leads(city, state);
CREATE INDEX IF NOT EXISTS idx_leads_fips ON leads(fips_state_code, fips_county_code);
CREATE INDEX IF NOT EXISTS idx_leads_dma ON leads(dma);
CREATE INDEX IF NOT EXISTS idx_leads_occupation ON leads(occupation_category);
CREATE INDEX IF NOT EXISTS idx_leads_income ON leads(income_level);
CREATE INDEX IF NOT EXISTS idx_leads_home_value ON leads(home_value);
CREATE INDEX IF NOT EXISTS idx_leads_enriched_at ON leads(enriched_at);

-- Email/Phone indexes
CREATE INDEX IF NOT EXISTS idx_lead_emails_email ON lead_emails(email);
CREATE INDEX IF NOT EXISTS idx_lead_emails_md5 ON lead_emails(md5_hash);
CREATE INDEX IF NOT EXISTS idx_lead_emails_workspace ON lead_emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lead_phones_phone ON lead_phones(phone);
CREATE INDEX IF NOT EXISTS idx_lead_phones_workspace ON lead_phones(workspace_id);

-- Company indexes
CREATE INDEX IF NOT EXISTS idx_lead_companies_sic ON lead_companies(sic_code);
CREATE INDEX IF NOT EXISTS idx_lead_companies_name ON lead_companies(company_name);
CREATE INDEX IF NOT EXISTS idx_lead_companies_title ON lead_companies(job_title);
CREATE INDEX IF NOT EXISTS idx_lead_companies_workspace ON lead_companies(workspace_id);

-- Vehicle indexes
CREATE INDEX IF NOT EXISTS idx_lead_vehicles_make ON lead_vehicles(make);
CREATE INDEX IF NOT EXISTS idx_lead_vehicles_year ON lead_vehicles(year);
CREATE INDEX IF NOT EXISTS idx_lead_vehicles_workspace ON lead_vehicles(workspace_id);

-- Interest indexes
CREATE INDEX IF NOT EXISTS idx_lead_interests_key ON lead_interests(interest_key);
CREATE INDEX IF NOT EXISTS idx_lead_interests_workspace ON lead_interests(workspace_id);

-- Visitor session indexes
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_workspace ON visitor_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_lead ON visitor_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_ip ON visitor_sessions(visitor_ip);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_created ON visitor_sessions(created_at);

-- Pixel indexes
CREATE INDEX IF NOT EXISTS idx_datashopper_pixels_workspace ON datashopper_pixels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_datashopper_pixels_slug ON datashopper_pixels(website_slug);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE lead_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE datashopper_pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE datashopper_blacklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for workspace isolation
CREATE POLICY "Workspace isolation" ON lead_emails
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workspace isolation" ON lead_phones
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workspace isolation" ON lead_companies
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workspace isolation" ON lead_vehicles
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workspace isolation" ON lead_interests
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workspace isolation" ON visitor_sessions
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workspace isolation" ON datashopper_pixels
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workspace isolation" ON datashopper_blacklists
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workspace isolation" ON enrichment_jobs
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get phone type label
CREATE OR REPLACE FUNCTION get_phone_type_label(phone_type INTEGER)
RETURNS VARCHAR(20) AS $$
BEGIN
  RETURN CASE phone_type
    WHEN 0 THEN 'unknown'
    WHEN 1 THEN 'landline'
    WHEN 3 THEN 'mobile'
    ELSE 'unknown'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check contactability (A is best, K is worst)
CREATE OR REPLACE FUNCTION is_highly_contactable(score VARCHAR(5))
RETURNS BOOLEAN AS $$
BEGIN
  RETURN score IN ('A', 'B', 'C', 'D', 'E');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get primary email for a lead
CREATE OR REPLACE FUNCTION get_primary_email(p_lead_id UUID)
RETURNS VARCHAR(255) AS $$
DECLARE
  v_email VARCHAR(255);
BEGIN
  SELECT email INTO v_email
  FROM lead_emails
  WHERE lead_id = p_lead_id
  ORDER BY rank_order ASC NULLS LAST, quality_level DESC NULLS LAST
  LIMIT 1;
  RETURN v_email;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get primary phone for a lead
CREATE OR REPLACE FUNCTION get_primary_phone(p_lead_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  v_phone VARCHAR(20);
BEGIN
  SELECT phone INTO v_phone
  FROM lead_phones
  WHERE lead_id = p_lead_id AND dnc_status = false
  ORDER BY rank_order ASC NULLS LAST, quality_level DESC NULLS LAST
  LIMIT 1;
  RETURN v_phone;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get primary company for a lead
CREATE OR REPLACE FUNCTION get_primary_company(p_lead_id UUID)
RETURNS TABLE (
  company_name VARCHAR(255),
  job_title VARCHAR(255),
  sic_code VARCHAR(10),
  sic_description VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT lc.company_name, lc.job_title, lc.sic_code, lc.sic_description
  FROM lead_companies lc
  WHERE lc.lead_id = p_lead_id
  ORDER BY lc.is_primary DESC, lc.created_at ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE lead_emails IS 'Multiple email addresses per lead from DataShopper enrichment';
COMMENT ON TABLE lead_phones IS 'Multiple phone numbers per lead from DataShopper enrichment';
COMMENT ON TABLE lead_companies IS 'B2B company associations from DataShopper - persons can have multiple company roles';
COMMENT ON TABLE lead_vehicles IS 'Vehicle ownership data from DataShopper';
COMMENT ON TABLE lead_interests IS 'Consumer interests and affinities (100+ categories) from DataShopper';
COMMENT ON TABLE visitor_sessions IS 'Website visitor sessions identified via DataShopper pixel';
COMMENT ON TABLE datashopper_pixels IS 'DataShopper pixel configurations for visitor identification';
COMMENT ON TABLE enrichment_jobs IS 'Batch enrichment job tracking';

COMMENT ON COLUMN lead_phones.contactability_score IS 'A-K scale where A is most contactable, K is least';
COMMENT ON COLUMN lead_phones.activity_status IS 'A1, A7 = active phone, I4 = inactive';
COMMENT ON COLUMN lead_companies.sic_code IS 'Standard Industrial Classification code for industry';
