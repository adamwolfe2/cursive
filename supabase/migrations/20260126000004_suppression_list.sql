-- ============================================================================
-- PHASE 17: SUPPRESSION LIST AND WEBHOOK PROCESSING
-- Migration: 20260126000004_suppression_list.sql
-- Creates suppressed_emails table and tracking enhancements
-- ============================================================================

-- ============================================================================
-- 1. CREATE SUPPRESSED_EMAILS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'hard_bounce', 'complaint', 'manual')),
  source_campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  source_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  suppressed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint per workspace
  UNIQUE(workspace_id, email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suppressed_emails_workspace ON suppressed_emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON suppressed_emails(email);
CREATE INDEX IF NOT EXISTS idx_suppressed_emails_reason ON suppressed_emails(reason);

-- RLS
ALTER TABLE suppressed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace isolation for suppressed_emails" ON suppressed_emails
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

COMMENT ON TABLE suppressed_emails IS 'Emails that should not receive any campaign emails';
COMMENT ON COLUMN suppressed_emails.reason IS 'Why the email was suppressed: unsubscribe, hard_bounce, complaint, manual';

-- ============================================================================
-- 2. ADD TRACKING COLUMNS TO EMAIL_SENDS
-- ============================================================================

ALTER TABLE email_sends
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicked_links JSONB DEFAULT '[]';

COMMENT ON COLUMN email_sends.opened_at IS 'First open timestamp';
COMMENT ON COLUMN email_sends.clicked_at IS 'First click timestamp';
COMMENT ON COLUMN email_sends.open_count IS 'Total number of opens';
COMMENT ON COLUMN email_sends.click_count IS 'Total number of clicks';
COMMENT ON COLUMN email_sends.clicked_links IS 'Array of {url, clicked_at} for each link clicked';

-- ============================================================================
-- 3. ADD ENGAGEMENT STATS TO CAMPAIGNS
-- ============================================================================

ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS emails_opened INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_clicked INTEGER DEFAULT 0;

COMMENT ON COLUMN email_campaigns.emails_opened IS 'Total unique opens across campaign';
COMMENT ON COLUMN email_campaigns.emails_clicked IS 'Total unique clicks across campaign';

-- ============================================================================
-- 4. HELPER FUNCTION: CHECK SUPPRESSION
-- ============================================================================

CREATE OR REPLACE FUNCTION is_email_suppressed(
  p_email TEXT,
  p_workspace_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_suppressed BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM suppressed_emails
    WHERE email = LOWER(p_email)
    AND workspace_id = p_workspace_id
  ) INTO v_suppressed;

  RETURN v_suppressed;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_email_suppressed IS 'Check if an email is on the suppression list';

-- ============================================================================
-- 5. HELPER FUNCTION: ADD TO SUPPRESSION LIST
-- ============================================================================

CREATE OR REPLACE FUNCTION add_to_suppression_list(
  p_email TEXT,
  p_workspace_id UUID,
  p_reason TEXT,
  p_campaign_id UUID DEFAULT NULL,
  p_lead_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_suppression_id UUID;
BEGIN
  INSERT INTO suppressed_emails (
    workspace_id,
    email,
    reason,
    source_campaign_id,
    source_lead_id,
    metadata
  ) VALUES (
    p_workspace_id,
    LOWER(p_email),
    p_reason,
    p_campaign_id,
    p_lead_id,
    p_metadata
  )
  ON CONFLICT (workspace_id, email)
  DO UPDATE SET
    reason = p_reason,
    source_campaign_id = COALESCE(p_campaign_id, suppressed_emails.source_campaign_id),
    metadata = suppressed_emails.metadata || p_metadata,
    suppressed_at = NOW()
  RETURNING id INTO v_suppression_id;

  RETURN v_suppression_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_to_suppression_list IS 'Add an email to the suppression list (upsert)';

-- ============================================================================
-- 6. TRIGGER: AUTO-SUPPRESS ON CAMPAIGN LEAD STATUS CHANGE
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_suppress_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_lead RECORD;
  v_campaign RECORD;
BEGIN
  -- Only process specific status changes
  IF NEW.status IN ('unsubscribed', 'bounced') AND
     (OLD.status IS NULL OR OLD.status NOT IN ('unsubscribed', 'bounced')) THEN

    -- Get lead and campaign info
    SELECT * INTO v_lead FROM leads WHERE id = NEW.lead_id;
    SELECT * INTO v_campaign FROM email_campaigns WHERE id = NEW.campaign_id;

    IF v_lead IS NOT NULL AND v_lead.email IS NOT NULL THEN
      PERFORM add_to_suppression_list(
        v_lead.email,
        v_campaign.workspace_id,
        CASE WHEN NEW.status = 'unsubscribed' THEN 'unsubscribe' ELSE 'hard_bounce' END,
        NEW.campaign_id,
        NEW.lead_id,
        jsonb_build_object('bounce_reason', NEW.bounce_reason)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_auto_suppress ON campaign_leads;
CREATE TRIGGER trg_auto_suppress
  AFTER UPDATE OF status ON campaign_leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_suppress_on_status_change();

COMMENT ON FUNCTION auto_suppress_on_status_change IS 'Auto-add to suppression list when lead bounces or unsubscribes';
