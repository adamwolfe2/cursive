-- Migration: CRM Companies, Contacts, and Deals Tables
-- Full CRM functionality with workspace isolation

-- ============================================================================
-- COMPANIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Basic info
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  website VARCHAR(500),
  description TEXT,

  -- Company details
  industry VARCHAR(100),
  employee_count INTEGER,
  employee_range VARCHAR(50),
  annual_revenue DECIMAL(15,2),
  revenue_range VARCHAR(50),
  founded_year INTEGER,

  -- Contact info
  phone VARCHAR(50),
  email VARCHAR(255),

  -- Address
  street_address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),

  -- Social & enrichment
  linkedin_url VARCHAR(500),
  twitter_handle VARCHAR(100),
  facebook_url VARCHAR(500),
  logo_url TEXT,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, prospect, customer

  -- Relationship
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(name, '') || ' ' ||
      COALESCE(domain, '') || ' ' ||
      COALESCE(industry, '')
    )
  ) STORED
);

-- Indexes
CREATE INDEX idx_crm_companies_workspace ON crm_companies(workspace_id);
CREATE INDEX idx_crm_companies_domain ON crm_companies(domain);
CREATE INDEX idx_crm_companies_owner ON crm_companies(owner_user_id);
CREATE INDEX idx_crm_companies_status ON crm_companies(status);
CREATE INDEX idx_crm_companies_search ON crm_companies USING GIN(search_vector);
CREATE INDEX idx_crm_companies_created ON crm_companies(created_at DESC);

-- RLS
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view companies in their workspace" ON crm_companies
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can create companies in their workspace" ON crm_companies
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update companies in their workspace" ON crm_companies
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can delete companies in their workspace" ON crm_companies
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- ============================================================================
-- CONTACTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,

  -- Personal info
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(255) GENERATED ALWAYS AS (
    TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
  ) STORED,
  title VARCHAR(255),
  department VARCHAR(100),

  -- Contact info
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile_phone VARCHAR(50),

  -- Social
  linkedin_url VARCHAR(500),
  twitter_handle VARCHAR(100),

  -- Address (if different from company)
  street_address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),

  -- Professional details
  seniority_level VARCHAR(50), -- C-Level, VP, Director, Manager, Individual Contributor

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, prospect, customer, lost

  -- Relationship
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  last_contacted_at TIMESTAMPTZ,

  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(first_name, '') || ' ' ||
      COALESCE(last_name, '') || ' ' ||
      COALESCE(email, '') || ' ' ||
      COALESCE(title, '')
    )
  ) STORED
);

-- Indexes
CREATE INDEX idx_crm_contacts_workspace ON crm_contacts(workspace_id);
CREATE INDEX idx_crm_contacts_company ON crm_contacts(company_id);
CREATE INDEX idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX idx_crm_contacts_owner ON crm_contacts(owner_user_id);
CREATE INDEX idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX idx_crm_contacts_search ON crm_contacts USING GIN(search_vector);
CREATE INDEX idx_crm_contacts_created ON crm_contacts(created_at DESC);

-- RLS
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contacts in their workspace" ON crm_contacts
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can create contacts in their workspace" ON crm_contacts
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update contacts in their workspace" ON crm_contacts
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can delete contacts in their workspace" ON crm_contacts
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- ============================================================================
-- DEALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  primary_contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,

  -- Deal info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'USD',

  -- Pipeline & stage
  pipeline VARCHAR(100) DEFAULT 'default', -- Sales, Partnerships, etc.
  stage VARCHAR(100) NOT NULL, -- Discovery, Proposal, Negotiation, Closed Won, Closed Lost
  probability INTEGER DEFAULT 0, -- 0-100

  -- Important dates
  expected_close_date DATE,
  actual_close_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'open', -- open, won, lost
  loss_reason TEXT,

  -- Relationship
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  last_activity_at TIMESTAMPTZ,

  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(name, '') || ' ' ||
      COALESCE(description, '')
    )
  ) STORED
);

-- Indexes
CREATE INDEX idx_crm_deals_workspace ON crm_deals(workspace_id);
CREATE INDEX idx_crm_deals_company ON crm_deals(company_id);
CREATE INDEX idx_crm_deals_contact ON crm_deals(primary_contact_id);
CREATE INDEX idx_crm_deals_owner ON crm_deals(owner_user_id);
CREATE INDEX idx_crm_deals_status ON crm_deals(status);
CREATE INDEX idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX idx_crm_deals_close_date ON crm_deals(expected_close_date);
CREATE INDEX idx_crm_deals_search ON crm_deals USING GIN(search_vector);
CREATE INDEX idx_crm_deals_created ON crm_deals(created_at DESC);

-- RLS
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deals in their workspace" ON crm_deals
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can create deals in their workspace" ON crm_deals
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update deals in their workspace" ON crm_deals
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can delete deals in their workspace" ON crm_deals
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- ============================================================================
-- ACTIVITIES TABLE (for tracking interactions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Related entities
  company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

  -- Activity details
  type VARCHAR(50) NOT NULL, -- email, call, meeting, note, task, etc.
  subject VARCHAR(255),
  description TEXT,

  -- Status (for tasks)
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, cancelled
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Relationship
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_crm_activities_workspace ON crm_activities(workspace_id);
CREATE INDEX idx_crm_activities_company ON crm_activities(company_id);
CREATE INDEX idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_crm_activities_deal ON crm_activities(deal_id);
CREATE INDEX idx_crm_activities_lead ON crm_activities(lead_id);
CREATE INDEX idx_crm_activities_type ON crm_activities(type);
CREATE INDEX idx_crm_activities_owner ON crm_activities(owner_user_id);
CREATE INDEX idx_crm_activities_created ON crm_activities(created_at DESC);

-- RLS
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities in their workspace" ON crm_activities
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can create activities in their workspace" ON crm_activities
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update activities in their workspace" ON crm_activities
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can delete activities in their workspace" ON crm_activities
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_crm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_crm_companies_updated_at
  BEFORE UPDATE ON crm_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_updated_at();

CREATE TRIGGER tr_crm_contacts_updated_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_updated_at();

CREATE TRIGGER tr_crm_deals_updated_at
  BEFORE UPDATE ON crm_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE crm_companies IS 'CRM companies with full workspace isolation';
COMMENT ON TABLE crm_contacts IS 'CRM contacts linked to companies';
COMMENT ON TABLE crm_deals IS 'CRM deals/opportunities pipeline';
COMMENT ON TABLE crm_activities IS 'Activity timeline for CRM entities';
