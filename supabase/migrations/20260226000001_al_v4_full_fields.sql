-- Migration: AudienceLab V4 Full Field Capture
-- Adds all remaining AL V4 pixel fields to the leads table
-- Created: 2026-02-26

-- ============================================================================
-- DEMOGRAPHICS
-- ============================================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS age_range VARCHAR(50),
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
  ADD COLUMN IF NOT EXISTS children VARCHAR(50),
  ADD COLUMN IF NOT EXISTS homeowner BOOLEAN,
  ADD COLUMN IF NOT EXISTS married BOOLEAN,
  ADD COLUMN IF NOT EXISTS personal_zip4 VARCHAR(10);

-- ============================================================================
-- PHONE LISTS (actual number lists, not just DNC flags)
-- ============================================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS all_landlines TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS all_mobiles TEXT[] DEFAULT '{}';

-- ============================================================================
-- PROFESSIONAL / CAREER
-- ============================================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS inferred_years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS company_name_history TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS education_history JSONB;

-- ============================================================================
-- COMPANY EXTENDED FIELDS
-- ============================================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS company_address VARCHAR(500),
  ADD COLUMN IF NOT EXISTS company_city VARCHAR(255),
  ADD COLUMN IF NOT EXISTS company_state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_zip VARCHAR(20),
  ADD COLUMN IF NOT EXISTS company_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS company_sic VARCHAR(20),
  ADD COLUMN IF NOT EXISTS company_naics VARCHAR(20);

-- ============================================================================
-- SOCIAL PROFILES
-- ============================================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS individual_twitter_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS individual_facebook_url VARCHAR(500);

-- ============================================================================
-- PROFILE ATTRIBUTES
-- ============================================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

-- ============================================================================
-- EMAIL IDENTITY HASHES & VERIFIED LISTS
-- ============================================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS sha256_personal_email VARCHAR(64),
  ADD COLUMN IF NOT EXISTS sha256_business_email VARCHAR(64),
  ADD COLUMN IF NOT EXISTS personal_verified_emails TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS business_verified_emails TEXT[] DEFAULT '{}';

-- ============================================================================
-- V4 ENRICHMENT FIELDS (not yet in leads from earlier migrations)
-- ============================================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS net_worth VARCHAR(100),
  ADD COLUMN IF NOT EXISTS income_range VARCHAR(100),
  ADD COLUMN IF NOT EXISTS individual_linkedin_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS job_title_history TEXT;

-- ============================================================================
-- INDEXES FOR MOST-FILTERED NEW FIELDS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_leads_age_range ON leads(age_range);
CREATE INDEX IF NOT EXISTS idx_leads_gender ON leads(gender);
CREATE INDEX IF NOT EXISTS idx_leads_homeowner ON leads(homeowner);
CREATE INDEX IF NOT EXISTS idx_leads_company_sic ON leads(company_sic);
CREATE INDEX IF NOT EXISTS idx_leads_company_naics ON leads(company_naics);
CREATE INDEX IF NOT EXISTS idx_leads_skills ON leads USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_leads_interests ON leads USING GIN(interests);
CREATE INDEX IF NOT EXISTS idx_leads_all_mobiles ON leads USING GIN(all_mobiles);
CREATE INDEX IF NOT EXISTS idx_leads_personal_verified_emails ON leads USING GIN(personal_verified_emails);
CREATE INDEX IF NOT EXISTS idx_leads_business_verified_emails ON leads USING GIN(business_verified_emails);
