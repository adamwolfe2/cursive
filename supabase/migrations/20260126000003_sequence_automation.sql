-- ============================================================================
-- PHASE 16: EMAIL SEQUENCE AUTOMATION
-- Migration: 20260126000003_sequence_automation.sql
-- Adds auto-send capability and sequence processing fields
-- ============================================================================

-- ============================================================================
-- 1. ADD AUTO-SEND CONFIGURATION TO CAMPAIGNS
-- ============================================================================

-- Auto-send approved: skip human review for follow-up emails
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS auto_send_approved BOOLEAN DEFAULT false;

-- Track campaign start/pause/complete timestamps
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add send window configuration (will be used by Phase 20)
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS send_window_start TIME DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS send_window_end TIME DEFAULT '17:00',
ADD COLUMN IF NOT EXISTS send_days TEXT[] DEFAULT ARRAY['mon', 'tue', 'wed', 'thu', 'fri'],
ADD COLUMN IF NOT EXISTS send_timezone TEXT DEFAULT 'America/New_York';

COMMENT ON COLUMN email_campaigns.auto_send_approved IS 'When true, follow-up emails bypass human review';
COMMENT ON COLUMN email_campaigns.send_window_start IS 'Earliest time to send emails (HH:MM)';
COMMENT ON COLUMN email_campaigns.send_window_end IS 'Latest time to send emails (HH:MM)';
COMMENT ON COLUMN email_campaigns.send_days IS 'Days to send emails (mon, tue, wed, thu, fri, sat, sun)';
COMMENT ON COLUMN email_campaigns.send_timezone IS 'Timezone for send window calculations';

-- ============================================================================
-- 2. ENHANCE CAMPAIGN_LEADS FOR SEQUENCE TRACKING
-- ============================================================================

-- Ensure we have the necessary columns for sequence tracking
ALTER TABLE campaign_leads
ADD COLUMN IF NOT EXISTS next_email_scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sequence_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS emails_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_opened INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_clicked INTEGER DEFAULT 0;

-- Index for finding leads ready for next sequence step
CREATE INDEX IF NOT EXISTS idx_campaign_leads_next_scheduled
ON campaign_leads(campaign_id, next_email_scheduled_at)
WHERE status = 'in_sequence' AND next_email_scheduled_at IS NOT NULL;

-- Index for active sequences by status
CREATE INDEX IF NOT EXISTS idx_campaign_leads_in_sequence
ON campaign_leads(campaign_id)
WHERE status = 'in_sequence';

COMMENT ON COLUMN campaign_leads.next_email_scheduled_at IS 'When to send the next email in sequence';
COMMENT ON COLUMN campaign_leads.sequence_completed_at IS 'When the lead completed the full sequence';
COMMENT ON COLUMN campaign_leads.emails_sent IS 'Total emails sent to this lead in campaign';
COMMENT ON COLUMN campaign_leads.emails_opened IS 'Total emails opened by this lead';
COMMENT ON COLUMN campaign_leads.emails_clicked IS 'Total email clicks by this lead';

-- ============================================================================
-- 3. ADD SEQUENCE_STEP TO EMAIL_SENDS
-- ============================================================================

-- Track which sequence step this email belongs to
ALTER TABLE email_sends
ADD COLUMN IF NOT EXISTS sequence_step INTEGER DEFAULT 1;

-- Index for finding emails by sequence step
CREATE INDEX IF NOT EXISTS idx_email_sends_sequence_step
ON email_sends(campaign_id, sequence_step);

COMMENT ON COLUMN email_sends.sequence_step IS 'Which step in the sequence this email represents (1-indexed)';

-- ============================================================================
-- 4. HELPER FUNCTION: CALCULATE NEXT SEND TIME
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_next_send_time(
  p_campaign_id UUID,
  p_current_step INTEGER
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_campaign RECORD;
  v_days_delay INTEGER;
  v_next_time TIMESTAMPTZ;
BEGIN
  -- Get campaign settings
  SELECT
    sequence_steps,
    days_between_steps,
    send_window_start,
    send_window_end,
    send_timezone,
    send_days
  INTO v_campaign
  FROM email_campaigns
  WHERE id = p_campaign_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Check if sequence is complete
  IF p_current_step >= v_campaign.sequence_steps THEN
    RETURN NULL;
  END IF;

  -- Get days delay for next step (array is 0-indexed, but step 1->2 uses index 0)
  v_days_delay := COALESCE(
    v_campaign.days_between_steps[p_current_step],
    v_campaign.days_between_steps[array_length(v_campaign.days_between_steps, 1)],
    3 -- default 3 days
  );

  -- Calculate base next time
  v_next_time := NOW() + (v_days_delay || ' days')::INTERVAL;

  -- Adjust to send window (simple implementation - Phase 20 will enhance)
  -- Set time to middle of send window
  v_next_time := date_trunc('day', v_next_time) +
    ((EXTRACT(HOUR FROM v_campaign.send_window_start::TIME) +
      EXTRACT(HOUR FROM v_campaign.send_window_end::TIME)) / 2 || ' hours')::INTERVAL;

  RETURN v_next_time;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_next_send_time IS 'Calculates when to schedule the next sequence email';

-- ============================================================================
-- 5. TRIGGER: AUTO-UPDATE SEQUENCE AFTER EMAIL SENT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_campaign_lead_after_send()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign RECORD;
  v_next_time TIMESTAMPTZ;
BEGIN
  -- Only process when status changes to 'sent'
  IF NEW.status = 'sent' AND (OLD.status IS NULL OR OLD.status != 'sent') THEN
    -- Get campaign settings
    SELECT sequence_steps INTO v_campaign
    FROM email_campaigns
    WHERE id = NEW.campaign_id;

    -- Calculate next send time
    v_next_time := calculate_next_send_time(NEW.campaign_id, NEW.sequence_step);

    -- Update campaign_lead
    UPDATE campaign_leads
    SET
      current_step = NEW.sequence_step,
      last_email_sent_at = NEW.sent_at,
      emails_sent = emails_sent + 1,
      next_email_scheduled_at = v_next_time,
      status = CASE
        WHEN NEW.sequence_step >= v_campaign.sequence_steps THEN 'completed'
        ELSE status
      END,
      sequence_completed_at = CASE
        WHEN NEW.sequence_step >= v_campaign.sequence_steps THEN NOW()
        ELSE sequence_completed_at
      END,
      updated_at = NOW()
    WHERE id = NEW.campaign_lead_id;

    -- Update campaign stats
    UPDATE email_campaigns
    SET
      total_sent = COALESCE(total_sent, 0) + 1,
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS trg_update_campaign_lead_after_send ON email_sends;
CREATE TRIGGER trg_update_campaign_lead_after_send
  AFTER UPDATE OF status ON email_sends
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_lead_after_send();

COMMENT ON FUNCTION update_campaign_lead_after_send IS 'Updates campaign_lead tracking when an email is sent';
