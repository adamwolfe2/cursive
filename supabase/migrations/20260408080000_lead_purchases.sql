-- lead_purchases table for single-lead marketplace purchases.
--
-- Code in src/app/api/leads/[id]/confirm-purchase/route.ts and
-- src/lib/db/repositories/partner.repository.ts references this table
-- but it was never created in production. Single-lead purchases would
-- have failed silently (or thrown 500) if anyone tried to buy.
--
-- Distinct from marketplace_purchases (which is for bulk filter-based
-- purchases via Stripe checkout).

CREATE TABLE IF NOT EXISTS lead_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  buyer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  buyer_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,

  purchase_price NUMERIC(10, 2) NOT NULL,
  partner_commission NUMERIC(10, 2) NOT NULL DEFAULT 0,
  platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,

  stripe_payment_intent_id TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,

  -- Idempotency: one purchase row per Stripe payment intent
  CONSTRAINT lead_purchases_stripe_pi_unique UNIQUE (stripe_payment_intent_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_purchases_lead_id ON lead_purchases(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_purchases_buyer_user_id ON lead_purchases(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_purchases_partner_id ON lead_purchases(partner_id) WHERE partner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_purchases_created_at ON lead_purchases(created_at DESC);

ALTER TABLE lead_purchases ENABLE ROW LEVEL SECURITY;

-- Buyer can read their own purchases
DROP POLICY IF EXISTS "Buyer reads own lead_purchases" ON lead_purchases;
CREATE POLICY "Buyer reads own lead_purchases" ON lead_purchases
  FOR SELECT USING (
    buyer_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- Service role bypass for admin client writes
DROP POLICY IF EXISTS "Service role lead_purchases" ON lead_purchases;
CREATE POLICY "Service role lead_purchases" ON lead_purchases
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE lead_purchases IS 'Single-lead marketplace purchases. One row per Stripe payment intent.';
