-- Waitlist Signups Migration
-- Creates a table for email signups/waitlist separate from users table

-- ============================================================================
-- WAITLIST_SIGNUPS TABLE
-- ============================================================================
CREATE TABLE waitlist_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Required fields
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,

  -- Optional fields
  industry TEXT,
  linkedin_url TEXT,

  -- Tracking
  source TEXT DEFAULT 'website', -- where the signup came from
  ip_address TEXT,
  user_agent TEXT,

  -- Status
  converted_to_user BOOLEAN NOT NULL DEFAULT FALSE,
  converted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT waitlist_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT waitlist_email_unique UNIQUE (email),
  CONSTRAINT waitlist_linkedin_format CHECK (
    linkedin_url IS NULL OR
    linkedin_url ~* '^https?://(www\.)?linkedin\.com/'
  )
);

-- Indexes for waitlist_signups
CREATE INDEX idx_waitlist_signups_email ON waitlist_signups(email);
CREATE INDEX idx_waitlist_signups_created_at ON waitlist_signups(created_at DESC);
CREATE INDEX idx_waitlist_signups_industry ON waitlist_signups(industry) WHERE industry IS NOT NULL;
CREATE INDEX idx_waitlist_signups_converted ON waitlist_signups(converted_to_user) WHERE converted_to_user = FALSE;

-- Updated_at trigger for waitlist_signups
CREATE TRIGGER waitlist_signups_updated_at
  BEFORE UPDATE ON waitlist_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on waitlist_signups
ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public signups)
CREATE POLICY "Allow anonymous inserts" ON waitlist_signups
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view waitlist signups (via service role)
-- Regular users cannot access this table via RLS

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE waitlist_signups IS 'Email waitlist signups separate from users table for pre-launch collection';
COMMENT ON COLUMN waitlist_signups.converted_to_user IS 'True when this waitlist signup has been converted to a full user account';
COMMENT ON COLUMN waitlist_signups.source IS 'Source of the signup: website, video, partner, etc.';
