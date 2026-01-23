-- Migration: Add Lead Routing System
-- This migration adds industry and geographic routing capabilities for multi-tenant white-label platforms

-- Add routing configuration to workspaces
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS routing_config JSONB DEFAULT '{
  "enabled": true,
  "industry_filter": [],
  "geographic_filter": {
    "countries": [],
    "states": [],
    "regions": []
  },
  "lead_assignment_method": "round_robin"
}'::jsonb,
ADD COLUMN IF NOT EXISTS is_white_label BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS allowed_industries TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS allowed_regions TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS webhook_endpoints JSONB DEFAULT '{
  "datashopper": null,
  "clay": null,
  "audience_labs": null
}'::jsonb;

-- Create lead routing rules table
CREATE TABLE IF NOT EXISTS lead_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  conditions JSONB NOT NULL DEFAULT '{
    "industries": [],
    "company_sizes": [],
    "revenue_ranges": [],
    "countries": [],
    "us_states": [],
    "regions": []
  }'::jsonb,
  destination_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  actions JSONB NOT NULL DEFAULT '{
    "assign_to_workspace": true,
    "notify_via": ["email"],
    "tag_with": []
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bulk upload jobs table
CREATE TABLE IF NOT EXISTS bulk_upload_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL, -- 'csv', 'datashopper', 'audience_labs', 'clay'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  file_url TEXT,
  raw_data JSONB,
  error_log JSONB,
  routing_summary JSONB DEFAULT '{
    "routed_workspaces": {},
    "unrouted_count": 0
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add routing metadata to leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'query', 'csv', 'datashopper', 'audience_labs', 'clay'
ADD COLUMN IF NOT EXISTS routing_rule_id UUID REFERENCES lead_routing_rules(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS routing_metadata JSONB DEFAULT '{
  "matched_rules": [],
  "routing_timestamp": null,
  "original_workspace_id": null
}'::jsonb,
ADD COLUMN IF NOT EXISTS bulk_upload_job_id UUID REFERENCES bulk_upload_jobs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS external_ids JSONB DEFAULT '{
  "datashopper_id": null,
  "clay_id": null,
  "audience_labs_id": null
}'::jsonb;

-- Create indexes for efficient routing lookups
CREATE INDEX IF NOT EXISTS idx_workspaces_industry_vertical ON workspaces(industry_vertical);
CREATE INDEX IF NOT EXISTS idx_workspaces_allowed_industries ON workspaces USING GIN(allowed_industries);
CREATE INDEX IF NOT EXISTS idx_workspaces_allowed_regions ON workspaces USING GIN(allowed_regions);
CREATE INDEX IF NOT EXISTS idx_workspaces_parent ON workspaces(parent_workspace_id) WHERE parent_workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_routing_rules_workspace ON lead_routing_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_routing_rules_priority ON lead_routing_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_routing_rules_active ON lead_routing_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_routing_rules_conditions ON lead_routing_rules USING GIN(conditions);

CREATE INDEX IF NOT EXISTS idx_bulk_upload_workspace ON bulk_upload_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_status ON bulk_upload_jobs(status);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_source ON bulk_upload_jobs(source);

CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_routing_rule ON leads(routing_rule_id);
CREATE INDEX IF NOT EXISTS idx_leads_bulk_job ON leads(bulk_upload_job_id);
CREATE INDEX IF NOT EXISTS idx_leads_external_ids ON leads USING GIN(external_ids);
CREATE INDEX IF NOT EXISTS idx_leads_company_industry ON leads(company_industry);
CREATE INDEX IF NOT EXISTS idx_leads_company_location ON leads(company_location);

