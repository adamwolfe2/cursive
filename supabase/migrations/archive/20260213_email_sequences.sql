/**
 * Email Sequence Builder Schema
 * Marketing automation with templates, sequences, and tracking
 */

-- ============================================================================
-- EMAIL TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Template metadata
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL, -- HTML content with {{variable}} syntax

  -- Template variables (for documentation)
  variables JSONB DEFAULT '[]'::jsonb, -- e.g. ["first_name", "company_name"]

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),

  -- Preview text for email clients
  preview_text TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,

  CONSTRAINT email_templates_name_unique UNIQUE (workspace_id, name)
);

CREATE INDEX idx_email_templates_workspace ON email_templates(workspace_id, status);
CREATE INDEX idx_email_templates_user ON email_templates(user_id);

-- ============================================================================
-- EMAIL SEQUENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Sequence metadata
  name TEXT NOT NULL,
  description TEXT,

  -- Trigger configuration
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'segment', 'lead_added', 'lead_scored', 'time_based')),
  trigger_config JSONB DEFAULT '{}'::jsonb, -- e.g. {"segment_id": "...", "score_threshold": 80}

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),

  -- Statistics
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_run_at TIMESTAMPTZ,

  CONSTRAINT email_sequences_name_unique UNIQUE (workspace_id, name)
);

CREATE INDEX idx_email_sequences_workspace ON email_sequences(workspace_id, status);
CREATE INDEX idx_email_sequences_active ON email_sequences(workspace_id, status) WHERE status = 'active';

-- ============================================================================
-- SEQUENCE STEPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,

  -- Step configuration
  step_order INTEGER NOT NULL,
  name TEXT NOT NULL,

  -- Delay configuration
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  delay_minutes INTEGER DEFAULT 0,

  -- Email content (can override template or use inline)
  subject TEXT, -- Override template subject if provided
  body TEXT, -- Override template body if provided

  -- Conditions
  conditions JSONB DEFAULT '{}'::jsonb, -- e.g. {"min_score": 70, "opened_previous": true}

  -- Statistics
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT email_sequence_steps_order UNIQUE (sequence_id, step_order)
);

CREATE INDEX idx_sequence_steps_sequence ON email_sequence_steps(sequence_id, step_order);
CREATE INDEX idx_sequence_steps_template ON email_sequence_steps(template_id);

-- ============================================================================
-- SEQUENCE ENROLLMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Enrollment status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'unsubscribed', 'bounced')),

  -- Progress tracking
  current_step_id UUID REFERENCES email_sequence_steps(id) ON DELETE SET NULL,
  current_step_order INTEGER DEFAULT 0,
  next_send_at TIMESTAMPTZ,

  -- Statistics
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  emails_replied INTEGER DEFAULT 0,

  -- Timestamps
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,

  CONSTRAINT enrollment_unique UNIQUE (sequence_id, lead_id)
);

CREATE INDEX idx_enrollments_sequence ON email_sequence_enrollments(sequence_id, status);
CREATE INDEX idx_enrollments_lead ON email_sequence_enrollments(lead_id);
CREATE INDEX idx_enrollments_next_send ON email_sequence_enrollments(next_send_at) WHERE status = 'active' AND next_send_at IS NOT NULL;

