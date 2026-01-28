-- Migration: Lead Marketplace Schema Extensions
-- Extends existing tables and adds new tables for the two-sided lead marketplace

-- ============================================================================
-- EXTEND LEADS TABLE FOR MARKETPLACE
-- ============================================================================

-- Marketplace-specific columns
ALTER TABLE leads ADD COLUMN IF NOT EXISTS intent_score_calculated INTEGER DEFAULT 50;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS freshness_score INTEGER DEFAULT 100;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS verification_result JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS hash_key VARCHAR(64);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_sold_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS marketplace_price DECIMAL(10,4);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_marketplace_listed BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS seniority_level VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sic_code VARCHAR(10);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sic_codes TEXT[] DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS upload_batch_id UUID;

-- Index for marketplace queries
CREATE INDEX IF NOT EXISTS idx_leads_marketplace_listed ON leads(is_marketplace_listed) WHERE is_marketplace_listed = true;
CREATE INDEX IF NOT EXISTS idx_leads_verification_status ON leads(verification_status);
CREATE INDEX IF NOT EXISTS idx_leads_hash_key ON leads(hash_key);
CREATE INDEX IF NOT EXISTS idx_leads_intent_score ON leads(intent_score_calculated);
CREATE INDEX IF NOT EXISTS idx_leads_freshness_score ON leads(freshness_score);
CREATE INDEX IF NOT EXISTS idx_leads_sic_codes ON leads USING GIN(sic_codes);
CREATE INDEX IF NOT EXISTS idx_leads_seniority ON leads(seniority_level);
CREATE INDEX IF NOT EXISTS idx_leads_upload_batch ON leads(upload_batch_id);

-- Unique constraint for deduplication hash
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_hash_key_unique ON leads(hash_key) WHERE hash_key IS NOT NULL;

-- ============================================================================
-- EXTEND PARTNERS TABLE
-- ============================================================================

ALTER TABLE partners ADD COLUMN IF NOT EXISTS verification_pass_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS duplicate_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS data_completeness_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS partner_score INTEGER DEFAULT 70;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS partner_tier VARCHAR(20) DEFAULT 'standard';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS base_commission_rate DECIMAL(5,4) DEFAULT 0.30;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS bonus_commission_rate DECIMAL(5,4) DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS referred_by_partner_id UUID REFERENCES partners(id);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS total_leads_sold INTEGER DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS leads_sold_last_30_days INTEGER DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS avg_days_to_sale DECIMAL(10,2);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS last_upload_at TIMESTAMPTZ;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Generate unique referral codes for existing partners
UPDATE partners
SET referral_code = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8))
WHERE referral_code IS NULL;

-- Make referral code unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_partners_referral_code ON partners(referral_code) WHERE referral_code IS NOT NULL;

-- Index for partner queries
CREATE INDEX IF NOT EXISTS idx_partners_tier ON partners(partner_tier);
CREATE INDEX IF NOT EXISTS idx_partners_score ON partners(partner_score);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);

-- ============================================================================
-- EXTEND USERS TABLE FOR PARTNER PORTAL ACCESS
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_partner BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linked_partner_id UUID REFERENCES partners(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES users(id);

-- Generate unique referral codes for existing users
UPDATE users
SET referral_code = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8))
WHERE referral_code IS NULL;

-- Make referral code unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_linked_partner ON users(linked_partner_id) WHERE linked_partner_id IS NOT NULL;

