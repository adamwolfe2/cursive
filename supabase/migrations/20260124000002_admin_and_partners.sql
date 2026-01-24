-- Cursive Platform - Admin and Partner System
-- Migration for admin authentication and partner management

-- ============================================================================
-- PLATFORM ADMINS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial admin
INSERT INTO platform_admins (email, full_name)
VALUES ('adam@meetcursive.com', 'Adam')
ON CONFLICT (email) DO NOTHING;

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_platform_admins_email ON platform_admins(email);

-- RLS policies for platform_admins
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin list
CREATE POLICY "Admins can view admin list" ON platform_admins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins pa
      WHERE pa.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- ============================================================================
-- PARTNERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  company_name TEXT,
  api_key TEXT UNIQUE NOT NULL DEFAULT 'pk_' || replace(gen_random_uuid()::text, '-', ''),
  payout_rate DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  total_leads_uploaded INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for api_key lookup
CREATE INDEX IF NOT EXISTS idx_partners_api_key ON partners(api_key);
CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);

-- ============================================================================
-- PAYOUTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, paid, failed
  stripe_transfer_id TEXT,
  leads_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Index for partner payouts
CREATE INDEX IF NOT EXISTS idx_payouts_partner_id ON payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);

-- ============================================================================
-- LEAD CONVERSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  payout_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending', -- pending, verified, rejected
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lead conversions
CREATE INDEX IF NOT EXISTS idx_lead_conversions_lead_id ON lead_conversions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_conversions_partner_id ON lead_conversions(partner_id);

-- ============================================================================
-- ADD PARTNER COLUMNS TO LEADS
-- ============================================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 50;

-- Index for partner leads
CREATE INDEX IF NOT EXISTS idx_leads_partner_id ON leads(partner_id) WHERE partner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_platform_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform_admins
    WHERE email = user_email AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate partner API key
CREATE OR REPLACE FUNCTION validate_partner_api_key(key TEXT)
RETURNS UUID AS $$
DECLARE
  partner_uuid UUID;
BEGIN
  SELECT id INTO partner_uuid
  FROM partners
  WHERE api_key = key AND is_active = true;

  RETURN partner_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update partner stats after lead upload
CREATE OR REPLACE FUNCTION update_partner_lead_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.partner_id IS NOT NULL THEN
    UPDATE partners
    SET total_leads_uploaded = total_leads_uploaded + 1,
        updated_at = NOW()
    WHERE id = NEW.partner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update partner stats
DROP TRIGGER IF EXISTS trigger_update_partner_lead_count ON leads;
CREATE TRIGGER trigger_update_partner_lead_count
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_lead_count();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE platform_admins IS 'Platform administrators with full system access';
COMMENT ON TABLE partners IS 'Lead upload partners who earn commissions';
COMMENT ON TABLE payouts IS 'Partner payout records for lead commissions';
COMMENT ON TABLE lead_conversions IS 'Tracks lead delivery and partner attribution';
COMMENT ON FUNCTION is_platform_admin IS 'Check if email belongs to platform admin';
COMMENT ON FUNCTION validate_partner_api_key IS 'Validate and return partner ID from API key';
