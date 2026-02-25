-- Demo Pixel Claim Flow Migration
-- Allows pixels to be created during sales demos (workspace_id = null)
-- and then claimed when the prospect signs up.

-- 1. Make workspace_id nullable (demo pixels don't have a workspace yet)
ALTER TABLE audiencelab_pixels
  ALTER COLUMN workspace_id DROP NOT NULL;

-- 2. Update trial_status CHECK constraint to include 'demo'
--    Drop the auto-generated constraint (PostgreSQL names it <table>_<col>_check)
ALTER TABLE audiencelab_pixels
  DROP CONSTRAINT IF EXISTS audiencelab_pixels_trial_status_check;

ALTER TABLE audiencelab_pixels
  ADD CONSTRAINT audiencelab_pixels_trial_status_check
  CHECK (trial_status IN ('trial', 'expired', 'active', 'cancelled', 'demo'));

-- 3. Fast lookup index for unclaimed demo pixels by domain
CREATE INDEX IF NOT EXISTS idx_al_pixels_demo_domain
  ON audiencelab_pixels (domain, created_at DESC)
  WHERE workspace_id IS NULL AND trial_status = 'demo';

-- Note: RLS workspace isolation policy stays unchanged — unclaimed demo pixels
-- (workspace_id IS NULL) are only accessible via the service_role (admin client).
-- Regular authenticated users cannot query or modify them through RLS.
