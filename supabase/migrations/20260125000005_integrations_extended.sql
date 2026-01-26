-- Phases 49-52: Twilio, Calendar, HubSpot, Verification Services

-- ============================================================================
-- SMS/CALL LOGS TABLE (Twilio Integration)
-- ============================================================================
CREATE TYPE communication_type AS ENUM ('sms', 'call', 'voicemail');
CREATE TYPE communication_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE communication_status AS ENUM ('queued', 'sent', 'delivered', 'failed', 'received', 'completed', 'no-answer', 'busy');

CREATE TABLE communication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Communication details
  communication_type communication_type NOT NULL,
  direction communication_direction NOT NULL,
  status communication_status NOT NULL DEFAULT 'queued',

  -- Phone numbers
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,

  -- Content (for SMS)
  message_body TEXT,

  -- Call details
  call_duration_seconds INTEGER,
  recording_url TEXT,
  voicemail_url TEXT,

  -- Twilio references
  twilio_sid TEXT UNIQUE,
  twilio_account_sid TEXT,

  -- Cost tracking
  cost_cents INTEGER,

  -- Error handling
  error_code TEXT,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_communication_logs_workspace_id ON communication_logs(workspace_id);
CREATE INDEX idx_communication_logs_lead_id ON communication_logs(lead_id);
CREATE INDEX idx_communication_logs_type ON communication_logs(communication_type);
CREATE INDEX idx_communication_logs_twilio_sid ON communication_logs(twilio_sid);
CREATE INDEX idx_communication_logs_created_at ON communication_logs(created_at DESC);

-- ============================================================================
-- SMS TEMPLATES TABLE
-- ============================================================================
CREATE TABLE sms_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Template details
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  merge_fields JSONB DEFAULT '[]'::jsonb,

  -- Character count (SMS segments)
  character_count INTEGER GENERATED ALWAYS AS (length(body)) STORED,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sms_templates_workspace_id ON sms_templates(workspace_id);

-- ============================================================================
-- CALENDAR EVENTS TABLE
-- ============================================================================
CREATE TYPE calendar_provider AS ENUM ('google', 'outlook', 'apple');
CREATE TYPE event_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Event details
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  meeting_url TEXT,

  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  all_day BOOLEAN DEFAULT FALSE,

  -- Status
  status event_status NOT NULL DEFAULT 'scheduled',

  -- External calendar sync
  provider calendar_provider,
  external_event_id TEXT,
  synced_at TIMESTAMPTZ,

  -- Reminders
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_minutes_before INTEGER DEFAULT 30,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calendar_events_workspace_id ON calendar_events(workspace_id);
CREATE INDEX idx_calendar_events_lead_id ON calendar_events(lead_id);
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);

-- Updated_at trigger
CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CALENDAR CONNECTIONS TABLE
-- ============================================================================
CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Provider details
  provider calendar_provider NOT NULL,
  provider_account_id TEXT,
  provider_email TEXT,

  -- OAuth tokens (encrypted in production)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Sync settings
  sync_enabled BOOLEAN DEFAULT TRUE,
  calendar_ids TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,

  -- Unique constraint
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

-- Indexes
CREATE INDEX idx_calendar_connections_user_id ON calendar_connections(user_id);

-- ============================================================================
-- CRM CONNECTIONS TABLE (HubSpot, etc.)
-- ============================================================================
CREATE TYPE crm_provider AS ENUM ('hubspot', 'salesforce', 'pipedrive', 'zoho');

CREATE TABLE crm_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Provider details
  provider crm_provider NOT NULL,
  provider_account_id TEXT,

  -- OAuth tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Sync settings
  sync_enabled BOOLEAN DEFAULT TRUE,
  sync_direction TEXT DEFAULT 'both', -- 'to_crm', 'from_crm', 'both'
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,

  -- Field mappings
  field_mappings JSONB DEFAULT '{}'::jsonb,
  -- Example: { "email": "email", "company_name": "company", "status": "lifecyclestage" }

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint
  CONSTRAINT unique_workspace_provider UNIQUE (workspace_id, provider)
);

-- Indexes
CREATE INDEX idx_crm_connections_workspace_id ON crm_connections(workspace_id);

