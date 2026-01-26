-- Cursive Platform - Email Campaigns
-- Migration for email campaigns and tracking

-- ============================================================================
-- EMAIL CAMPAIGNS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  from_name TEXT,
  reply_to TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, paused, completed
  target_audience JSONB, -- filters for which leads to target
  send_schedule JSONB, -- scheduling rules
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for email campaigns
CREATE INDEX IF NOT EXISTS idx_email_campaigns_workspace ON email_campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);

-- ============================================================================
-- EMAIL SENDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  to_name TEXT,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, delivered, opened, clicked, replied, bounced, unsubscribed
  provider TEXT DEFAULT 'resend', -- resend, emailbison, sendgrid
  provider_message_id TEXT,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_reason TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for email sends
CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON email_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_workspace ON email_sends(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_lead ON email_sends(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status);
CREATE INDEX IF NOT EXISTS idx_email_sends_provider_message ON email_sends(provider_message_id);

-- ============================================================================
-- EMAIL TRACKING EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_tracking_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_send_id UUID NOT NULL REFERENCES email_sends(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- open, click, reply, bounce, unsubscribe
  event_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  link_url TEXT, -- for click events
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for tracking events
CREATE INDEX IF NOT EXISTS idx_email_tracking_send ON email_tracking_events(email_send_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_type ON email_tracking_events(event_type);

-- ============================================================================
-- EMAIL TEMPLATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE, -- NULL for system templates
  name TEXT NOT NULL,
  description TEXT,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  category TEXT DEFAULT 'outreach', -- outreach, follow_up, introduction, etc.
  variables TEXT[], -- array of variable names used in template
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for templates
CREATE INDEX IF NOT EXISTS idx_email_templates_workspace ON email_templates(workspace_id);

-- Insert default system templates
INSERT INTO email_templates (name, description, subject_template, body_template, category, variables, is_system) VALUES
  ('Initial Outreach', 'First contact with a new lead',
   'Quick question about {{company_name}}',
   '<p>Hi {{first_name}},</p><p>I noticed {{company_name}} is in the {{industry}} space. We help businesses like yours get more qualified leads.</p><p>Would you have 15 minutes this week for a quick call?</p><p>Best,<br/>{{sender_name}}</p>',
   'outreach', ARRAY['first_name', 'company_name', 'industry', 'sender_name'], true),
  ('Follow Up', 'Follow up after no response',
   'Following up - {{company_name}}',
   '<p>Hi {{first_name}},</p><p>I wanted to follow up on my previous email. I understand you''re busy - would it be helpful if I shared a quick case study of how we helped a similar {{industry}} company?</p><p>Best,<br/>{{sender_name}}</p>',
   'follow_up', ARRAY['first_name', 'company_name', 'industry', 'sender_name'], true),
  ('Introduction', 'Warm introduction email',
   'Introduction: {{sender_name}} from Cursive',
   '<p>Hi {{first_name}},</p><p>I''m {{sender_name}} from Cursive. We specialize in helping {{industry}} businesses find ready-to-buy customers.</p><p>Based on your role at {{company_name}}, I thought you might be interested in learning how we can help you generate more qualified leads.</p><p>Are you available for a brief call this week?</p><p>Best,<br/>{{sender_name}}</p>',
   'introduction', ARRAY['first_name', 'company_name', 'industry', 'sender_name'], true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- WORKSPACE EMAIL SETTINGS
-- ============================================================================
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS email_provider TEXT DEFAULT 'resend';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS email_sending_enabled BOOLEAN DEFAULT false;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS email_daily_limit INTEGER DEFAULT 100;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS email_sent_today INTEGER DEFAULT 0;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS email_from_name TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS email_from_email TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS email_reply_to TEXT;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Workspace isolation
CREATE POLICY "Workspace email campaigns" ON email_campaigns
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace email sends" ON email_sends
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace tracking events" ON email_tracking_events
  FOR ALL USING (
    email_send_id IN (
      SELECT id FROM email_sends WHERE workspace_id IN (
        SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Workspace templates" ON email_templates
  FOR ALL USING (
    workspace_id IS NULL OR workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE email_campaigns IS 'Email outreach campaigns';
COMMENT ON TABLE email_sends IS 'Individual email sends with tracking';
COMMENT ON TABLE email_tracking_events IS 'Email engagement events (opens, clicks, etc.)';
COMMENT ON TABLE email_templates IS 'Reusable email templates';
