-- Outbound Webhook System
-- Allows workspaces to subscribe to lead/credit events via HTTP POST
--
-- TODO: MUST BE APPLIED MANUALLY
-- The Supabase CLI is not linked (project_id = "your-project-id" in config.toml).
-- To apply: Supabase dashboard → SQL Editor → paste this file and run.
-- Or: npx supabase db push --db-url "postgresql://postgres:[DB_PASSWORD]@db.lrbftjspiiakfnydxbgk.supabase.co:5432/postgres"
-- Until applied, all webhook delivery calls will fail with table-not-found errors.

-- workspace_webhooks: one row per configured endpoint per workspace
CREATE TABLE IF NOT EXISTS workspace_webhooks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT,
  url          TEXT NOT NULL,
  secret       TEXT NOT NULL,  -- HMAC-SHA256 signing secret (stored plain, generated per-webhook)
  events       TEXT[] NOT NULL DEFAULT '{}',  -- e.g. {'lead.received','lead.purchased'}
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- outbound_webhook_deliveries: per-delivery attempt log
CREATE TABLE IF NOT EXISTS outbound_webhook_deliveries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id    UUID NOT NULL REFERENCES workspace_webhooks(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL,
  event_type    TEXT NOT NULL,
  payload       JSONB NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending | success | failed
  attempts      INT NOT NULL DEFAULT 0,
  response_status INT,
  response_body TEXT,
  error_message TEXT,
  last_attempt_at TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_webhooks_workspace_id
  ON workspace_webhooks(workspace_id);

CREATE INDEX IF NOT EXISTS idx_workspace_webhooks_is_active
  ON workspace_webhooks(workspace_id, is_active);

CREATE INDEX IF NOT EXISTS idx_outbound_webhook_deliveries_webhook_id
  ON outbound_webhook_deliveries(webhook_id);

CREATE INDEX IF NOT EXISTS idx_outbound_webhook_deliveries_workspace_id
  ON outbound_webhook_deliveries(workspace_id);

CREATE INDEX IF NOT EXISTS idx_outbound_webhook_deliveries_status
  ON outbound_webhook_deliveries(status, created_at DESC);

-- RLS
ALTER TABLE workspace_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- workspace_webhooks: users may only see/edit their own workspace webhooks
CREATE POLICY "workspace_webhooks_workspace_isolation"
  ON workspace_webhooks
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- outbound_webhook_deliveries: read-only for workspace members
CREATE POLICY "outbound_webhook_deliveries_workspace_isolation"
  ON outbound_webhook_deliveries
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );
