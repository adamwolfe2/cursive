-- Migration: Add Lead Data Fields for DataShopper Integration
-- Adds comprehensive fields for person and company data display

-- ============================================================================
-- ADD NEW COLUMNS TO LEADS TABLE
-- ============================================================================

-- Person/Contact fields (for displaying person-centric lead information)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS contact_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_seniority VARCHAR(100),
ADD COLUMN IF NOT EXISTS contact_department VARCHAR(100);

-- Company detail fields
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_size VARCHAR(100), -- e.g., "501 to 1000", "11-50"
ADD COLUMN IF NOT EXISTS company_revenue VARCHAR(100), -- e.g., "100 Million to 250 Million"
ADD COLUMN IF NOT EXISTS company_website VARCHAR(500),
ADD COLUMN IF NOT EXISTS company_employee_count INTEGER,
ADD COLUMN IF NOT EXISTS company_founded_year INTEGER,
ADD COLUMN IF NOT EXISTS company_description TEXT;

-- Location fields (flattened for easier querying)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS city VARCHAR(255),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS state_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'US',
ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT 'US',
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Intent/Topic fields
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS intent_topic VARCHAR(255), -- The topic the person showed intent for
ADD COLUMN IF NOT EXISTS intent_topic_id UUID REFERENCES global_topics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS intent_score VARCHAR(20) DEFAULT 'cold', -- 'hot', 'warm', 'cold'
ADD COLUMN IF NOT EXISTS intent_signals JSONB DEFAULT '[]'::jsonb;

-- DataShopper-specific fields
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS datashopper_person_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS datashopper_company_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS datashopper_record_type VARCHAR(50), -- 'person', 'company'
ADD COLUMN IF NOT EXISTS datashopper_raw_data JSONB DEFAULT '{}'::jsonb;

-- Lead status (for CRM-like workflow)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new';

-- Additional contact methods
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS secondary_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS work_phone VARCHAR(50);

-- ============================================================================
-- CREATE INDEXES FOR NEW FIELDS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_leads_company_size ON leads(company_size);
CREATE INDEX IF NOT EXISTS idx_leads_company_revenue ON leads(company_revenue);
CREATE INDEX IF NOT EXISTS idx_leads_state_code ON leads(state_code);
CREATE INDEX IF NOT EXISTS idx_leads_country_code ON leads(country_code);
CREATE INDEX IF NOT EXISTS idx_leads_intent_topic ON leads(intent_topic);
CREATE INDEX IF NOT EXISTS idx_leads_intent_topic_id ON leads(intent_topic_id);
CREATE INDEX IF NOT EXISTS idx_leads_intent_score ON leads(intent_score);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_datashopper_person_id ON leads(datashopper_person_id);
CREATE INDEX IF NOT EXISTS idx_leads_datashopper_company_id ON leads(datashopper_company_id);
CREATE INDEX IF NOT EXISTS idx_leads_intent_signals ON leads USING GIN(intent_signals);

-- ============================================================================
-- CREATE COMPANY SIZE ENUM FOR CONSISTENCY
-- ============================================================================

-- Common company size ranges used in B2B data providers
COMMENT ON COLUMN leads.company_size IS 'Company size range (e.g., "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10000+")';
COMMENT ON COLUMN leads.company_revenue IS 'Company revenue range (e.g., "Under 1 Million", "1 Million to 10 Million", "10 Million to 50 Million", "50 Million to 100 Million", "100 Million to 250 Million", "250 Million to 500 Million", "500 Million to 1 Billion", "Over 1 Billion")';

-- ============================================================================
-- CREATE HELPER FUNCTION TO PARSE LOCATION FROM JSONB
-- ============================================================================

CREATE OR REPLACE FUNCTION parse_lead_location(p_location JSONB)
RETURNS TABLE (
  city VARCHAR(255),
  state VARCHAR(100),
  state_code VARCHAR(10),
  country VARCHAR(100),
  country_code VARCHAR(10),
  postal_code VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (p_location->>'city')::VARCHAR(255),
    (p_location->>'state')::VARCHAR(100),
    (p_location->>'state_code')::VARCHAR(10),
    COALESCE(p_location->>'country', 'US')::VARCHAR(100),
    COALESCE(p_location->>'country_code', 'US')::VARCHAR(10),
    (p_location->>'postal_code')::VARCHAR(20);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- CREATE FUNCTION TO NORMALIZE COMPANY SIZE
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_company_size(p_employee_count INTEGER)
RETURNS VARCHAR(100) AS $$
BEGIN
  IF p_employee_count IS NULL THEN
    RETURN NULL;
  ELSIF p_employee_count <= 10 THEN
    RETURN '1-10';
  ELSIF p_employee_count <= 50 THEN
    RETURN '11-50';
  ELSIF p_employee_count <= 200 THEN
    RETURN '51-200';
  ELSIF p_employee_count <= 500 THEN
    RETURN '201-500';
  ELSIF p_employee_count <= 1000 THEN
    RETURN '501-1000';
  ELSIF p_employee_count <= 5000 THEN
    RETURN '1001-5000';
  ELSIF p_employee_count <= 10000 THEN
    RETURN '5001-10000';
  ELSE
    RETURN '10000+';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- CREATE FUNCTION TO NORMALIZE REVENUE RANGE
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_revenue_range(p_revenue BIGINT)
RETURNS VARCHAR(100) AS $$
BEGIN
  IF p_revenue IS NULL THEN
    RETURN NULL;
  ELSIF p_revenue < 1000000 THEN
    RETURN 'Under 1 Million';
  ELSIF p_revenue < 10000000 THEN
    RETURN '1 Million to 10 Million';
  ELSIF p_revenue < 50000000 THEN
    RETURN '10 Million to 50 Million';
  ELSIF p_revenue < 100000000 THEN
    RETURN '50 Million to 100 Million';
  ELSIF p_revenue < 250000000 THEN
    RETURN '100 Million to 250 Million';
  ELSIF p_revenue < 500000000 THEN
    RETURN '250 Million to 500 Million';
  ELSIF p_revenue < 1000000000 THEN
    RETURN '500 Million to 1 Billion';
  ELSE
    RETURN 'Over 1 Billion';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- UPDATE EXISTING LEADS TO POPULATE NEW FIELDS FROM JSONB DATA
-- ============================================================================

-- Backfill location fields from company_location JSONB
UPDATE leads
SET
  city = COALESCE(city, (company_location->>'city')::VARCHAR(255)),
  state = COALESCE(state, (company_location->>'state')::VARCHAR(100)),
  state_code = COALESCE(state_code, (company_location->>'state_code')::VARCHAR(10)),
  country = COALESCE(country, (company_location->>'country')::VARCHAR(100), 'US'),
  country_code = COALESCE(country_code, (company_location->>'country_code')::VARCHAR(10), 'US'),
  postal_code = COALESCE(postal_code, (company_location->>'postal_code')::VARCHAR(20))
WHERE company_location IS NOT NULL;

-- Backfill job_title to contact_title if not set
UPDATE leads
SET contact_title = job_title
WHERE contact_title IS NULL AND job_title IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN leads.intent_topic IS 'The B2B intent topic the person/company showed interest in';
COMMENT ON COLUMN leads.intent_score IS 'Intent score level: hot, warm, or cold';
COMMENT ON COLUMN leads.intent_signals IS 'Array of intent signals with type, timestamp, and strength';
COMMENT ON COLUMN leads.datashopper_person_id IS 'DataShopper unique person identifier';
COMMENT ON COLUMN leads.datashopper_company_id IS 'DataShopper unique company identifier';
COMMENT ON COLUMN leads.datashopper_raw_data IS 'Raw response data from DataShopper API for reference';
COMMENT ON COLUMN leads.status IS 'Lead workflow status: new, contacted, qualified, proposal, negotiation, won, lost';
