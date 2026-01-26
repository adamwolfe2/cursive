-- Phase 41: Lead Status Workflow & Notes System
-- Adds lead status tracking, status history, and notes functionality

-- ============================================================================
-- LEAD STATUS ENUM
-- ============================================================================
CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost'
);

-- ============================================================================
-- ADD STATUS COLUMN TO LEADS
-- ============================================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status lead_status NOT NULL DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason TEXT;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);

-- ============================================================================
-- LEAD STATUS HISTORY TABLE
-- ============================================================================
CREATE TABLE lead_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Status change
  from_status lead_status,
  to_status lead_status NOT NULL,

  -- Who changed it
  changed_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Optional note for the change
  change_note TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for status history
CREATE INDEX idx_lead_status_history_lead_id ON lead_status_history(lead_id);
CREATE INDEX idx_lead_status_history_workspace_id ON lead_status_history(workspace_id);
CREATE INDEX idx_lead_status_history_created_at ON lead_status_history(created_at DESC);

-- ============================================================================
-- LEAD NOTES TABLE
-- ============================================================================
CREATE TYPE note_type AS ENUM (
  'note',
  'call',
  'email',
  'meeting',
  'task'
);

CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Note content
  content TEXT NOT NULL,
  note_type note_type NOT NULL DEFAULT 'note',

  -- Author
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Optional: mark as pinned for important notes
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for notes
CREATE INDEX idx_lead_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX idx_lead_notes_workspace_id ON lead_notes(workspace_id);
CREATE INDEX idx_lead_notes_created_by ON lead_notes(created_by);
CREATE INDEX idx_lead_notes_created_at ON lead_notes(created_at DESC);
CREATE INDEX idx_lead_notes_pinned ON lead_notes(is_pinned) WHERE is_pinned = TRUE;

-- Updated_at trigger for notes
CREATE TRIGGER lead_notes_updated_at
  BEFORE UPDATE ON lead_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- LEAD ACTIVITIES TABLE (Unified Activity Timeline)
-- ============================================================================
CREATE TYPE activity_type AS ENUM (
  'status_change',
  'note_added',
  'email_sent',
  'email_opened',
  'email_clicked',
  'email_replied',
  'call_logged',
  'meeting_scheduled',
  'task_completed',
  'assigned',
  'enriched',
  'created'
);

CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Activity details
  activity_type activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Metadata (flexible JSON for type-specific data)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Who performed the activity (can be null for system activities)
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for activities
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_workspace_id ON lead_activities(workspace_id);
CREATE INDEX idx_lead_activities_type ON lead_activities(activity_type);
CREATE INDEX idx_lead_activities_created_at ON lead_activities(created_at DESC);
CREATE INDEX idx_lead_activities_performed_by ON lead_activities(performed_by);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE lead_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- Status History: Workspace isolation
CREATE POLICY "Workspace isolation for lead_status_history" ON lead_status_history
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Notes: Workspace isolation
CREATE POLICY "Workspace isolation for lead_notes" ON lead_notes
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Activities: Workspace isolation
CREATE POLICY "Workspace isolation for lead_activities" ON lead_activities
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to record status change with history
CREATE OR REPLACE FUNCTION update_lead_status(
  p_lead_id UUID,
  p_new_status lead_status,
  p_user_id UUID,
  p_change_note TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_workspace_id UUID;
  v_old_status lead_status;
  v_user_name TEXT;
BEGIN
  -- Get current status and workspace
  SELECT status, workspace_id INTO v_old_status, v_workspace_id
  FROM leads WHERE id = p_lead_id;

  -- Get user name for activity
  SELECT full_name INTO v_user_name FROM users WHERE id = p_user_id;

  -- Update lead status
  UPDATE leads
  SET
    status = p_new_status,
    closed_at = CASE WHEN p_new_status IN ('won', 'lost') THEN NOW() ELSE NULL END
  WHERE id = p_lead_id;

  -- Record in status history
  INSERT INTO lead_status_history (lead_id, workspace_id, from_status, to_status, changed_by, change_note)
  VALUES (p_lead_id, v_workspace_id, v_old_status, p_new_status, p_user_id, p_change_note);

  -- Record activity
  INSERT INTO lead_activities (lead_id, workspace_id, activity_type, title, description, performed_by, metadata)
  VALUES (
    p_lead_id,
    v_workspace_id,
    'status_change',
    'Status changed to ' || p_new_status,
    p_change_note,
    p_user_id,
    jsonb_build_object(
      'from_status', v_old_status,
      'to_status', p_new_status,
      'user_name', v_user_name
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a note
CREATE OR REPLACE FUNCTION add_lead_note(
  p_lead_id UUID,
  p_user_id UUID,
  p_content TEXT,
  p_note_type note_type DEFAULT 'note',
  p_is_pinned BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_workspace_id UUID;
  v_note_id UUID;
  v_user_name TEXT;
BEGIN
  -- Get workspace
  SELECT workspace_id INTO v_workspace_id FROM leads WHERE id = p_lead_id;

  -- Get user name
  SELECT full_name INTO v_user_name FROM users WHERE id = p_user_id;

  -- Insert note
  INSERT INTO lead_notes (lead_id, workspace_id, content, note_type, created_by, is_pinned)
  VALUES (p_lead_id, v_workspace_id, p_content, p_note_type, p_user_id, p_is_pinned)
  RETURNING id INTO v_note_id;

  -- Record activity
  INSERT INTO lead_activities (lead_id, workspace_id, activity_type, title, description, performed_by, metadata)
  VALUES (
    p_lead_id,
    v_workspace_id,
    'note_added',
    CASE
      WHEN p_note_type = 'call' THEN 'Call logged'
      WHEN p_note_type = 'email' THEN 'Email logged'
      WHEN p_note_type = 'meeting' THEN 'Meeting logged'
      WHEN p_note_type = 'task' THEN 'Task added'
      ELSE 'Note added'
    END,
    LEFT(p_content, 200),
    p_user_id,
    jsonb_build_object(
      'note_id', v_note_id,
      'note_type', p_note_type,
      'user_name', v_user_name
    )
  );

  RETURN v_note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE lead_status_history IS 'Tracks all status changes for leads with audit trail';
COMMENT ON TABLE lead_notes IS 'Notes, calls, meetings, and tasks associated with leads';
COMMENT ON TABLE lead_activities IS 'Unified activity timeline for all lead interactions';
COMMENT ON FUNCTION update_lead_status IS 'Updates lead status with automatic history and activity logging';
COMMENT ON FUNCTION add_lead_note IS 'Adds a note to a lead with automatic activity logging';
