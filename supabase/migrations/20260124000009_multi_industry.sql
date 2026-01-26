-- Cursive Platform - Multi-Industry Support
-- Migration for industry-specific configurations

-- ============================================================================
-- INDUSTRIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS industries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji or icon name
  color TEXT, -- hex color
  is_active BOOLEAN DEFAULT true,
  default_lead_price DECIMAL(10,2) DEFAULT 25.00,
  min_lead_score INTEGER DEFAULT 50,
  avg_conversion_rate DECIMAL(5,2),
  typical_keywords TEXT[],
  typical_intent_signals TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert supported industries
INSERT INTO industries (name, display_name, description, icon, color, default_lead_price, typical_intent_signals) VALUES
  ('hvac', 'HVAC', 'Heating, ventilation, and air conditioning services', '❄️', '#0ea5e9', 35.00, ARRAY['AC repair needed', 'Heating not working', 'HVAC maintenance', 'New AC installation']),
  ('roofing', 'Roofing', 'Roof repair, replacement, and installation', '🏠', '#f59e0b', 45.00, ARRAY['Roof leak', 'Storm damage', 'Roof replacement', 'New roof estimate']),
  ('plumbing', 'Plumbing', 'Plumbing repair and installation services', '🔧', '#06b6d4', 30.00, ARRAY['Pipe leak', 'Drain clogged', 'Water heater issue', 'Plumbing emergency']),
  ('electrical', 'Electrical', 'Electrical repair and installation', '⚡', '#eab308', 35.00, ARRAY['Electrical issue', 'Outlet not working', 'Panel upgrade', 'Wiring needed']),
  ('solar', 'Solar', 'Solar panel installation and services', '☀️', '#f97316', 75.00, ARRAY['Solar panels', 'Solar estimate', 'Energy savings', 'Going green']),
  ('real_estate', 'Real Estate', 'Real estate and property services', '🏡', '#8b5cf6', 50.00, ARRAY['Selling home', 'Buying home', 'Property value', 'Real estate agent']),
  ('insurance', 'Insurance', 'Insurance products and services', '🛡️', '#3b82f6', 40.00, ARRAY['Insurance quote', 'Coverage needed', 'Policy renewal', 'Comparing insurance']),
  ('landscaping', 'Landscaping', 'Landscaping and lawn care services', '🌳', '#22c55e', 25.00, ARRAY['Lawn care', 'Landscaping design', 'Tree service', 'Garden maintenance']),
  ('pest_control', 'Pest Control', 'Pest control and extermination', '🐜', '#a855f7', 25.00, ARRAY['Pest problem', 'Bug infestation', 'Termite inspection', 'Rodent control']),
  ('cleaning', 'Cleaning Services', 'Residential and commercial cleaning', '🧹', '#ec4899', 20.00, ARRAY['House cleaning', 'Deep clean', 'Move-out cleaning', 'Regular cleaning']),
  ('auto', 'Auto Services', 'Automotive repair and services', '🚗', '#ef4444', 30.00, ARRAY['Car repair', 'Auto maintenance', 'Oil change', 'Tire service']),
  ('legal', 'Legal Services', 'Legal and attorney services', '⚖️', '#6366f1', 100.00, ARRAY['Need lawyer', 'Legal advice', 'Attorney consultation', 'Legal representation']),
  ('financial', 'Financial Services', 'Financial planning and services', '💰', '#14b8a6', 60.00, ARRAY['Financial planning', 'Investment advice', 'Loan needed', 'Credit repair']),
  ('healthcare', 'Healthcare', 'Healthcare and medical services', '🏥', '#f43f5e', 50.00, ARRAY['Doctor needed', 'Medical care', 'Health services', 'Specialist appointment'])
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- INDUSTRY-SPECIFIC LEAD FIELDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS industry_lead_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry_id UUID NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', -- text, number, select, date, boolean
  options TEXT[], -- for select type
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(industry_id, field_name)
);

-- Insert some industry-specific fields
INSERT INTO industry_lead_fields (industry_id, field_name, field_label, field_type, options, is_required, sort_order)
SELECT
  i.id,
  'property_type',
  'Property Type',
  'select',
  ARRAY['Single Family', 'Townhouse', 'Condo', 'Multi-Family', 'Commercial'],
  true,
  1
FROM industries i WHERE i.name IN ('hvac', 'roofing', 'plumbing', 'electrical', 'landscaping', 'pest_control', 'cleaning')
ON CONFLICT DO NOTHING;

INSERT INTO industry_lead_fields (industry_id, field_name, field_label, field_type, is_required, sort_order)
SELECT i.id, 'square_footage', 'Square Footage', 'number', false, 2
FROM industries i WHERE i.name IN ('hvac', 'roofing', 'cleaning')
ON CONFLICT DO NOTHING;

INSERT INTO industry_lead_fields (industry_id, field_name, field_label, field_type, options, is_required, sort_order)
SELECT i.id, 'urgency', 'Urgency', 'select', ARRAY['Immediate', 'Within a Week', 'Within a Month', 'Just Exploring'], true, 3
FROM industries i
ON CONFLICT DO NOTHING;

-- ============================================================================
-- UPDATE WORKSPACES FOR MULTI-INDUSTRY
-- ============================================================================
-- allowed_industries already exists as TEXT[], let's ensure it's there
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS primary_industry TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS industry_pricing JSONB DEFAULT '{}'; -- custom pricing per industry

-- ============================================================================
-- INDUSTRY ROUTING RULES
-- ============================================================================
CREATE TABLE IF NOT EXISTS industry_routing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  industry TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  max_leads_per_day INTEGER DEFAULT 10,
  custom_price DECIMAL(10,2),
  min_lead_score INTEGER DEFAULT 50,
  priority INTEGER DEFAULT 1, -- higher = more priority
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, industry)
);

-- Index for routing
CREATE INDEX IF NOT EXISTS idx_industry_routing_workspace ON industry_routing_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_industry_routing_active ON industry_routing_rules(is_active) WHERE is_active = true;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE industry_routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace industry routing" ON industry_routing_rules
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE industries IS 'Supported industries with default configurations';
COMMENT ON TABLE industry_lead_fields IS 'Custom fields per industry';
COMMENT ON TABLE industry_routing_rules IS 'Per-workspace industry routing settings';
