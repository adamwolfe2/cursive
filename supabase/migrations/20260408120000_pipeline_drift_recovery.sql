-- Pipeline drift recovery — AL/routing/enrichment tables.
--
-- Second batch of silent drift recovery. These tables back the active
-- AL data pipeline (enrichment, routing, dedup, verification). Without
-- them, the pipeline runs but loses observability and dedup state.

-- ─── enrichment_logs ──────────────────────────────────────────────────────
-- Used by inngest/functions/enrichment-pipeline.ts to log every enrichment
-- attempt. Without it, every enrichment was failing to record cost data.

CREATE TABLE IF NOT EXISTS enrichment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  request_data JSONB,
  response_data JSONB,
  status TEXT NOT NULL,
  error_message TEXT,
  credits_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrichment_logs_workspace ON enrichment_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_lead ON enrichment_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_provider ON enrichment_logs(provider);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_failed ON enrichment_logs(created_at DESC) WHERE status = 'failed';

ALTER TABLE enrichment_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace isolation enrichment_logs" ON enrichment_logs;
CREATE POLICY "Workspace isolation enrichment_logs" ON enrichment_logs
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service role enrichment_logs" ON enrichment_logs;
CREATE POLICY "Service role enrichment_logs" ON enrichment_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── verification_results ─────────────────────────────────────────────────
-- Used by lib/services/verification.service.ts for email + phone verification
-- audit trail. Schema reverse-engineered from insert calls.

CREATE TABLE IF NOT EXISTS verification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

  verification_type TEXT NOT NULL CHECK (verification_type IN ('email', 'phone', 'address')),
  verified_value TEXT NOT NULL,
  status TEXT NOT NULL,
  confidence_score INTEGER,

  provider TEXT NOT NULL,
  provider_result JSONB,

  -- Email-specific
  email_deliverable BOOLEAN,
  email_disposable BOOLEAN,
  email_role_based BOOLEAN,

  -- Phone-specific
  phone_valid BOOLEAN,
  phone_type TEXT,
  phone_carrier TEXT,
  phone_country_code TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_results_workspace ON verification_results(workspace_id);
CREATE INDEX IF NOT EXISTS idx_verification_results_lead ON verification_results(lead_id);
CREATE INDEX IF NOT EXISTS idx_verification_results_value ON verification_results(verified_value);
CREATE INDEX IF NOT EXISTS idx_verification_results_type_status ON verification_results(verification_type, status);

ALTER TABLE verification_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace isolation verification_results" ON verification_results;
CREATE POLICY "Workspace isolation verification_results" ON verification_results
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service role verification_results" ON verification_results;
CREATE POLICY "Service role verification_results" ON verification_results
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── lead_routing_queue ───────────────────────────────────────────────────
-- Retry queue for failed lead routing. Used by lib/services/lead-routing.service.ts.

CREATE TABLE IF NOT EXISTS lead_routing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  error_count INTEGER NOT NULL DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_routing_queue_lead ON lead_routing_queue(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_routing_queue_pending ON lead_routing_queue(next_retry_at) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lead_routing_queue_workspace ON lead_routing_queue(workspace_id) WHERE processed_at IS NULL;

ALTER TABLE lead_routing_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace isolation lead_routing_queue" ON lead_routing_queue;
CREATE POLICY "Workspace isolation lead_routing_queue" ON lead_routing_queue
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service role lead_routing_queue" ON lead_routing_queue;
CREATE POLICY "Service role lead_routing_queue" ON lead_routing_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── lead_routing_logs ────────────────────────────────────────────────────
-- Per-attempt routing decision audit trail.

CREATE TABLE IF NOT EXISTS lead_routing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  routing_decision TEXT NOT NULL,
  destination TEXT,
  rule_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_routing_logs_lead ON lead_routing_logs(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_routing_logs_workspace ON lead_routing_logs(workspace_id);

ALTER TABLE lead_routing_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace isolation lead_routing_logs" ON lead_routing_logs;
CREATE POLICY "Workspace isolation lead_routing_logs" ON lead_routing_logs
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service role lead_routing_logs" ON lead_routing_logs;
CREATE POLICY "Service role lead_routing_logs" ON lead_routing_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── unroutable_leads ─────────────────────────────────────────────────────
-- Leads that exceeded max routing attempts and need manual intervention.

CREATE TABLE IF NOT EXISTS unroutable_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  attempts_made INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unroutable_leads_workspace ON unroutable_leads(workspace_id) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_unroutable_leads_lead ON unroutable_leads(lead_id);

ALTER TABLE unroutable_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace isolation unroutable_leads" ON unroutable_leads;
CREATE POLICY "Workspace isolation unroutable_leads" ON unroutable_leads
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service role unroutable_leads" ON unroutable_leads;
CREATE POLICY "Service role unroutable_leads" ON unroutable_leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── lead_dedupe_keys ─────────────────────────────────────────────────────
-- Used by lib/services/upload-handler.service.ts to prevent duplicate uploads.
-- One row per lead with normalized email/phone keys.

CREATE TABLE IF NOT EXISTS lead_dedupe_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email_key TEXT,
  phone_key TEXT,
  composite_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT lead_dedupe_keys_lead_unique UNIQUE (lead_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_dedupe_keys_workspace_email ON lead_dedupe_keys(workspace_id, email_key) WHERE email_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_dedupe_keys_workspace_phone ON lead_dedupe_keys(workspace_id, phone_key) WHERE phone_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_dedupe_keys_workspace_composite ON lead_dedupe_keys(workspace_id, composite_key) WHERE composite_key IS NOT NULL;

ALTER TABLE lead_dedupe_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace isolation lead_dedupe_keys" ON lead_dedupe_keys;
CREATE POLICY "Workspace isolation lead_dedupe_keys" ON lead_dedupe_keys
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service role lead_dedupe_keys" ON lead_dedupe_keys;
CREATE POLICY "Service role lead_dedupe_keys" ON lead_dedupe_keys
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- updated_at trigger for lead_routing_queue
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_lead_routing_queue_updated_at') THEN
    CREATE TRIGGER trg_lead_routing_queue_updated_at BEFORE UPDATE ON lead_routing_queue
      FOR EACH ROW EXECUTE FUNCTION update_drift_recovery_updated_at();
  END IF;
END $$;
