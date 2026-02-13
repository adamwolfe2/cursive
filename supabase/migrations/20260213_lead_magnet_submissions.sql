-- =====================================================
-- Lead Magnet Submissions Table
-- Captures email from "Free Audit" modals
-- Date: 2026-02-13
-- =====================================================

-- =====================================================
-- 1. CREATE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_magnet_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact info
  email TEXT NOT NULL,

  -- Audit type selection
  audit_type TEXT NOT NULL CHECK (audit_type IN ('ai_audit', 'visitor_audit')),

  -- Tracking data
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,

  -- Follow-up tracking
  email_sent_at TIMESTAMPTZ,
  form_completed_at TIMESTAMPTZ,
  converted_to_customer BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

-- Find by email (for deduplication and follow-up)
CREATE INDEX IF NOT EXISTS idx_lead_magnet_email
  ON lead_magnet_submissions(email);

-- Find recent submissions
CREATE INDEX IF NOT EXISTS idx_lead_magnet_created
  ON lead_magnet_submissions(created_at DESC);

-- Find by audit type
CREATE INDEX IF NOT EXISTS idx_lead_magnet_type
  ON lead_magnet_submissions(audit_type, created_at DESC);

-- Find unconverted leads for follow-up
CREATE INDEX IF NOT EXISTS idx_lead_magnet_unconverted
  ON lead_magnet_submissions(email_sent_at, converted_to_customer)
  WHERE email_sent_at IS NULL OR converted_to_customer = false;

-- =====================================================
-- 3. CREATE UNIQUE CONSTRAINT
-- =====================================================

-- Prevent duplicate submissions (same email + audit type)
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_magnet_unique_submission
  ON lead_magnet_submissions(email, audit_type);

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

-- Public endpoint needs service_role access
-- No RLS needed - admin-only access via service role

-- =====================================================
-- 5. CREATE UPDATED_AT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_lead_magnet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lead_magnet_updated_at
  BEFORE UPDATE ON lead_magnet_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_magnet_updated_at();

-- =====================================================
-- 6. CREATE HELPER FUNCTIONS
-- =====================================================

-- Get submission stats
CREATE OR REPLACE FUNCTION get_lead_magnet_stats(
  p_days INTEGER DEFAULT 30
)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'total_submissions', (
      SELECT COUNT(*)
      FROM lead_magnet_submissions
      WHERE created_at > NOW() - (p_days || ' days')::INTERVAL
    ),
    'ai_audit_count', (
      SELECT COUNT(*)
      FROM lead_magnet_submissions
      WHERE audit_type = 'ai_audit'
        AND created_at > NOW() - (p_days || ' days')::INTERVAL
    ),
    'visitor_audit_count', (
      SELECT COUNT(*)
      FROM lead_magnet_submissions
      WHERE audit_type = 'visitor_audit'
        AND created_at > NOW() - (p_days || ' days')::INTERVAL
    ),
    'emails_sent', (
      SELECT COUNT(*)
      FROM lead_magnet_submissions
      WHERE email_sent_at IS NOT NULL
        AND created_at > NOW() - (p_days || ' days')::INTERVAL
    ),
    'converted_count', (
      SELECT COUNT(*)
      FROM lead_magnet_submissions
      WHERE converted_to_customer = true
        AND created_at > NOW() - (p_days || ' days')::INTERVAL
    ),
    'conversion_rate', (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE converted_to_customer = true)::NUMERIC /
         NULLIF(COUNT(*), 0)) * 100, 2
      )
      FROM lead_magnet_submissions
      WHERE created_at > NOW() - (p_days || ' days')::INTERVAL
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_lead_magnet_stats(INTEGER) TO service_role;

-- Mark email as sent
CREATE OR REPLACE FUNCTION mark_lead_magnet_email_sent(p_email TEXT, p_audit_type TEXT)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  UPDATE lead_magnet_submissions
  SET email_sent_at = NOW()
  WHERE email = p_email
    AND audit_type = p_audit_type
    AND email_sent_at IS NULL
  RETURNING json_build_object(
    'id', id,
    'email', email,
    'email_sent_at', email_sent_at
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION mark_lead_magnet_email_sent(TEXT, TEXT) TO service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE lead_magnet_submissions IS 'Email captures from Free Audit modal - lead magnet for customer acquisition';
COMMENT ON COLUMN lead_magnet_submissions.audit_type IS 'Which audit type user selected: ai_audit or visitor_audit';
COMMENT ON COLUMN lead_magnet_submissions.email_sent_at IS 'When follow-up email with onboarding link was sent';
COMMENT ON COLUMN lead_magnet_submissions.form_completed_at IS 'When user completed full onboarding form';
COMMENT ON COLUMN lead_magnet_submissions.converted_to_customer IS 'Whether lead became a paying customer';
