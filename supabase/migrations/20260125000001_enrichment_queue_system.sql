-- Cursive Platform - Enhanced Enrichment Queue System
-- Migration for priority-based enrichment queue and lead management

-- ============================================================================
-- ENRICHMENT JOBS TABLE (Queue System)
-- ============================================================================
CREATE TABLE IF NOT EXISTS enrichment_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- clay, clearbit, apollo, zoominfo, email_validation, ai_analysis, web_scrape
  priority TEXT NOT NULL DEFAULT 'normal', -- critical, high, normal, low
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed, partial
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  data JSONB DEFAULT '{}',
  result JSONB,
  error TEXT,
  next_retry_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_workspace ON enrichment_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_lead ON enrichment_jobs(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_status ON enrichment_jobs(status);
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_priority ON enrichment_jobs(priority);
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_pending_queue ON enrichment_jobs(workspace_id, status, priority, created_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_retry ON enrichment_jobs(next_retry_at)
  WHERE status = 'pending' AND next_retry_at IS NOT NULL;

-- ============================================================================
-- LEAD SOURCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- csv_import, api, zapier, webhook, scraper, manual
  config JSONB DEFAULT '{}',
  total_leads INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_import_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_lead_sources_workspace ON lead_sources(workspace_id);

-- ============================================================================
-- LEAD ACTIVITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL, -- email_sent, email_opened, email_clicked, call_made, sms_sent, note_added, status_changed, enriched, exported
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_workspace ON lead_activities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created ON lead_activities(lead_id, created_at DESC);

-- ============================================================================
-- TAGS SYSTEM
-- ============================================================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6', -- Default blue
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_workspace ON tags(workspace_id);

CREATE TABLE IF NOT EXISTS lead_tags (
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (lead_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_tags_lead ON lead_tags(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tags_tag ON lead_tags(tag_id);

-- ============================================================================
-- SMART SEGMENTS (Saved Filters)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '{}', -- Filter criteria
  is_dynamic BOOLEAN DEFAULT true, -- Dynamic = query-based, false = static list
  lead_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_segments_workspace ON lead_segments(workspace_id);

-- ============================================================================
-- ENHANCED LEADS COLUMNS
-- ============================================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES lead_sources(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_analysis JSONB; -- Claude AI analysis results
ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualification_score INTEGER; -- 0-100
ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualification_tier TEXT; -- hot, warm, cold, unqualified
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS merged_from UUID[]; -- IDs of leads merged into this one
ALTER TABLE leads ADD COLUMN IF NOT EXISTS duplicate_of UUID REFERENCES leads(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source_id);
CREATE INDEX IF NOT EXISTS idx_leads_qualification ON leads(workspace_id, qualification_tier);
CREATE INDEX IF NOT EXISTS idx_leads_last_activity ON leads(workspace_id, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_next_action ON leads(workspace_id, next_action_at) WHERE next_action_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_not_archived ON leads(workspace_id, is_archived) WHERE is_archived = false;

-- ============================================================================
-- EMAIL SEQUENCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  trigger_type TEXT NOT NULL DEFAULT 'manual', -- manual, new_lead, tag_added, score_threshold
  trigger_config JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_sequences_workspace ON email_sequences(workspace_id);

CREATE TABLE IF NOT EXISTS email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_type TEXT NOT NULL DEFAULT 'email', -- email, wait, condition, action
  subject_template TEXT,
  body_template TEXT,
  delay_hours INTEGER DEFAULT 0, -- Hours to wait before this step
  delay_type TEXT DEFAULT 'after_previous', -- after_previous, after_open, after_click, specific_time
  condition_config JSONB, -- For conditional steps
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence ON email_sequence_steps(sequence_id, step_number);

CREATE TABLE IF NOT EXISTS email_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, completed, bounced, unsubscribed
  next_step_at TIMESTAMPTZ,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(sequence_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_sequence ON email_sequence_enrollments(sequence_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_lead ON email_sequence_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_next_step ON email_sequence_enrollments(next_step_at) WHERE status = 'active';

-- ============================================================================
-- EMAIL SENDING INFRASTRUCTURE
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email_address TEXT NOT NULL,
  display_name TEXT,
  provider TEXT NOT NULL, -- gmail, outlook, smtp
  credentials_encrypted JSONB, -- OAuth tokens or SMTP creds
  is_verified BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  daily_send_limit INTEGER DEFAULT 500,
  sends_today INTEGER DEFAULT 0,
  warmup_status TEXT DEFAULT 'none', -- none, warming, ready
  warmup_day INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_accounts_workspace ON email_accounts(workspace_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_accounts_unique ON email_accounts(workspace_id, email_address);

CREATE TABLE IF NOT EXISTS sent_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  email_account_id UUID REFERENCES email_accounts(id) ON DELETE SET NULL,
  sequence_enrollment_id UUID REFERENCES email_sequence_enrollments(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  to_name TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  status TEXT NOT NULL DEFAULT 'queued', -- queued, sent, delivered, opened, clicked, bounced, complained
  external_id TEXT, -- ID from email provider
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_reason TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sent_emails_workspace ON sent_emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_lead ON sent_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_status ON sent_emails(status);
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_at ON sent_emails(sent_at DESC);

-- ============================================================================
-- SMS INFRASTRUCTURE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sms_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'twilio', -- twilio, bandwidth, etc.
  credentials_encrypted JSONB,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  daily_send_limit INTEGER DEFAULT 1000,
  sends_today INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_accounts_workspace ON sms_accounts(workspace_id);

CREATE TABLE IF NOT EXISTS sent_sms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  sms_account_id UUID REFERENCES sms_accounts(id) ON DELETE SET NULL,
  to_phone TEXT NOT NULL,
  from_phone TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', -- queued, sent, delivered, failed
  external_id TEXT,
  delivered_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sent_sms_workspace ON sent_sms(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sent_sms_lead ON sent_sms(lead_id);

-- ============================================================================
-- INTEGRATIONS ENHANCEMENT
-- ============================================================================
CREATE TABLE IF NOT EXISTS ghl_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL, -- GHL location ID
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  sync_contacts BOOLEAN DEFAULT true,
  sync_opportunities BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_ghl_connections_workspace ON ghl_connections(workspace_id);

-- ============================================================================
-- AI VOICE & RINGLESS VOICEMAIL
-- ============================================================================
CREATE TABLE IF NOT EXISTS voice_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- ai_voice, ringless_voicemail
  provider TEXT, -- bland_ai, retell_ai, slybroadcast, drop_co
  script_template TEXT,
  voice_id TEXT, -- Provider-specific voice ID
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_campaigns_workspace ON voice_campaigns(workspace_id);

CREATE TABLE IF NOT EXISTS voice_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES voice_campaigns(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  to_phone TEXT NOT NULL,
  from_phone TEXT,
  type TEXT NOT NULL, -- ai_voice, ringless_voicemail
  status TEXT NOT NULL DEFAULT 'queued', -- queued, in_progress, completed, failed, answered, no_answer
  duration_seconds INTEGER,
  recording_url TEXT,
  transcript TEXT,
  outcome TEXT, -- interested, not_interested, callback_requested, wrong_number
  external_id TEXT,
  cost DECIMAL(10,4),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_calls_workspace ON voice_calls(workspace_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_lead ON voice_calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_campaign ON voice_calls(campaign_id);

-- ============================================================================
-- WORKFLOWS (Automation Engine)
-- ============================================================================
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- new_lead, tag_added, score_changed, status_changed, time_based, manual
  trigger_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  run_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_workspace ON workflows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON workflows(trigger_type) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- send_email, send_sms, add_tag, remove_tag, update_field, wait, condition, notify, enrich, ai_qualify
  action_config JSONB NOT NULL DEFAULT '{}',
  condition_config JSONB, -- For conditional branching
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON workflow_steps(workflow_id, step_number);

CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'running', -- running, paused, completed, failed
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_lead ON workflow_executions(lead_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE enrichment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_sms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghl_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- Workspace isolation policies (same pattern for all tables)
CREATE POLICY "workspace_isolation" ON enrichment_jobs FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "workspace_isolation" ON lead_sources FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "workspace_isolation" ON lead_activities FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "workspace_isolation" ON tags FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "workspace_isolation" ON lead_segments FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "workspace_isolation" ON email_sequences FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "workspace_isolation" ON email_sequence_enrollments FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "workspace_isolation" ON email_accounts FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "workspace_isolation" ON sent_emails FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "workspace_isolation" ON sms_accounts FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "workspace_isolation" ON sent_sms FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "workspace_isolation" ON ghl_connections FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "workspace_isolation" ON voice_campaigns FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "workspace_isolation" ON voice_calls FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "workspace_isolation" ON workflows FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "workspace_isolation" ON workflow_executions FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

-- Lead tags needs special handling (junction table)
CREATE POLICY "lead_tags_policy" ON lead_tags FOR ALL USING (
  lead_id IN (
    SELECT l.id FROM leads l
    JOIN users u ON l.workspace_id = u.workspace_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Sequence steps inherit from parent
CREATE POLICY "sequence_steps_policy" ON email_sequence_steps FOR ALL USING (
  sequence_id IN (
    SELECT es.id FROM email_sequences es
    JOIN users u ON es.workspace_id = u.workspace_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Workflow steps inherit from parent
CREATE POLICY "workflow_steps_policy" ON workflow_steps FOR ALL USING (
  workflow_id IN (
    SELECT w.id FROM workflows w
    JOIN users u ON w.workspace_id = u.workspace_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update lead's last_activity_at when activity is logged
CREATE OR REPLACE FUNCTION update_lead_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads
  SET last_activity_at = NEW.created_at
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_lead_activity
AFTER INSERT ON lead_activities
FOR EACH ROW
EXECUTE FUNCTION update_lead_last_activity();

-- Function to increment lead source count
CREATE OR REPLACE FUNCTION update_lead_source_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.source_id IS NOT NULL THEN
    UPDATE lead_sources
    SET total_leads = total_leads + 1,
        last_import_at = NOW()
    WHERE id = NEW.source_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_source_count
AFTER INSERT ON leads
FOR EACH ROW
EXECUTE FUNCTION update_lead_source_count();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE enrichment_jobs IS 'Queue for lead enrichment processing';
COMMENT ON TABLE lead_sources IS 'Track where leads originate from';
COMMENT ON TABLE lead_activities IS 'Activity log for all lead interactions';
COMMENT ON TABLE tags IS 'User-defined tags for categorizing leads';
COMMENT ON TABLE lead_tags IS 'Many-to-many relationship between leads and tags';
COMMENT ON TABLE lead_segments IS 'Saved filter configurations for lead lists';
COMMENT ON TABLE email_sequences IS 'Multi-step email automation sequences';
COMMENT ON TABLE email_accounts IS 'Connected email accounts for sending';
COMMENT ON TABLE sent_emails IS 'Log of all sent emails with tracking';
COMMENT ON TABLE sms_accounts IS 'Connected SMS/phone accounts';
COMMENT ON TABLE sent_sms IS 'Log of all sent SMS messages';
COMMENT ON TABLE ghl_connections IS 'GoHighLevel CRM integrations';
COMMENT ON TABLE voice_campaigns IS 'AI voice and ringless voicemail campaigns';
COMMENT ON TABLE voice_calls IS 'Log of all voice calls and voicemails';
COMMENT ON TABLE workflows IS 'Automation workflow definitions';
COMMENT ON TABLE workflow_steps IS 'Steps within automation workflows';
COMMENT ON TABLE workflow_executions IS 'Running/completed workflow instances';