-- Enable RLS on new tables
ALTER TABLE lead_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_upload_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_routing_rules
CREATE POLICY "Workspace isolation" ON lead_routing_rules
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- RLS Policies for bulk_upload_jobs
CREATE POLICY "Workspace isolation" ON bulk_upload_jobs
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Create function to match lead against routing rules
CREATE OR REPLACE FUNCTION match_routing_rule(
  p_industry TEXT,
  p_company_size TEXT,
  p_revenue_range TEXT,
  p_country TEXT,
  p_state TEXT,
  p_workspace_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_rule_id UUID;
BEGIN
  -- Find first matching rule by priority
  SELECT id INTO v_rule_id
  FROM lead_routing_rules
  WHERE workspace_id = p_workspace_id
    AND is_active = true
    AND (
      (conditions->'industries' = '[]'::jsonb OR conditions->'industries' @> to_jsonb(p_industry))
      OR (conditions->'company_sizes' = '[]'::jsonb OR conditions->'company_sizes' @> to_jsonb(p_company_size))
      OR (conditions->'revenue_ranges' = '[]'::jsonb OR conditions->'revenue_ranges' @> to_jsonb(p_revenue_range))
      OR (conditions->'countries' = '[]'::jsonb OR conditions->'countries' @> to_jsonb(p_country))
      OR (conditions->'us_states' = '[]'::jsonb OR conditions->'us_states' @> to_jsonb(p_state))
    )
  ORDER BY priority DESC
  LIMIT 1;

  RETURN v_rule_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to route lead to correct workspace
CREATE OR REPLACE FUNCTION route_lead_to_workspace(
  p_lead_id UUID,
  p_source_workspace_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_lead RECORD;
  v_rule RECORD;
  v_destination_workspace_id UUID;
BEGIN
  -- Get lead data
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found: %', p_lead_id;
  END IF;

  -- Find matching routing rule
  SELECT * INTO v_rule
  FROM lead_routing_rules
  WHERE workspace_id = p_source_workspace_id
    AND is_active = true
    AND (
      (conditions->'industries' = '[]'::jsonb OR conditions->'industries' @> to_jsonb(v_lead.company_industry))
      OR (conditions->'company_sizes' = '[]'::jsonb OR conditions->'company_sizes' @> to_jsonb(v_lead.company_size))
      OR (conditions->'countries' = '[]'::jsonb OR conditions->'countries' @> to_jsonb(COALESCE(v_lead.company_location->>'country', 'US')))
      OR (conditions->'us_states' = '[]'::jsonb OR conditions->'us_states' @> to_jsonb(v_lead.company_location->>'state'))
    )
  ORDER BY priority DESC
  LIMIT 1;

  -- Determine destination workspace
  IF FOUND AND v_rule.destination_workspace_id IS NOT NULL THEN
    v_destination_workspace_id := v_rule.destination_workspace_id;

    -- Update lead with routing info
    UPDATE leads
    SET
      workspace_id = v_destination_workspace_id,
      routing_rule_id = v_rule.id,
      routing_metadata = jsonb_set(
        routing_metadata,
        '{matched_rules}',
        routing_metadata->'matched_rules' || to_jsonb(v_rule.id)
      ),
      routing_metadata = jsonb_set(
        routing_metadata,
        '{routing_timestamp}',
        to_jsonb(NOW())
      ),
      routing_metadata = jsonb_set(
        routing_metadata,
        '{original_workspace_id}',
        to_jsonb(p_source_workspace_id)
      )
    WHERE id = p_lead_id;
  ELSE
    -- No matching rule, keep in source workspace
    v_destination_workspace_id := p_source_workspace_id;
  END IF;

  RETURN v_destination_workspace_id;
END;
$$ LANGUAGE plpgsql;

-- Update triggers for updated_at
CREATE TRIGGER update_routing_rules_updated_at
  BEFORE UPDATE ON lead_routing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bulk_upload_jobs_updated_at
  BEFORE UPDATE ON bulk_upload_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default routing rules for common verticals
INSERT INTO lead_routing_rules (workspace_id, rule_name, priority, conditions, actions)
SELECT
  id as workspace_id,
  'Default ' || industry_vertical || ' Rule' as rule_name,
  10 as priority,
  jsonb_build_object(
    'industries', ARRAY[industry_vertical]
  ) as conditions,
  jsonb_build_object(
    'assign_to_workspace', true,
    'notify_via', ARRAY['email'],
    'tag_with', ARRAY[industry_vertical]
  ) as actions
FROM workspaces
WHERE industry_vertical IS NOT NULL
ON CONFLICT DO NOTHING;

COMMENT ON TABLE lead_routing_rules IS 'Defines rules for routing leads to different workspaces based on industry, geography, and other criteria';
COMMENT ON TABLE bulk_upload_jobs IS 'Tracks bulk lead upload jobs from CSV, DataShopper, Audience Labs, and Clay';
COMMENT ON FUNCTION match_routing_rule IS 'Finds the highest priority routing rule that matches a lead based on its attributes';
COMMENT ON FUNCTION route_lead_to_workspace IS 'Routes a lead to the correct workspace based on routing rules and updates metadata';
