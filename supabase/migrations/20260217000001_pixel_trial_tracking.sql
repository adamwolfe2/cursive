-- Pixel Trial Tracking Migration
-- Adds 14-day trial support to audiencelab_pixels

-- Add trial fields to audiencelab_pixels
ALTER TABLE audiencelab_pixels
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_status TEXT DEFAULT 'trial' CHECK (trial_status IN ('trial', 'expired', 'active', 'cancelled')),
  ADD COLUMN IF NOT EXISTS trial_notified_day3 BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_notified_day7 BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_notified_day10 BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_notified_day13 BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_notified_expired BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS upgrade_cta_clicked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visitor_count_total INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visitor_count_identified INTEGER DEFAULT 0;

-- Backfill: set trial_ends_at for existing pixels that don't have it
UPDATE audiencelab_pixels
SET
  trial_ends_at = created_at + INTERVAL '14 days',
  trial_status = CASE
    WHEN created_at + INTERVAL '14 days' < NOW() THEN 'expired'
    ELSE 'trial'
  END
WHERE trial_ends_at IS NULL;

-- Index for fast trial expiry checks
CREATE INDEX IF NOT EXISTS idx_audiencelab_pixels_trial_status
  ON audiencelab_pixels (trial_status, trial_ends_at)
  WHERE trial_status = 'trial';

-- Index for workspace lookup
CREATE INDEX IF NOT EXISTS idx_audiencelab_pixels_workspace_active
  ON audiencelab_pixels (workspace_id, is_active);
