-- Migration: CRM Tables (Companies, Contacts, Deals)
-- Implements Twenty CRM-inspired object model for internal CRM

-- ============================================================================
-- COMPANIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Basic Information
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  employees_range TEXT, -- e.g., "1-10", "11-50", "51-200", "201-500", "500-1000", "1000+"
  revenue_range TEXT, -- e.g., "$0-1M", "$1M-10M", "$10M-50M", "$50M+"

  -- Contact Details
  website TEXT,
  phone TEXT,
  email TEXT,

  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,

  -- Social & External
  linkedin_url TEXT,
  twitter_url TEXT,

  -- CRM Fields
  status TEXT DEFAULT 'Active', -- Active, Prospect, Inactive, Lost
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Enrichment
  enriched_at TIMESTAMPTZ,
  enrichment_data JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_companies_workspace ON companies(workspace_id);
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_domain ON companies(domain) WHERE domain IS NOT NULL;
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_owner ON companies(owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX idx_companies_created_at ON companies(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace companies" ON companies
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create companies" ON companies
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update workspace companies" ON companies
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete workspace companies" ON companies
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- CONTACTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- Basic Information
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (
    CASE
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL THEN first_name
      WHEN last_name IS NOT NULL THEN last_name
      ELSE 'Unnamed Contact'
    END
  ) STORED,
  title TEXT, -- Job title

  -- Contact Details
  email TEXT,
  phone TEXT,
  mobile TEXT,

  -- Social
  linkedin_url TEXT,
  twitter_url TEXT,

  -- CRM Fields
  status TEXT DEFAULT 'Active', -- Active, Prospect, Inactive, Lost
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  seniority_level TEXT, -- C-Level, VP, Director, Manager, Individual Contributor

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX idx_contacts_company ON contacts(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_owner ON contacts(owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX idx_contacts_full_name ON contacts(full_name);

-- Updated_at trigger
CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace contacts" ON contacts
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create contacts" ON contacts
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update workspace contacts" ON contacts
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete workspace contacts" ON contacts
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- DEALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Basic Information
  name TEXT NOT NULL,
  description TEXT,

  -- Deal Value
  value DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',

  -- Pipeline
  stage TEXT NOT NULL DEFAULT 'Qualified', -- Qualified, Proposal, Negotiation, Closed Won, Closed Lost
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),

  -- Dates
  close_date DATE,
  closed_at TIMESTAMPTZ,

  -- Assignment
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_deals_workspace ON deals(workspace_id);
CREATE INDEX idx_deals_company ON deals(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_deals_contact ON deals(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_owner ON deals(owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX idx_deals_close_date ON deals(close_date) WHERE close_date IS NOT NULL;
CREATE INDEX idx_deals_created_at ON deals(created_at DESC);
CREATE INDEX idx_deals_value ON deals(value DESC);

-- Updated_at trigger
CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace deals" ON deals
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create deals" ON deals
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update workspace deals" ON deals
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete workspace deals" ON deals
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- ACTIVITIES TABLE (Shared across all CRM objects)
-- ============================================================================

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Activity Type
  activity_type TEXT NOT NULL, -- call, email, meeting, note, task

  -- Associations
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,

  -- Content
  subject TEXT,
  body TEXT,

  -- Dates
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Assignment
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Ensure at least one association exists
  CONSTRAINT activity_has_association CHECK (
    company_id IS NOT NULL OR contact_id IS NOT NULL OR deal_id IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_activities_workspace ON activities(workspace_id);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_company ON activities(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_activities_contact ON activities(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_activities_deal ON activities(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX idx_activities_owner ON activities(owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_due_date ON activities(due_date) WHERE due_date IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace activities" ON activities
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activities" ON activities
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update workspace activities" ON activities
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete workspace activities" ON activities
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View: Companies with aggregated stats
CREATE OR REPLACE VIEW companies_with_stats AS
SELECT
  c.*,
  COUNT(DISTINCT ct.id) as contact_count,
  COUNT(DISTINCT d.id) as deal_count,
  SUM(CASE WHEN d.stage NOT IN ('Closed Won', 'Closed Lost') THEN d.value ELSE 0 END) as open_deal_value,
  SUM(CASE WHEN d.stage = 'Closed Won' THEN d.value ELSE 0 END) as won_deal_value
FROM companies c
LEFT JOIN contacts ct ON ct.company_id = c.id
LEFT JOIN deals d ON d.company_id = c.id
GROUP BY c.id;

-- View: Contacts with company info
CREATE OR REPLACE VIEW contacts_with_company AS
SELECT
  ct.*,
  c.name as company_name,
  c.domain as company_domain,
  c.industry as company_industry
FROM contacts ct
LEFT JOIN companies c ON ct.company_id = c.id;

-- View: Deals with associations
CREATE OR REPLACE VIEW deals_with_associations AS
SELECT
  d.*,
  c.name as company_name,
  ct.full_name as contact_name,
  u.full_name as owner_name,
  ROUND(d.value * (d.probability::DECIMAL / 100), 2) as weighted_value
FROM deals d
LEFT JOIN companies c ON d.company_id = c.id
LEFT JOIN contacts ct ON d.contact_id = c.id
LEFT JOIN users u ON d.owner_user_id = u.id;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE companies IS 'CRM companies/accounts';
COMMENT ON TABLE contacts IS 'CRM contacts/people';
COMMENT ON TABLE deals IS 'CRM deals/opportunities in sales pipeline';
COMMENT ON TABLE activities IS 'CRM activities (calls, emails, meetings, notes, tasks) associated with CRM objects';

COMMENT ON COLUMN companies.employees_range IS 'Employee count range: 1-10, 11-50, 51-200, 201-500, 500-1000, 1000+';
COMMENT ON COLUMN companies.revenue_range IS 'Annual revenue range: $0-1M, $1M-10M, $10M-50M, $50M+';
COMMENT ON COLUMN companies.status IS 'Company status: Active, Prospect, Inactive, Lost';

COMMENT ON COLUMN contacts.status IS 'Contact status: Active, Prospect, Inactive, Lost';
COMMENT ON COLUMN contacts.seniority_level IS 'Job seniority: C-Level, VP, Director, Manager, Individual Contributor';

COMMENT ON COLUMN deals.stage IS 'Deal stage: Qualified, Proposal, Negotiation, Closed Won, Closed Lost';
COMMENT ON COLUMN deals.probability IS 'Win probability percentage (0-100)';

COMMENT ON COLUMN activities.activity_type IS 'Activity type: call, email, meeting, note, task';
