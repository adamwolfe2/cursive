-- ================================================
-- Affiliate Partner Program
-- Created: 2026-03-04
-- ================================================

-- Application table
CREATE TABLE IF NOT EXISTS affiliate_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  audience_size TEXT NOT NULL CHECK (audience_size IN ('under_500', '500_2k', '2k_10k', '10k_50k', '50k_plus')),
  audience_types TEXT[] NOT NULL DEFAULT '{}',
  promotion_plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_applications_email ON affiliate_applications(email);
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_status ON affiliate_applications(status);

-- Affiliates (approved partners) table
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES affiliate_applications(id) ON DELETE RESTRICT,
  user_id TEXT,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  partner_code TEXT UNIQUE NOT NULL,
  stripe_connect_account_id TEXT,
  stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'terminated')),
  total_activations INTEGER NOT NULL DEFAULT 0,
  current_tier INTEGER NOT NULL DEFAULT 0,
  free_months_earned INTEGER NOT NULL DEFAULT 0,
  total_earnings INTEGER NOT NULL DEFAULT 0,
  agreement_accepted_at TIMESTAMPTZ,
  agreement_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_partner_code ON affiliates(partner_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);

-- Referrals table
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE RESTRICT,
  referred_user_id TEXT,
  referred_email TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'activated', 'churned')),
  activated_at TIMESTAMPTZ,
  attributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(affiliate_id, referred_email)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON affiliate_referrals(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_email ON affiliate_referrals(referred_email);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_user_id ON affiliate_referrals(referred_user_id);

-- Commissions table
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE RESTRICT,
  referral_id UUID NOT NULL REFERENCES affiliate_referrals(id) ON DELETE RESTRICT,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  invoice_amount INTEGER NOT NULL,
  commission_rate INTEGER NOT NULL,
  commission_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_referral_id ON affiliate_commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status);

-- Milestone bonuses table
CREATE TABLE IF NOT EXISTS affiliate_milestone_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE RESTRICT,
  tier INTEGER NOT NULL,
  bonus_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(affiliate_id, tier)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_milestone_bonuses_affiliate_id ON affiliate_milestone_bonuses(affiliate_id);

-- Payouts table
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL,
  stripe_payout_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate_id ON affiliate_payouts(affiliate_id);

-- Click tracking table
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  ip_hash TEXT,
  user_agent TEXT,
  referer TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_id ON affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON affiliate_clicks(clicked_at);

-- Enable RLS
ALTER TABLE affiliate_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_milestone_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "admin_all_affiliate_applications" ON affiliate_applications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'owner'))
  );

CREATE POLICY "affiliates_view_own" ON affiliates
  FOR SELECT USING (user_id = auth.uid()::TEXT);

CREATE POLICY "admin_all_affiliates" ON affiliates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'owner'))
  );

CREATE POLICY "affiliates_view_own_referrals" ON affiliate_referrals
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()::TEXT)
  );

CREATE POLICY "admin_all_affiliate_referrals" ON affiliate_referrals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'owner'))
  );

CREATE POLICY "affiliates_view_own_commissions" ON affiliate_commissions
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()::TEXT)
  );

CREATE POLICY "admin_all_affiliate_commissions" ON affiliate_commissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'owner'))
  );

CREATE POLICY "affiliates_view_own_milestones" ON affiliate_milestone_bonuses
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()::TEXT)
  );

CREATE POLICY "admin_all_affiliate_milestones" ON affiliate_milestone_bonuses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'owner'))
  );

CREATE POLICY "affiliates_view_own_payouts" ON affiliate_payouts
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()::TEXT)
  );

CREATE POLICY "admin_all_affiliate_payouts" ON affiliate_payouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'owner'))
  );

CREATE POLICY "admin_all_affiliate_clicks" ON affiliate_clicks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'owner'))
  );