-- ============================================================================
-- EMAIL SENDS (Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Email details
  enrollment_id UUID REFERENCES email_sequence_enrollments(id) ON DELETE CASCADE,
  step_id UUID REFERENCES email_sequence_steps(id) ON DELETE SET NULL,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Email content
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Sending
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed')),
  provider_message_id TEXT, -- External email provider ID
  error_message TEXT,

  -- Tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,

  -- Click/open tracking
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  unique_clicks JSONB DEFAULT '[]'::jsonb, -- URLs clicked

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_sends_workspace ON email_sends(workspace_id, created_at DESC);
CREATE INDEX idx_email_sends_enrollment ON email_sends(enrollment_id);
CREATE INDEX idx_email_sends_lead ON email_sends(lead_id);
CREATE INDEX idx_email_sends_status ON email_sends(status, created_at DESC);
CREATE INDEX idx_email_sends_pending ON email_sends(status) WHERE status = 'pending';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Email Templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace isolation" ON email_templates
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Email Sequences
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace isolation" ON email_sequences
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Sequence Steps
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access via sequence" ON email_sequence_steps
  FOR ALL USING (
    sequence_id IN (
      SELECT id FROM email_sequences
      WHERE workspace_id IN (
        SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Enrollments
ALTER TABLE email_sequence_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access via sequence" ON email_sequence_enrollments
  FOR ALL USING (
    sequence_id IN (
      SELECT id FROM email_sequences
      WHERE workspace_id IN (
        SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Email Sends
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace isolation" ON email_sends
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_email_updated_at();

CREATE TRIGGER email_sequences_updated_at
  BEFORE UPDATE ON email_sequences
  FOR EACH ROW EXECUTE FUNCTION update_email_updated_at();

CREATE TRIGGER email_sequence_steps_updated_at
  BEFORE UPDATE ON email_sequence_steps
  FOR EACH ROW EXECUTE FUNCTION update_email_updated_at();

CREATE TRIGGER email_sends_updated_at
  BEFORE UPDATE ON email_sends
  FOR EACH ROW EXECUTE FUNCTION update_email_updated_at();

-- ============================================================================
-- HELPER FUNCTION: Enroll lead in sequence
-- ============================================================================

CREATE OR REPLACE FUNCTION enroll_lead_in_sequence(
  p_sequence_id UUID,
  p_lead_id UUID
) RETURNS UUID AS $$
DECLARE
  v_enrollment_id UUID;
  v_first_step RECORD;
  v_next_send_at TIMESTAMPTZ;
BEGIN
  -- Get first step
  SELECT * INTO v_first_step
  FROM email_sequence_steps
  WHERE sequence_id = p_sequence_id
  ORDER BY step_order ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sequence has no steps';
  END IF;

  -- Calculate next send time
  v_next_send_at := NOW() +
    (v_first_step.delay_days || ' days')::INTERVAL +
    (v_first_step.delay_hours || ' hours')::INTERVAL +
    (v_first_step.delay_minutes || ' minutes')::INTERVAL;

  -- Create enrollment
  INSERT INTO email_sequence_enrollments (
    sequence_id,
    lead_id,
    current_step_id,
    current_step_order,
    next_send_at,
    status
  ) VALUES (
    p_sequence_id,
    p_lead_id,
    v_first_step.id,
    v_first_step.step_order,
    v_next_send_at,
    'active'
  )
  ON CONFLICT (sequence_id, lead_id) DO UPDATE
  SET status = 'active',
      next_send_at = v_next_send_at
  RETURNING id INTO v_enrollment_id;

  RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON email_templates TO authenticated;
GRANT ALL ON email_sequences TO authenticated;
GRANT ALL ON email_sequence_steps TO authenticated;
GRANT ALL ON email_sequence_enrollments TO authenticated;
GRANT ALL ON email_sends TO authenticated;

GRANT EXECUTE ON FUNCTION enroll_lead_in_sequence TO authenticated;
GRANT EXECUTE ON FUNCTION enroll_lead_in_sequence TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE email_templates IS 'Reusable email templates with variable substitution';
COMMENT ON TABLE email_sequences IS 'Automated email sequences with trigger configuration';
COMMENT ON TABLE email_sequence_steps IS 'Individual steps in an email sequence with delays';
COMMENT ON TABLE email_sequence_enrollments IS 'Lead enrollments in sequences with progress tracking';
COMMENT ON TABLE email_sends IS 'Individual email sends with delivery and engagement tracking';

COMMENT ON FUNCTION enroll_lead_in_sequence IS 'Enroll a lead in a sequence, calculating initial send time';
