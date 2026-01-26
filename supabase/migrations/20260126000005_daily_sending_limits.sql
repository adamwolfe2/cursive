-- ============================================================================
-- PHASE 19: DAILY SENDING LIMITS
-- Migration: 20260126000005_daily_sending_limits.sql
-- Adds daily send limits to campaigns and workspaces
-- ============================================================================

-- ============================================================================
-- 1. ADD DAILY LIMIT COLUMNS TO EMAIL_CAMPAIGNS
-- ============================================================================

ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS daily_send_limit INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS sends_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_send_reset_at DATE DEFAULT CURRENT_DATE;

COMMENT ON COLUMN email_campaigns.daily_send_limit IS 'Maximum emails to send per day for this campaign';
COMMENT ON COLUMN email_campaigns.sends_today IS 'Count of emails sent today (resets at midnight)';
COMMENT ON COLUMN email_campaigns.last_send_reset_at IS 'Date when sends_today was last reset';

-- ============================================================================
-- 2. ADD GLOBAL DAILY LIMIT COLUMNS TO WORKSPACES
-- ============================================================================

ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS global_daily_send_limit INTEGER DEFAULT 200,
ADD COLUMN IF NOT EXISTS sends_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_send_reset_at DATE DEFAULT CURRENT_DATE;

COMMENT ON COLUMN workspaces.global_daily_send_limit IS 'Maximum emails to send per day across all campaigns';
COMMENT ON COLUMN workspaces.sends_today IS 'Count of emails sent today workspace-wide (resets at midnight)';
COMMENT ON COLUMN workspaces.last_send_reset_at IS 'Date when sends_today was last reset';

-- ============================================================================
-- 3. HELPER FUNCTION: CHECK SEND LIMITS
-- ============================================================================

CREATE OR REPLACE FUNCTION check_send_limits(
  p_campaign_id UUID,
  p_workspace_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_campaign RECORD;
  v_workspace RECORD;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get campaign limits
  SELECT
    daily_send_limit,
    sends_today,
    last_send_reset_at
  INTO v_campaign
  FROM email_campaigns
  WHERE id = p_campaign_id;

  -- Get workspace limits
  SELECT
    global_daily_send_limit,
    sends_today,
    last_send_reset_at
  INTO v_workspace
  FROM workspaces
  WHERE id = p_workspace_id;

  -- Reset counts if needed
  IF v_campaign.last_send_reset_at < v_today THEN
    UPDATE email_campaigns
    SET sends_today = 0, last_send_reset_at = v_today
    WHERE id = p_campaign_id;
    v_campaign.sends_today := 0;
  END IF;

  IF v_workspace.last_send_reset_at < v_today THEN
    UPDATE workspaces
    SET sends_today = 0, last_send_reset_at = v_today
    WHERE id = p_workspace_id;
    v_workspace.sends_today := 0;
  END IF;

  RETURN jsonb_build_object(
    'can_send', (v_campaign.sends_today < v_campaign.daily_send_limit)
                AND (v_workspace.sends_today < v_workspace.global_daily_send_limit),
    'campaign_limit', v_campaign.daily_send_limit,
    'campaign_sent', v_campaign.sends_today,
    'campaign_remaining', GREATEST(0, v_campaign.daily_send_limit - v_campaign.sends_today),
    'workspace_limit', v_workspace.global_daily_send_limit,
    'workspace_sent', v_workspace.sends_today,
    'workspace_remaining', GREATEST(0, v_workspace.global_daily_send_limit - v_workspace.sends_today),
    'limit_reached', (v_campaign.sends_today >= v_campaign.daily_send_limit)
                     OR (v_workspace.sends_today >= v_workspace.global_daily_send_limit),
    'limit_type', CASE
      WHEN v_campaign.sends_today >= v_campaign.daily_send_limit THEN 'campaign'
      WHEN v_workspace.sends_today >= v_workspace.global_daily_send_limit THEN 'workspace'
      ELSE NULL
    END
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_send_limits IS 'Check if campaign/workspace daily send limits have been reached';

-- ============================================================================
-- 4. HELPER FUNCTION: INCREMENT SEND COUNT
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_send_count(
  p_campaign_id UUID,
  p_workspace_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Update campaign count
  UPDATE email_campaigns
  SET
    sends_today = CASE
      WHEN last_send_reset_at < v_today THEN 1
      ELSE sends_today + 1
    END,
    last_send_reset_at = v_today
  WHERE id = p_campaign_id;

  -- Update workspace count
  UPDATE workspaces
  SET
    sends_today = CASE
      WHEN last_send_reset_at < v_today THEN 1
      ELSE sends_today + 1
    END,
    last_send_reset_at = v_today
  WHERE id = p_workspace_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_send_count IS 'Increment daily send counters for campaign and workspace';

-- ============================================================================
-- 5. HELPER FUNCTION: RESET ALL DAILY COUNTS
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_all_daily_send_counts() RETURNS INTEGER AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_campaigns_reset INTEGER;
  v_workspaces_reset INTEGER;
BEGIN
  -- Reset campaigns
  UPDATE email_campaigns
  SET sends_today = 0, last_send_reset_at = v_today
  WHERE last_send_reset_at < v_today AND sends_today > 0;
  GET DIAGNOSTICS v_campaigns_reset = ROW_COUNT;

  -- Reset workspaces
  UPDATE workspaces
  SET sends_today = 0, last_send_reset_at = v_today
  WHERE last_send_reset_at < v_today AND sends_today > 0;
  GET DIAGNOSTICS v_workspaces_reset = ROW_COUNT;

  RETURN v_campaigns_reset + v_workspaces_reset;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reset_all_daily_send_counts IS 'Reset all daily send counts (called at midnight)';

-- ============================================================================
-- 6. ADD INDEX FOR FINDING CAMPAIGNS AT LIMIT
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_email_campaigns_at_limit
ON email_campaigns(workspace_id)
WHERE status = 'active' AND sends_today >= daily_send_limit;

CREATE INDEX IF NOT EXISTS idx_workspaces_at_limit
ON workspaces(id)
WHERE sends_today >= global_daily_send_limit;
