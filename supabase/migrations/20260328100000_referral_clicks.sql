-- Add referral_clicks counter to workspaces table
-- Tracks how many times a workspace's referral link has been clicked

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS referral_clicks INTEGER DEFAULT 0 NOT NULL;

COMMENT ON COLUMN workspaces.referral_clicks IS 'Number of times this workspace''s referral link has been clicked (tracked via /api/referrals/track-click)';
