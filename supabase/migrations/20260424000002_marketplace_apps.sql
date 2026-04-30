-- Marketplace Apps — adds sync settings + per-source state to app_installs
--
-- Extends the install table with the per-install knobs both marketplace
-- apps need: sync defaults (ON for both per product decision), GHL custom
-- values tracking, deployment state machine, last sync timestamps, billing
-- subscription IDs.

DO $$
BEGIN
  -- Sync feature toggles (default ON per product decision)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_installs' AND column_name = 'sync_visitors_enabled'
  ) THEN
    ALTER TABLE app_installs ADD COLUMN sync_visitors_enabled BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_installs' AND column_name = 'sync_metafields_enabled'
  ) THEN
    -- Shopify-only: write cursive.intent_score to Shopify Customer metafields
    ALTER TABLE app_installs ADD COLUMN sync_metafields_enabled BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;

  -- Pixel deployment state machine (per PRD: not_deployed | pending | active | manual_required | error)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_installs' AND column_name = 'pixel_deployment_status'
  ) THEN
    ALTER TABLE app_installs ADD COLUMN pixel_deployment_status TEXT NOT NULL DEFAULT 'not_deployed'
      CHECK (pixel_deployment_status IN ('not_deployed', 'pending', 'active', 'manual_required', 'error'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_installs' AND column_name = 'first_event_at'
  ) THEN
    ALTER TABLE app_installs ADD COLUMN first_event_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_installs' AND column_name = 'last_visitor_sync_at'
  ) THEN
    ALTER TABLE app_installs ADD COLUMN last_visitor_sync_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_installs' AND column_name = 'visitor_sync_count'
  ) THEN
    ALTER TABLE app_installs ADD COLUMN visitor_sync_count INTEGER NOT NULL DEFAULT 0;
  END IF;

  -- Billing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_installs' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE app_installs ADD COLUMN stripe_subscription_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_installs' AND column_name = 'plan_tier'
  ) THEN
    -- 'trial' | 'starter' | 'growth' | 'scale' (final names TBD by user)
    ALTER TABLE app_installs ADD COLUMN plan_tier TEXT NOT NULL DEFAULT 'trial';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_installs' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE app_installs ADD COLUMN trial_ends_at TIMESTAMPTZ;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_app_installs_pixel_deployment
  ON app_installs(pixel_deployment_status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_app_installs_visitor_sync
  ON app_installs(last_visitor_sync_at)
  WHERE status = 'active' AND sync_visitors_enabled = TRUE;

-- Marketplace webhook events log (separate from existing webhook_events to
-- avoid coupling with the older GHL DFY flow). Stores raw inbound webhooks
-- for both GHL marketplace + Shopify marketplace for idempotency + audit.
CREATE TABLE IF NOT EXISTS marketplace_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source app_install_source NOT NULL,
  topic TEXT NOT NULL,                          -- 'AppInstall', 'customers/redact', etc.
  external_event_id TEXT,                       -- source-provided event ID for idempotency
  install_id UUID REFERENCES app_installs(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  signature_verified BOOLEAN NOT NULL,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processed', 'failed', 'skipped')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_marketplace_webhook_dedup UNIQUE (source, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_mp_webhook_install ON marketplace_webhook_events(install_id);
CREATE INDEX IF NOT EXISTS idx_mp_webhook_source_topic ON marketplace_webhook_events(source, topic);
CREATE INDEX IF NOT EXISTS idx_mp_webhook_status_created
  ON marketplace_webhook_events(status, created_at DESC);

ALTER TABLE marketplace_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_mp_webhooks" ON marketplace_webhook_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Visitor sync log (per-install audit of which visitors were synced to GHL/Shopify)
CREATE TABLE IF NOT EXISTS marketplace_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  install_id UUID NOT NULL REFERENCES app_installs(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source app_install_source NOT NULL,
  job_type TEXT NOT NULL,                       -- 'contact_sync' | 'metafield_writeback' | 'flow_trigger' | 'suppression'
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'partial', 'failed')),
  visitors_processed INTEGER NOT NULL DEFAULT 0,
  visitors_synced INTEGER NOT NULL DEFAULT 0,
  visitors_failed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mp_sync_install_started
  ON marketplace_sync_log(install_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_mp_sync_workspace_started
  ON marketplace_sync_log(workspace_id, started_at DESC);

ALTER TABLE marketplace_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_read_sync_log" ON marketplace_sync_log
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "service_role_full_access_sync_log" ON marketplace_sync_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add Darren as platform admin (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_admins') THEN
    INSERT INTO platform_admins (email, is_active)
    VALUES ('darren@meetcursive.com', TRUE)
    ON CONFLICT (email) DO UPDATE SET is_active = TRUE;
  END IF;
END $$;

COMMENT ON TABLE marketplace_webhook_events IS
  'Raw inbound webhook log for marketplace apps (GHL + Shopify). Provides idempotency via (source, external_event_id) and audit trail.';

COMMENT ON TABLE marketplace_sync_log IS
  'Per-install audit log of outbound syncs (visitors → GHL contacts, visitors → Shopify metafields, etc.). Powers the sync history UI.';
