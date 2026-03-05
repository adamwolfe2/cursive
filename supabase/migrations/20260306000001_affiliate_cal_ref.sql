-- Affiliate attribution: capture ref_code on Cal.com bookings
-- This allows pre-attribution at booking time (before signup)
-- and enables connecting a demo lead to the affiliate who referred them.

ALTER TABLE cal_bookings ADD COLUMN IF NOT EXISTS ref_code TEXT;

CREATE INDEX IF NOT EXISTS idx_cal_bookings_ref_code
  ON cal_bookings(ref_code)
  WHERE ref_code IS NOT NULL;
