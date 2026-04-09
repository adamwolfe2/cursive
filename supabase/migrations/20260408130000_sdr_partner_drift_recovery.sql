-- Third batch of silent drift recovery — SDR analytics + partner earnings.
--
-- These tables are referenced by admin pages that would otherwise 500 or
-- show empty stats due to silent table-not-found errors.

-- ─── reply_classification_logs ────────────────────────────────────────────
-- Used by /api/sdr/analytics for SDR reply intent breakdown.
-- Schema reverse-engineered from query columns: intent, method, workspace_id,
-- created_at. Insert callers grep'd from sdr/reply-classifier.

CREATE TABLE IF NOT EXISTS reply_classification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  conversation_id UUID,
  message_id TEXT,
  intent TEXT NOT NULL,
  method TEXT NOT NULL,
  confidence NUMERIC(5, 2),
  classifier_version TEXT,
  raw_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reply_classification_workspace_created ON reply_classification_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reply_classification_intent ON reply_classification_logs(workspace_id, intent);
CREATE INDEX IF NOT EXISTS idx_reply_classification_method ON reply_classification_logs(workspace_id, method);

ALTER TABLE reply_classification_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace isolation reply_classification_logs" ON reply_classification_logs;
CREATE POLICY "Workspace isolation reply_classification_logs" ON reply_classification_logs
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service role reply_classification_logs" ON reply_classification_logs;
CREATE POLICY "Service role reply_classification_logs" ON reply_classification_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── partner_earnings ─────────────────────────────────────────────────────
-- Used by /api/admin/revenue and /api/admin/payouts/[id] for partner
-- payout calculations. Stores commission earned per qualifying purchase.

CREATE TABLE IF NOT EXISTS partner_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('lead_purchase', 'referral', 'bonus', 'adjustment')),
  source_id UUID,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('pending', 'available', 'paid_out', 'clawed_back', 'cancelled')),
  payout_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_out_at TIMESTAMPTZ,
  clawback_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_partner_earnings_partner ON partner_earnings(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_status ON partner_earnings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_payout ON partner_earnings(payout_id) WHERE payout_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_partner_earnings_created ON partner_earnings(created_at DESC);

ALTER TABLE partner_earnings ENABLE ROW LEVEL SECURITY;

-- Partner earnings are admin-managed via the service role client.
-- Partners themselves authenticate via api_key (not auth.uid()), so
-- partner-side access happens through API routes that use the admin client.
DROP POLICY IF EXISTS "Service role partner_earnings" ON partner_earnings;
CREATE POLICY "Service role partner_earnings" ON partner_earnings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_earnings_updated_at') THEN
    CREATE TRIGGER trg_partner_earnings_updated_at BEFORE UPDATE ON partner_earnings
      FOR EACH ROW EXECUTE FUNCTION update_drift_recovery_updated_at();
  END IF;
END $$;
