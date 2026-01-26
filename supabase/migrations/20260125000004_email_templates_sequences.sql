-- Phases 47-48: Email Templates and Sequences

-- ============================================================================
-- EMAIL TEMPLATES TABLE (Enhanced)
-- ============================================================================
-- Drop if exists and recreate with more features
ALTER TABLE IF EXISTS email_templates ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE IF EXISTS email_templates ADD COLUMN IF NOT EXISTS merge_fields JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS email_templates ADD COLUMN IF NOT EXISTS preview_text TEXT;
ALTER TABLE IF EXISTS email_templates ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS email_templates ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Template details
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  preview_text TEXT,

  -- Categorization
  category TEXT DEFAULT 'general',

  -- Merge fields available in this template
  merge_fields JSONB DEFAULT '[]'::jsonb,
  -- Example: ["first_name", "company_name", "custom_field"]

  -- Sharing & stats
  is_shared BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_workspace_id ON email_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_shared ON email_templates(is_shared) WHERE is_shared = TRUE;

-- ============================================================================
-- EMAIL SEQUENCES TABLE
-- ============================================================================
CREATE TYPE sequence_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');

CREATE TABLE email_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Sequence details
  name TEXT NOT NULL,
  description TEXT,
  status sequence_status NOT NULL DEFAULT 'draft',

  -- Entry criteria (optional)
  entry_criteria JSONB DEFAULT '{}'::jsonb,
  -- Example: { "lead_status": "new", "tags": ["hot-lead"] }

  -- Exit criteria
  exit_on_reply BOOLEAN DEFAULT TRUE,
  exit_on_click BOOLEAN DEFAULT FALSE,
  exit_on_status_change TEXT[],

  -- Statistics
  total_enrolled INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_replies INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_email_sequences_workspace_id ON email_sequences(workspace_id);
CREATE INDEX idx_email_sequences_status ON email_sequences(status);

-- Updated_at trigger
CREATE TRIGGER email_sequences_updated_at
  BEFORE UPDATE ON email_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEQUENCE STEPS TABLE
-- ============================================================================
CREATE TYPE step_type AS ENUM ('email', 'delay', 'condition', 'action');
CREATE TYPE delay_unit AS ENUM ('minutes', 'hours', 'days', 'weeks');

CREATE TABLE sequence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,

  -- Step configuration
  step_order INTEGER NOT NULL,
  step_type step_type NOT NULL DEFAULT 'email',

  -- For email steps
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  subject_override TEXT,
  body_override TEXT,

  -- For delay steps
  delay_amount INTEGER,
  delay_unit delay_unit,

  -- For condition steps
  condition_type TEXT,
  condition_config JSONB DEFAULT '{}'::jsonb,
  -- Example: { "type": "email_opened", "previous_step": true }

  -- For action steps
  action_type TEXT,
  action_config JSONB DEFAULT '{}'::jsonb,
  -- Example: { "type": "update_status", "status": "contacted" }

  -- A/B testing (optional)
  ab_test_enabled BOOLEAN DEFAULT FALSE,
  ab_test_variants JSONB DEFAULT '[]'::jsonb,

  -- Statistics
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sequence_steps_sequence_id ON sequence_steps(sequence_id);
CREATE INDEX idx_sequence_steps_order ON sequence_steps(sequence_id, step_order);

-- Updated_at trigger
CREATE TRIGGER sequence_steps_updated_at
  BEFORE UPDATE ON sequence_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEQUENCE ENROLLMENTS TABLE
-- ============================================================================
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'paused', 'exited', 'failed');

CREATE TABLE sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Status
  status enrollment_status NOT NULL DEFAULT 'active',
  current_step_id UUID REFERENCES sequence_steps(id),
  current_step_order INTEGER DEFAULT 0,

  -- Exit reason
  exit_reason TEXT,
  -- Examples: 'replied', 'clicked', 'status_changed', 'manual', 'completed'

  -- Scheduling
  next_action_at TIMESTAMPTZ,

  -- Timestamps
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  exited_at TIMESTAMPTZ,

  -- Unique constraint
  CONSTRAINT unique_active_enrollment UNIQUE (sequence_id, lead_id)
);

-- Indexes
CREATE INDEX idx_sequence_enrollments_sequence_id ON sequence_enrollments(sequence_id);
CREATE INDEX idx_sequence_enrollments_lead_id ON sequence_enrollments(lead_id);
CREATE INDEX idx_sequence_enrollments_status ON sequence_enrollments(status);
CREATE INDEX idx_sequence_enrollments_next_action ON sequence_enrollments(next_action_at)
  WHERE status = 'active';

