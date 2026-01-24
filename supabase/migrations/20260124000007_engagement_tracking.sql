-- Cursive Platform - Engagement Tracking
-- Migration for tracking lead engagement and replies

-- ============================================================================
-- LEAD ENGAGEMENT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_engagements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  engagement_type TEXT NOT NULL, -- email_open, email_click, email_reply, call, meeting, form_submit
  engagement_source TEXT, -- email_campaign, outbound, inbound, website
  engagement_score INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for engagements
CREATE INDEX IF NOT EXISTS idx_lead_engagements_workspace ON lead_engagements(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lead_engagements_lead ON lead_engagements(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_engagements_type ON lead_engagements(engagement_type);
CREATE INDEX IF NOT EXISTS idx_lead_engagements_created ON lead_engagements(created_at);

-- ============================================================================
-- INBOUND MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inbound_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  email_send_id UUID REFERENCES email_sends(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL, -- email_reply, form_submit, chat
  from_email TEXT,
  from_name TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  raw_payload JSONB,
  processed BOOLEAN DEFAULT false,
  sentiment TEXT, -- positive, neutral, negative, interested, not_interested
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for inbound messages
CREATE INDEX IF NOT EXISTS idx_inbound_messages_workspace ON inbound_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_inbound_messages_lead ON inbound_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_inbound_messages_email ON inbound_messages(from_email);
CREATE INDEX IF NOT EXISTS idx_inbound_messages_processed ON inbound_messages(processed);

-- ============================================================================
-- UPDATE LEADS TABLE FOR ENGAGEMENT
-- ============================================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_engagement_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS total_opens INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS total_clicks INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS total_replies INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_temperature TEXT DEFAULT 'cold'; -- cold, warm, hot
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_interested BOOLEAN;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest_notes TEXT;

-- Index for engagement queries
CREATE INDEX IF NOT EXISTS idx_leads_engagement ON leads(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON leads(lead_temperature);
CREATE INDEX IF NOT EXISTS idx_leads_last_engagement ON leads(last_engagement_at);

-- ============================================================================
-- FUNCTION TO UPDATE LEAD ENGAGEMENT SCORE
-- ============================================================================
CREATE OR REPLACE FUNCTION update_lead_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Update lead engagement metrics
  UPDATE leads
  SET
    engagement_score = COALESCE(engagement_score, 0) + NEW.engagement_score,
    last_engagement_at = NEW.created_at,
    total_opens = CASE WHEN NEW.engagement_type = 'email_open' THEN COALESCE(total_opens, 0) + 1 ELSE total_opens END,
    total_clicks = CASE WHEN NEW.engagement_type = 'email_click' THEN COALESCE(total_clicks, 0) + 1 ELSE total_clicks END,
    total_replies = CASE WHEN NEW.engagement_type = 'email_reply' THEN COALESCE(total_replies, 0) + 1 ELSE total_replies END,
    lead_temperature = CASE
      WHEN COALESCE(engagement_score, 0) + NEW.engagement_score >= 10 THEN 'hot'
      WHEN COALESCE(engagement_score, 0) + NEW.engagement_score >= 5 THEN 'warm'
      ELSE 'cold'
    END
  WHERE id = NEW.lead_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for engagement score updates
DROP TRIGGER IF EXISTS trigger_update_engagement_score ON lead_engagements;
CREATE TRIGGER trigger_update_engagement_score
  AFTER INSERT ON lead_engagements
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_engagement_score();

-- ============================================================================
-- FUNCTION TO INCREMENT CAMPAIGN STATS
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_campaign_opens(p_campaign_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE email_campaigns
  SET total_opened = COALESCE(total_opened, 0) + 1
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_campaign_clicks(p_campaign_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE email_campaigns
  SET total_clicked = COALESCE(total_clicked, 0) + 1
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_campaign_replies(p_campaign_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE email_campaigns
  SET total_replied = COALESCE(total_replied, 0) + 1
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE lead_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_messages ENABLE ROW LEVEL SECURITY;

-- Workspace isolation
CREATE POLICY "Workspace lead engagements" ON lead_engagements
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace inbound messages" ON inbound_messages
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE lead_engagements IS 'Track all lead engagement events';
COMMENT ON TABLE inbound_messages IS 'Store inbound email replies and messages';
COMMENT ON FUNCTION update_lead_engagement_score IS 'Automatically update lead scores on engagement';
