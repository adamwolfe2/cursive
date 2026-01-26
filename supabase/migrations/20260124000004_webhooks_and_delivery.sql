-- Cursive Platform - Webhooks and Lead Delivery
-- Migration for real-time lead notifications

-- ============================================================================
-- ADD WEBHOOK FIELDS TO WORKSPACES
-- ============================================================================
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS webhook_secret TEXT DEFAULT 'whsec_' || replace(gen_random_uuid()::text, '-', '');
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN DEFAULT false;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS notification_email TEXT;

-- ============================================================================
-- WEBHOOK DELIVERIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- lead.created, lead.updated, lead.delivered
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed, retrying
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for webhook deliveries
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_workspace ON webhook_deliveries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE status = 'retrying';

-- ============================================================================
-- EMAIL NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL, -- new_lead, lead_summary, engagement_alert
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email notifications
CREATE INDEX IF NOT EXISTS idx_email_notifications_workspace ON email_notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);

-- ============================================================================
-- LEAD DELIVERY TRACKING
-- ============================================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS delivery_method TEXT; -- webhook, email, api
ALTER TABLE leads ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Workspace isolation for webhook deliveries
CREATE POLICY "Workspace webhook deliveries" ON webhook_deliveries
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Workspace isolation for email notifications
CREATE POLICY "Workspace email notifications" ON email_notifications
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery attempts and status tracking';
COMMENT ON TABLE email_notifications IS 'Email notification tracking';
