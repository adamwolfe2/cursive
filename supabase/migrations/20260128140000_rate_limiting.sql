-- Migration: Rate Limiting Infrastructure
-- Supports API rate limiting for abuse prevention

-- Rate limit logs table
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL, -- Format: {limit_type}:{identifier}
  limit_type VARCHAR(50) NOT NULL,
  identifier VARCHAR(255) NOT NULL, -- user ID, IP, or API key
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient window queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_key_time
ON rate_limit_logs(key, created_at DESC);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created
ON rate_limit_logs(created_at);

-- Auto-cleanup function (call periodically)
CREATE OR REPLACE FUNCTION cleanup_rate_limit_logs()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Delete logs older than 2 hours
  DELETE FROM rate_limit_logs
  WHERE created_at < NOW() - INTERVAL '2 hours';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Add referral fraud tracking columns
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referrer_ip VARCHAR(50);
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referee_ip VARCHAR(50);
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS fraud_check_passed BOOLEAN DEFAULT true;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS fraud_check_reason TEXT;

-- Index for IP-based queries
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_ip
ON referrals(referrer_ip, created_at DESC)
WHERE referrer_ip IS NOT NULL;

-- No RLS on rate_limit_logs - internal use only via service role
-- But let's enable it for safety with service role policy
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON rate_limit_logs
  FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE rate_limit_logs IS
'Tracks API requests for rate limiting. Logs are auto-cleaned after 2 hours.';