-- ============================================================================
-- MARKETPLACE PURCHASES
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  buyer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_leads INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL, -- 'credits', 'stripe', 'mixed'
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  credits_used INTEGER DEFAULT 0,
  card_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, refunded, partially_refunded
  refund_amount DECIMAL(10,2) DEFAULT 0,
  refund_reason TEXT,
  filters_used JSONB,
  download_url TEXT,
  download_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_workspace ON marketplace_purchases(buyer_workspace_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_user ON marketplace_purchases(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_status ON marketplace_purchases(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_created ON marketplace_purchases(created_at DESC);

-- RLS
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspace purchases" ON marketplace_purchases
  FOR SELECT USING (
    buyer_workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can create purchases for own workspace" ON marketplace_purchases
  FOR INSERT WITH CHECK (
    buyer_workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- ============================================================================
-- MARKETPLACE PURCHASE ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES marketplace_purchases(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  price_at_purchase DECIMAL(10,4) NOT NULL,
  intent_score_at_purchase INTEGER,
  freshness_score_at_purchase INTEGER,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  commission_rate DECIMAL(5,4),
  commission_amount DECIMAL(10,4),
  commission_bonuses JSONB DEFAULT '[]',
  commission_status VARCHAR(20) DEFAULT 'pending_holdback', -- pending_holdback, payable, paid, cancelled
  commission_payable_at TIMESTAMPTZ,
  commission_paid_at TIMESTAMPTZ,
  payout_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mpi_purchase ON marketplace_purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_mpi_lead ON marketplace_purchase_items(lead_id);
CREATE INDEX IF NOT EXISTS idx_mpi_partner ON marketplace_purchase_items(partner_id) WHERE partner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mpi_commission_status ON marketplace_purchase_items(commission_status);
CREATE INDEX IF NOT EXISTS idx_mpi_payable_at ON marketplace_purchase_items(commission_payable_at) WHERE commission_status = 'pending_holdback';

-- RLS
ALTER TABLE marketplace_purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items from own purchases" ON marketplace_purchase_items
  FOR SELECT USING (
    purchase_id IN (
      SELECT id FROM marketplace_purchases
      WHERE buyer_workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- ============================================================================
-- WORKSPACE CREDITS
-- ============================================================================

CREATE TABLE IF NOT EXISTS workspace_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0, -- from referrals
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_credits_workspace ON workspace_credits(workspace_id);

-- RLS
ALTER TABLE workspace_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspace credits" ON workspace_credits
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- ============================================================================
-- CREDIT PURCHASES
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL,
  package_name VARCHAR(50),
  amount_paid DECIMAL(10,2) NOT NULL,
  price_per_credit DECIMAL(10,4) NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_purchases_workspace ON credit_purchases(workspace_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(status);

-- RLS
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspace credit purchases" ON credit_purchases
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- ============================================================================
-- REFERRALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Referrer (who shared the link)
  referrer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referrer_partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,

  -- Referred (who signed up)
  referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referred_partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,

  referral_type VARCHAR(30) NOT NULL, -- 'user_to_user', 'partner_to_partner'
  referral_code VARCHAR(20) NOT NULL,

  status VARCHAR(20) DEFAULT 'pending', -- pending, converted, rewarded, expired

  -- Milestones and rewards
  milestones_achieved JSONB DEFAULT '[]',
  rewards_issued JSONB DEFAULT '[]',
  total_rewards_value DECIMAL(10,2) DEFAULT 0,

  -- Tracking
  signup_ip TEXT,
  signup_user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT referral_has_referrer CHECK (referrer_user_id IS NOT NULL OR referrer_partner_id IS NOT NULL),
  CONSTRAINT referral_has_referred CHECK (referred_user_id IS NOT NULL OR referred_partner_id IS NOT NULL)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user ON referrals(referrer_user_id) WHERE referrer_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_partner ON referrals(referrer_partner_id) WHERE referrer_partner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (
    referrer_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR referred_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- ============================================================================
-- PARTNER UPLOAD BATCHES
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_upload_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,

  -- File info
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT,
  file_size_bytes BIGINT,
  file_type VARCHAR(20), -- 'csv', 'xlsx'

  -- Field mappings used
  field_mappings JSONB NOT NULL DEFAULT '[]',

  -- Processing configuration
  industry_category_id UUID REFERENCES industry_categories(id),
  default_sic_codes TEXT[] DEFAULT '{}',
  skip_invalid_rows BOOLEAN DEFAULT true,

  -- Processing status
  status VARCHAR(20) DEFAULT 'pending', -- pending, validating, verifying, completed, failed

  -- Statistics
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  valid_rows INTEGER DEFAULT 0,
  invalid_rows INTEGER DEFAULT 0,
  duplicate_rows INTEGER DEFAULT 0,
  verification_pending INTEGER DEFAULT 0,
  verification_complete INTEGER DEFAULT 0,
  verification_valid INTEGER DEFAULT 0,
  verification_invalid INTEGER DEFAULT 0,
  marketplace_listed INTEGER DEFAULT 0,

  -- Preview and errors
  preview_data JSONB,
  detected_columns TEXT[] DEFAULT '{}',
  error_message TEXT,
  error_log JSONB DEFAULT '[]',
  rejected_rows_url TEXT,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key from leads to upload batches
ALTER TABLE leads ADD CONSTRAINT fk_leads_upload_batch
  FOREIGN KEY (upload_batch_id) REFERENCES partner_upload_batches(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upload_batches_partner ON partner_upload_batches(partner_id);
CREATE INDEX IF NOT EXISTS idx_upload_batches_status ON partner_upload_batches(status);
CREATE INDEX IF NOT EXISTS idx_upload_batches_created ON partner_upload_batches(created_at DESC);

-- RLS
ALTER TABLE partner_upload_batches ENABLE ROW LEVEL SECURITY;

-- Partners can view their own uploads via API key auth (handled in application)
-- Admins can view all uploads
CREATE POLICY "Admins can manage upload batches" ON partner_upload_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM platform_admins pa
      WHERE pa.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND pa.is_active = true
    )
  );

-- ============================================================================
-- EMAIL VERIFICATION QUEUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_verification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  priority INTEGER DEFAULT 0, -- Higher = more urgent

  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Results
  verification_result VARCHAR(20), -- valid, invalid, catch_all, risky, unknown
  verification_provider VARCHAR(50),
  verification_response JSONB,

  -- Timing
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verification_queue_status ON email_verification_queue(status);
CREATE INDEX IF NOT EXISTS idx_verification_queue_priority ON email_verification_queue(priority DESC, scheduled_at ASC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_verification_queue_lead ON email_verification_queue(lead_id);

-- RLS
ALTER TABLE email_verification_queue ENABLE ROW LEVEL SECURITY;

-- Only system can manage verification queue
CREATE POLICY "System manages verification queue" ON email_verification_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM platform_admins pa
      WHERE pa.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND pa.is_active = true
    )
  );

-- ============================================================================
-- PARTNER SCORE HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,

  score INTEGER NOT NULL,
  previous_score INTEGER,

  -- Score components at this point
  verification_pass_rate DECIMAL(5,2),
  duplicate_rate DECIMAL(5,2),
  data_completeness_rate DECIMAL(5,2),
  avg_freshness_at_sale DECIMAL(5,2),

  -- Tier change
  tier VARCHAR(20),
  previous_tier VARCHAR(20),

  change_reason TEXT,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_score_history_partner ON partner_score_history(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_score_history_date ON partner_score_history(calculated_at DESC);

-- RLS
ALTER TABLE partner_score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view score history" ON partner_score_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM platform_admins pa
      WHERE pa.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND pa.is_active = true
    )
  );

-- ============================================================================
-- MARKETPLACE AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Action details
  action VARCHAR(50) NOT NULL, -- purchase, refund, commission_paid, partner_suspended, price_change, etc.
  actor_type VARCHAR(20) NOT NULL, -- user, partner, system, admin
  actor_id UUID,
  actor_email TEXT,

  -- Target
  target_type VARCHAR(50), -- lead, partner, purchase, etc.
  target_id UUID,

  -- Details
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON marketplace_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON marketplace_audit_log(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON marketplace_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON marketplace_audit_log(created_at DESC);

-- RLS
ALTER TABLE marketplace_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log" ON marketplace_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM platform_admins pa
      WHERE pa.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND pa.is_active = true
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate lead hash key for deduplication
CREATE OR REPLACE FUNCTION calculate_lead_hash(
  p_email TEXT,
  p_company_domain TEXT,
  p_phone TEXT
) RETURNS VARCHAR(64) AS $$
DECLARE
  v_normalized TEXT;
BEGIN
  -- Normalize and concatenate
  v_normalized := COALESCE(LOWER(TRIM(p_email)), '') || '|' ||
                  COALESCE(LOWER(TRIM(p_company_domain)), '') || '|' ||
                  COALESCE(REGEXP_REPLACE(p_phone, '[^0-9]', '', 'g'), '');

  -- Return SHA256 hash
  RETURN encode(sha256(v_normalized::bytea), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate lead price
CREATE OR REPLACE FUNCTION calculate_lead_marketplace_price(
  p_intent_score INTEGER,
  p_freshness_score INTEGER,
  p_has_phone BOOLEAN,
  p_verification_status VARCHAR
) RETURNS DECIMAL(10,4) AS $$
DECLARE
  v_base_price DECIMAL := 0.05;
  v_intent_multiplier DECIMAL := 1;
  v_freshness_multiplier DECIMAL := 1;
  v_price DECIMAL;
BEGIN
  -- Intent multiplier
  IF p_intent_score >= 67 THEN
    v_intent_multiplier := 2.5;
  ELSIF p_intent_score >= 34 THEN
    v_intent_multiplier := 1.5;
  END IF;

  -- Freshness multiplier
  IF p_freshness_score >= 80 THEN
    v_freshness_multiplier := 1.5;
  ELSIF p_freshness_score < 30 THEN
    v_freshness_multiplier := 0.5;
  END IF;

  -- Calculate base
  v_price := v_base_price * v_intent_multiplier * v_freshness_multiplier;

  -- Add-ons
  IF p_has_phone THEN
    v_price := v_price + 0.03;
  END IF;

  IF p_verification_status = 'valid' THEN
    v_price := v_price + 0.02;
  ELSIF p_verification_status = 'catch_all' THEN
    v_price := v_price - 0.01;
  END IF;

  RETURN ROUND(v_price, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate freshness score (sigmoid decay)
CREATE OR REPLACE FUNCTION calculate_freshness_score(
  p_created_at TIMESTAMPTZ,
  p_max_score INTEGER DEFAULT 100,
  p_midpoint_days INTEGER DEFAULT 30,
  p_steepness DECIMAL DEFAULT 0.15,
  p_floor INTEGER DEFAULT 5
) RETURNS INTEGER AS $$
DECLARE
  v_days_old DECIMAL;
  v_score DECIMAL;
BEGIN
  v_days_old := EXTRACT(EPOCH FROM (NOW() - p_created_at)) / 86400.0;

  -- Sigmoid decay: score = max / (1 + e^(k * (days - midpoint)))
  v_score := p_max_score / (1 + exp(p_steepness * (v_days_old - p_midpoint_days)));

  -- Apply floor
  v_score := GREATEST(v_score, p_floor);

  RETURN ROUND(v_score)::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to add credits to workspace
CREATE OR REPLACE FUNCTION add_workspace_credits(
  p_workspace_id UUID,
  p_amount INTEGER,
  p_source VARCHAR DEFAULT 'purchase'
) RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  INSERT INTO workspace_credits (workspace_id, balance, total_purchased, total_earned)
  VALUES (p_workspace_id, p_amount,
    CASE WHEN p_source = 'purchase' THEN p_amount ELSE 0 END,
    CASE WHEN p_source = 'referral' THEN p_amount ELSE 0 END
  )
  ON CONFLICT (workspace_id) DO UPDATE SET
    balance = workspace_credits.balance + p_amount,
    total_purchased = workspace_credits.total_purchased +
      CASE WHEN p_source = 'purchase' THEN p_amount ELSE 0 END,
    total_earned = workspace_credits.total_earned +
      CASE WHEN p_source = 'referral' THEN p_amount ELSE 0 END,
    updated_at = NOW()
  RETURNING balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to deduct credits from workspace
CREATE OR REPLACE FUNCTION deduct_workspace_credits(
  p_workspace_id UUID,
  p_amount INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  SELECT balance INTO v_current_balance
  FROM workspace_credits
  WHERE workspace_id = p_workspace_id
  FOR UPDATE;

  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Current: %, Required: %',
      COALESCE(v_current_balance, 0), p_amount;
  END IF;

  UPDATE workspace_credits
  SET balance = balance - p_amount,
      total_used = total_used + p_amount,
      updated_at = NOW()
  WHERE workspace_id = p_workspace_id
  RETURNING balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to mark lead as sold
CREATE OR REPLACE FUNCTION mark_lead_sold(
  p_lead_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE leads
  SET
    sold_count = sold_count + 1,
    first_sold_at = COALESCE(first_sold_at, NOW())
  WHERE id = p_lead_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process pending commissions (move to payable after holdback)
CREATE OR REPLACE FUNCTION process_pending_commissions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE marketplace_purchase_items
  SET commission_status = 'payable'
  WHERE commission_status = 'pending_holdback'
    AND commission_payable_at <= NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Update partner balances
  UPDATE partners p
  SET
    available_balance = COALESCE((
      SELECT SUM(commission_amount)
      FROM marketplace_purchase_items mpi
      JOIN marketplace_purchases mp ON mp.id = mpi.purchase_id
      WHERE mpi.partner_id = p.id
        AND mpi.commission_status = 'payable'
        AND mp.status = 'completed'
    ), 0),
    pending_balance = COALESCE((
      SELECT SUM(commission_amount)
      FROM marketplace_purchase_items mpi
      JOIN marketplace_purchases mp ON mp.id = mpi.purchase_id
      WHERE mpi.partner_id = p.id
        AND mpi.commission_status = 'pending_holdback'
        AND mp.status = 'completed'
    ), 0),
    updated_at = NOW();

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update partner statistics
CREATE OR REPLACE FUNCTION update_partner_statistics(
  p_partner_id UUID
) RETURNS VOID AS $$
DECLARE
  v_stats RECORD;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE verification_status = 'valid')::DECIMAL /
      NULLIF(COUNT(*) FILTER (WHERE verification_status IS NOT NULL), 0) * 100 as verification_rate,
    AVG(freshness_score) as avg_freshness
  INTO v_stats
  FROM leads
  WHERE partner_id = p_partner_id;

  UPDATE partners
  SET
    verification_pass_rate = COALESCE(v_stats.verification_rate, 0),
    updated_at = NOW()
  WHERE id = p_partner_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update all freshness scores (for cron job)
CREATE OR REPLACE FUNCTION update_all_freshness_scores()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE leads
  SET freshness_score = calculate_freshness_score(created_at),
      marketplace_price = calculate_lead_marketplace_price(
        intent_score_calculated,
        calculate_freshness_score(created_at),
        phone IS NOT NULL,
        verification_status
      )
  WHERE is_marketplace_listed = true;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to auto-calculate hash key on lead insert/update
CREATE OR REPLACE FUNCTION trigger_calculate_lead_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.hash_key := calculate_lead_hash(NEW.email, NEW.company_domain, NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_leads_calculate_hash ON leads;
CREATE TRIGGER tr_leads_calculate_hash
  BEFORE INSERT OR UPDATE OF email, company_domain, phone ON leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_lead_hash();

-- Trigger to update partner stats after lead upload
CREATE OR REPLACE FUNCTION trigger_update_partner_on_lead()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.partner_id IS NOT NULL THEN
    UPDATE partners
    SET
      total_leads_uploaded = total_leads_uploaded + 1,
      last_upload_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.partner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_leads_update_partner_stats'
  ) THEN
    CREATE TRIGGER tr_leads_update_partner_stats
      AFTER INSERT ON leads
      FOR EACH ROW
      WHEN (NEW.partner_id IS NOT NULL)
      EXECUTE FUNCTION trigger_update_partner_on_lead();
  END IF;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE marketplace_purchases IS 'Lead purchase transactions from the marketplace';
COMMENT ON TABLE marketplace_purchase_items IS 'Individual leads in a purchase with commission tracking';
COMMENT ON TABLE workspace_credits IS 'Prepurchased lead credits for workspaces';
COMMENT ON TABLE credit_purchases IS 'Credit package purchase history';
COMMENT ON TABLE referrals IS 'User and partner referral tracking';
COMMENT ON TABLE partner_upload_batches IS 'Partner CSV upload jobs';
COMMENT ON TABLE email_verification_queue IS 'Async email verification processing';
COMMENT ON TABLE partner_score_history IS 'Historical partner score changes';
COMMENT ON TABLE marketplace_audit_log IS 'Audit trail for marketplace actions';

COMMENT ON FUNCTION calculate_lead_hash IS 'Generate SHA256 hash for lead deduplication';
COMMENT ON FUNCTION calculate_lead_marketplace_price IS 'Calculate dynamic pricing based on lead quality';
COMMENT ON FUNCTION calculate_freshness_score IS 'Sigmoid decay function for lead freshness';
COMMENT ON FUNCTION add_workspace_credits IS 'Add credits to workspace balance';
COMMENT ON FUNCTION deduct_workspace_credits IS 'Deduct credits with balance check';
COMMENT ON FUNCTION mark_lead_sold IS 'Increment sold count and set first sold timestamp';
COMMENT ON FUNCTION process_pending_commissions IS 'Move commissions from pending to payable after holdback';