-- Updated_at trigger
CREATE TRIGGER crm_connections_updated_at
  BEFORE UPDATE ON crm_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CRM SYNC LOG TABLE
-- ============================================================================
CREATE TABLE crm_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES crm_connections(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Sync details
  sync_type TEXT NOT NULL, -- 'create', 'update', 'delete'
  sync_direction TEXT NOT NULL, -- 'to_crm', 'from_crm'
  crm_record_id TEXT,
  crm_record_type TEXT, -- 'contact', 'company', 'deal'

  -- Result
  success BOOLEAN NOT NULL,
  error_message TEXT,
  changes JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_crm_sync_log_connection_id ON crm_sync_log(connection_id);
CREATE INDEX idx_crm_sync_log_lead_id ON crm_sync_log(lead_id);
CREATE INDEX idx_crm_sync_log_created_at ON crm_sync_log(created_at DESC);

-- ============================================================================
-- VERIFICATION RESULTS TABLE
-- ============================================================================
CREATE TYPE verification_type AS ENUM ('email', 'phone');
CREATE TYPE verification_status AS ENUM ('pending', 'valid', 'invalid', 'risky', 'unknown');

CREATE TABLE verification_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- What was verified
  verification_type verification_type NOT NULL,
  verified_value TEXT NOT NULL, -- email or phone number

  -- Result
  status verification_status NOT NULL,
  confidence_score DECIMAL(5,2), -- 0-100

  -- Provider details
  provider TEXT NOT NULL, -- 'neverbounce', 'zerobounce', 'twilio_lookup', etc.
  provider_result JSONB DEFAULT '{}'::jsonb,

  -- Email-specific fields
  email_deliverable BOOLEAN,
  email_disposable BOOLEAN,
  email_role_based BOOLEAN,
  email_free_provider BOOLEAN,
  email_mx_found BOOLEAN,
  email_smtp_valid BOOLEAN,

  -- Phone-specific fields
  phone_valid BOOLEAN,
  phone_type TEXT, -- 'mobile', 'landline', 'voip'
  phone_carrier TEXT,
  phone_country TEXT,

  -- Cost tracking
  cost_cents INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_verification_results_workspace_id ON verification_results(workspace_id);
CREATE INDEX idx_verification_results_lead_id ON verification_results(lead_id);
CREATE INDEX idx_verification_results_type ON verification_results(verification_type);
CREATE INDEX idx_verification_results_status ON verification_results(status);
CREATE INDEX idx_verification_results_value ON verification_results(verified_value);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_results ENABLE ROW LEVEL SECURITY;

-- Communication Logs: Workspace isolation
CREATE POLICY "Workspace isolation for communication_logs" ON communication_logs
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

-- SMS Templates: Workspace isolation
CREATE POLICY "Workspace isolation for sms_templates" ON sms_templates
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

-- Calendar Events: Workspace isolation
CREATE POLICY "Workspace isolation for calendar_events" ON calendar_events
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

-- Calendar Connections: User's own connections
CREATE POLICY "User owns calendar_connections" ON calendar_connections
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- CRM Connections: Workspace isolation (admin only for management)
CREATE POLICY "Workspace isolation for crm_connections" ON crm_connections
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

-- CRM Sync Log: Through connection's workspace
CREATE POLICY "Workspace isolation for crm_sync_log" ON crm_sync_log
  FOR ALL USING (connection_id IN (SELECT id FROM crm_connections WHERE workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())));

-- Verification Results: Workspace isolation
CREATE POLICY "Workspace isolation for verification_results" ON verification_results
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE communication_logs IS 'SMS and call logs from Twilio integration';
COMMENT ON TABLE sms_templates IS 'Reusable SMS message templates';
COMMENT ON TABLE calendar_events IS 'Scheduled meetings and appointments with leads';
COMMENT ON TABLE calendar_connections IS 'OAuth connections to external calendar providers';
COMMENT ON TABLE crm_connections IS 'Connections to external CRM systems';
COMMENT ON TABLE crm_sync_log IS 'Log of all CRM sync operations';
COMMENT ON TABLE verification_results IS 'Email and phone verification results';
