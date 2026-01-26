-- Phases 44-46: Saved Views, Bulk Actions, Tags & Custom Fields

-- ============================================================================
-- SAVED VIEWS TABLE
-- ============================================================================
CREATE TABLE saved_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- View configuration
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,

  -- Filter configuration (JSONB)
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example: { "status": ["qualified", "proposal"], "assigned_to": "user-id", "date_range": "last_30_days" }

  -- Column configuration
  visible_columns TEXT[] DEFAULT ARRAY['company_name', 'status', 'email', 'created_at'],
  column_order TEXT[],
  sort_by TEXT DEFAULT 'created_at',
  sort_direction TEXT DEFAULT 'desc',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_saved_views_workspace_id ON saved_views(workspace_id);
CREATE INDEX idx_saved_views_created_by ON saved_views(created_by);
CREATE INDEX idx_saved_views_is_default ON saved_views(is_default) WHERE is_default = TRUE;

-- Updated_at trigger
CREATE TRIGGER saved_views_updated_at
  BEFORE UPDATE ON saved_views
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- LEAD TAGS TABLE
-- ============================================================================
CREATE TABLE lead_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Tag details
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  description TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint
  CONSTRAINT unique_tag_name_per_workspace UNIQUE (workspace_id, name)
);

-- Indexes
CREATE INDEX idx_lead_tags_workspace_id ON lead_tags(workspace_id);

-- ============================================================================
-- LEAD TAG ASSIGNMENTS (Many-to-Many)
-- ============================================================================
CREATE TABLE lead_tag_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES lead_tags(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint
  CONSTRAINT unique_lead_tag UNIQUE (lead_id, tag_id)
);

-- Indexes
CREATE INDEX idx_lead_tag_assignments_lead_id ON lead_tag_assignments(lead_id);
CREATE INDEX idx_lead_tag_assignments_tag_id ON lead_tag_assignments(tag_id);

-- ============================================================================
-- CUSTOM FIELDS TABLE
-- ============================================================================
CREATE TYPE custom_field_type AS ENUM (
  'text',
  'number',
  'date',
  'select',
  'multiselect',
  'url',
  'email',
  'phone',
  'boolean',
  'textarea'
);

CREATE TABLE custom_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Field definition
  name TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_type custom_field_type NOT NULL DEFAULT 'text',
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,

  -- For select/multiselect fields
  options JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"value": "option1", "label": "Option 1"}, ...]

  -- Display order
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint
  CONSTRAINT unique_field_key_per_workspace UNIQUE (workspace_id, field_key)
);

-- Indexes
CREATE INDEX idx_custom_fields_workspace_id ON custom_fields(workspace_id);

-- Updated_at trigger
CREATE TRIGGER custom_fields_updated_at
  BEFORE UPDATE ON custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CUSTOM FIELD VALUES TABLE
-- ============================================================================
CREATE TABLE custom_field_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,

  -- Value stored as JSONB for flexibility
  value JSONB NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint
  CONSTRAINT unique_field_value_per_lead UNIQUE (lead_id, field_id)
);

-- Indexes
CREATE INDEX idx_custom_field_values_lead_id ON custom_field_values(lead_id);
CREATE INDEX idx_custom_field_values_field_id ON custom_field_values(field_id);

-- Updated_at trigger
CREATE TRIGGER custom_field_values_updated_at
  BEFORE UPDATE ON custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;

-- Saved Views: Workspace isolation (can see own + shared views)
CREATE POLICY "Workspace isolation for saved_views" ON saved_views
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
    AND (created_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR is_shared = TRUE)
  );

-- Lead Tags: Workspace isolation
CREATE POLICY "Workspace isolation for lead_tags" ON lead_tags
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Tag Assignments: Through lead's workspace
CREATE POLICY "Workspace isolation for tag_assignments" ON lead_tag_assignments
  FOR ALL
  USING (
    lead_id IN (
      SELECT id FROM leads
      WHERE workspace_id IN (
        SELECT workspace_id FROM users
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Custom Fields: Workspace isolation
CREATE POLICY "Workspace isolation for custom_fields" ON custom_fields
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Custom Field Values: Through lead's workspace
CREATE POLICY "Workspace isolation for custom_field_values" ON custom_field_values
  FOR ALL
  USING (
    lead_id IN (
      SELECT id FROM leads
      WHERE workspace_id IN (
        SELECT workspace_id FROM users
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to bulk update lead status
CREATE OR REPLACE FUNCTION bulk_update_lead_status(
  p_lead_ids UUID[],
  p_new_status lead_status,
  p_user_id UUID,
  p_change_note TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_lead_id UUID;
BEGIN
  FOREACH v_lead_id IN ARRAY p_lead_ids
  LOOP
    PERFORM update_lead_status(v_lead_id, p_new_status, p_user_id, p_change_note);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk assign leads to user
CREATE OR REPLACE FUNCTION bulk_assign_leads(
  p_lead_ids UUID[],
  p_assigned_to UUID,
  p_assigned_by UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_workspace_id UUID;
  v_user_name TEXT;
BEGIN
  -- Get workspace and user name
  SELECT workspace_id INTO v_workspace_id FROM users WHERE id = p_assigned_by;
  SELECT full_name INTO v_user_name FROM users WHERE id = p_assigned_to;

  -- Update leads
  UPDATE leads
  SET assigned_to = p_assigned_to
  WHERE id = ANY(p_lead_ids)
  AND workspace_id = v_workspace_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Log activities
  INSERT INTO lead_activities (lead_id, workspace_id, activity_type, title, performed_by, metadata)
  SELECT
    id,
    workspace_id,
    'assigned',
    'Assigned to ' || COALESCE(v_user_name, 'team member'),
    p_assigned_by,
    jsonb_build_object('assigned_to', p_assigned_to, 'assigned_by', p_assigned_by)
  FROM leads
  WHERE id = ANY(p_lead_ids)
  AND workspace_id = v_workspace_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk add tags to leads
CREATE OR REPLACE FUNCTION bulk_add_tags(
  p_lead_ids UUID[],
  p_tag_ids UUID[],
  p_assigned_by UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_lead_id UUID;
  v_tag_id UUID;
BEGIN
  FOREACH v_lead_id IN ARRAY p_lead_ids
  LOOP
    FOREACH v_tag_id IN ARRAY p_tag_ids
    LOOP
      INSERT INTO lead_tag_assignments (lead_id, tag_id, assigned_by)
      VALUES (v_lead_id, v_tag_id, p_assigned_by)
      ON CONFLICT (lead_id, tag_id) DO NOTHING;

      IF FOUND THEN
        v_count := v_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk remove tags from leads
CREATE OR REPLACE FUNCTION bulk_remove_tags(
  p_lead_ids UUID[],
  p_tag_ids UUID[]
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM lead_tag_assignments
  WHERE lead_id = ANY(p_lead_ids)
  AND tag_id = ANY(p_tag_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE saved_views IS 'User-saved filter configurations for the leads table';
COMMENT ON TABLE lead_tags IS 'Custom tags for organizing leads';
COMMENT ON TABLE lead_tag_assignments IS 'Many-to-many relationship between leads and tags';
COMMENT ON TABLE custom_fields IS 'Custom field definitions per workspace';
COMMENT ON TABLE custom_field_values IS 'Custom field values for each lead';