-- ============================================================================
-- SEQUENCE ACTIONS LOG
-- ============================================================================
CREATE TABLE sequence_action_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES sequence_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES sequence_steps(id) ON DELETE CASCADE,

  -- Action details
  action_type TEXT NOT NULL, -- 'email_sent', 'email_opened', 'email_clicked', 'delay_completed', etc.
  action_result TEXT, -- 'success', 'failed', 'skipped'
  action_metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sequence_action_log_enrollment_id ON sequence_action_log(enrollment_id);
CREATE INDEX idx_sequence_action_log_step_id ON sequence_action_log(step_id);
CREATE INDEX idx_sequence_action_log_created_at ON sequence_action_log(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_action_log ENABLE ROW LEVEL SECURITY;

-- Email Sequences: Workspace isolation
CREATE POLICY "Workspace isolation for email_sequences" ON email_sequences
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Sequence Steps: Through sequence's workspace
CREATE POLICY "Workspace isolation for sequence_steps" ON sequence_steps
  FOR ALL
  USING (
    sequence_id IN (
      SELECT id FROM email_sequences
      WHERE workspace_id IN (
        SELECT workspace_id FROM users
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Sequence Enrollments: Through sequence's workspace
CREATE POLICY "Workspace isolation for sequence_enrollments" ON sequence_enrollments
  FOR ALL
  USING (
    sequence_id IN (
      SELECT id FROM email_sequences
      WHERE workspace_id IN (
        SELECT workspace_id FROM users
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Action Log: Through enrollment's sequence workspace
CREATE POLICY "Workspace isolation for sequence_action_log" ON sequence_action_log
  FOR ALL
  USING (
    enrollment_id IN (
      SELECT id FROM sequence_enrollments
      WHERE sequence_id IN (
        SELECT id FROM email_sequences
        WHERE workspace_id IN (
          SELECT workspace_id FROM users
          WHERE auth_user_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to enroll a lead in a sequence
CREATE OR REPLACE FUNCTION enroll_lead_in_sequence(
  p_sequence_id UUID,
  p_lead_id UUID
)
RETURNS sequence_enrollments AS $$
DECLARE
  v_enrollment sequence_enrollments;
  v_first_step sequence_steps;
  v_next_action TIMESTAMPTZ;
BEGIN
  -- Get first step
  SELECT * INTO v_first_step
  FROM sequence_steps
  WHERE sequence_id = p_sequence_id
  ORDER BY step_order
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sequence has no steps';
  END IF;

  -- Calculate next action time
  IF v_first_step.step_type = 'delay' THEN
    v_next_action := NOW() + make_interval(
      days := CASE WHEN v_first_step.delay_unit = 'days' THEN v_first_step.delay_amount ELSE 0 END,
      hours := CASE WHEN v_first_step.delay_unit = 'hours' THEN v_first_step.delay_amount ELSE 0 END,
      mins := CASE WHEN v_first_step.delay_unit = 'minutes' THEN v_first_step.delay_amount ELSE 0 END
    );
  ELSE
    v_next_action := NOW();
  END IF;

  -- Create enrollment
  INSERT INTO sequence_enrollments (sequence_id, lead_id, current_step_id, current_step_order, next_action_at)
  VALUES (p_sequence_id, p_lead_id, v_first_step.id, v_first_step.step_order, v_next_action)
  RETURNING * INTO v_enrollment;

  -- Update sequence stats
  UPDATE email_sequences
  SET total_enrolled = total_enrolled + 1
  WHERE id = p_sequence_id;

  RETURN v_enrollment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to exit a lead from a sequence
CREATE OR REPLACE FUNCTION exit_lead_from_sequence(
  p_enrollment_id UUID,
  p_reason TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE sequence_enrollments
  SET
    status = 'exited',
    exit_reason = p_reason,
    exited_at = NOW(),
    next_action_at = NULL
  WHERE id = p_enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE email_sequences IS 'Multi-step email automation sequences';
COMMENT ON TABLE sequence_steps IS 'Individual steps within an email sequence';
COMMENT ON TABLE sequence_enrollments IS 'Leads currently enrolled in sequences';
COMMENT ON TABLE sequence_action_log IS 'Log of all actions taken in sequences';
