-- ============================================================================
-- OUTBOUND AGENT v1 — Rox-inspired AI revenue agent
-- ----------------------------------------------------------------------------
-- This migration is additive and idempotent. It:
--   1. Extends `agents` with outbound config columns (icp/persona/product/filters)
--   2. Flags `email_campaigns` rows that back an outbound agent (no metadata column existed)
--   3. Creates `outbound_runs` (per-run audit + live header counts)
--   4. Creates `outbound_chat_messages` (chat history)
--   5. Creates `outbound_saved_prompts` (4 default prompts seeded)
--   6. Creates the `outbound_pipeline_counts` view (single source of truth for the
--      6 stage cards: prospecting, enriching, drafting, engaging, replying, booked)
--   7. Enables RLS on all new tables with workspace-isolation policies
--
-- Reuse decisions:
--   - Drafts live in existing `email_sends.status='pending_approval'`
--   - Prospects live in existing `campaign_leads` rows
--   - Replies live in existing `email_replies` (joined by campaign_id)
--   - Approval flow reuses existing `campaign/email-approved` Inngest event
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. agents — outbound config
-- ----------------------------------------------------------------------------
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS outbound_enabled       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS outbound_auto_approve  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS icp_text               TEXT,
  ADD COLUMN IF NOT EXISTS persona_text           TEXT,
  ADD COLUMN IF NOT EXISTS product_text           TEXT,
  ADD COLUMN IF NOT EXISTS outbound_filters       JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS outbound_campaign_id   UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS outbound_last_run_at   TIMESTAMPTZ;

COMMENT ON COLUMN agents.outbound_filters IS
  'AudienceLab ICP filter primitives: { industries[], states[], seniority_levels[], job_titles[], company_sizes[], departments[], naics[], sic[], cap_per_run }. UI calls this an "Outbound Workflow"; the row lives on agents to share tone/api_keys/email_instructions/kb_entries.';

CREATE INDEX IF NOT EXISTS idx_agents_outbound_enabled
  ON agents(workspace_id) WHERE outbound_enabled = true;

-- ----------------------------------------------------------------------------
-- 2. email_campaigns — flag synthetic outbound-agent campaigns
-- ----------------------------------------------------------------------------
ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS is_outbound_agent BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN email_campaigns.is_outbound_agent IS
  'TRUE for campaigns auto-created by an outbound agent. The legacy /campaigns list view should filter these out.';

CREATE INDEX IF NOT EXISTS idx_email_campaigns_outbound_agent
  ON email_campaigns(workspace_id) WHERE is_outbound_agent = true;

-- ----------------------------------------------------------------------------
-- 3. outbound_runs — audit + header
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outbound_runs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id           UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  triggered_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  status             TEXT NOT NULL DEFAULT 'running'
                       CHECK (status IN ('running','completed','failed','cancelled')),
  prospects_target   INT NOT NULL DEFAULT 0,
  prospects_found    INT NOT NULL DEFAULT 0,
  prospects_enriched INT NOT NULL DEFAULT 0,
  drafts_created     INT NOT NULL DEFAULT 0,
  drafts_approved    INT NOT NULL DEFAULT 0,
  emails_sent        INT NOT NULL DEFAULT 0,
  replies_received   INT NOT NULL DEFAULT 0,
  meetings_booked    INT NOT NULL DEFAULT 0,
  credits_spent      NUMERIC(12,2) NOT NULL DEFAULT 0,
  error_message      TEXT,
  metadata           JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbound_runs_agent
  ON outbound_runs(agent_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_outbound_runs_workspace
  ON outbound_runs(workspace_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_outbound_runs_running
  ON outbound_runs(workspace_id) WHERE status = 'running';

-- ----------------------------------------------------------------------------
-- 4. outbound_chat_messages — chat history
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outbound_chat_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id     UUID REFERENCES agents(id) ON DELETE CASCADE,
  thread_id    UUID NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content      TEXT NOT NULL,
  context_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  token_count  INT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbound_chat_thread
  ON outbound_chat_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_outbound_chat_user
  ON outbound_chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outbound_chat_agent
  ON outbound_chat_messages(agent_id, created_at DESC) WHERE agent_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 5. outbound_saved_prompts — quick-action templates
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outbound_saved_prompts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES workspaces(id) ON DELETE CASCADE,  -- NULL = global default
  label           TEXT NOT NULL,
  description     TEXT,
  prompt_template TEXT NOT NULL,
  icon_name       TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  is_default      BOOLEAN NOT NULL DEFAULT false,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbound_saved_prompts_workspace
  ON outbound_saved_prompts(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outbound_saved_prompts_default
  ON outbound_saved_prompts(is_default) WHERE is_default = true;

-- Seed 4 global defaults (idempotent — keyed on label + workspace_id NULL)
INSERT INTO outbound_saved_prompts (workspace_id, label, description, prompt_template, icon_name, sort_order, is_default)
SELECT NULL, v.label, v.description, v.prompt_template, v.icon_name, v.sort_order, true
FROM (VALUES
  ('Email Draft',
   'Find a high priority contact and draft a personalized cold email.',
   'Find a high-priority contact for me and draft a personalized cold email. Use the latest signals on their company and reference my ICP, persona, and product context.',
   'mail', 1),
  ('First Call Deck',
   'Generate a 4-slide first call deck for one of my highest priority accounts.',
   'Generate a 4-slide first-call deck for one of my highest priority accounts. Include: company overview, why-now, talking points, and a closing question.',
   'presentation', 2),
  ('Latest Activity',
   'What are the most notable recent events across my accounts?',
   'Summarize the most notable activity across my accounts in the last 7 days and recommend the next best action for each.',
   'activity', 3),
  ('Account Report',
   'Generate a succinct overview of one of my highest priority accounts.',
   'Generate a one-page account report for my highest-priority account: firmographics, recent signals, contacts, and recommended outreach.',
   'file-text', 4)
) AS v(label, description, prompt_template, icon_name, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM outbound_saved_prompts
  WHERE workspace_id IS NULL AND label = v.label
);

-- ----------------------------------------------------------------------------
-- 6. outbound_pipeline_counts — single source of truth for the 6 stage cards
-- ----------------------------------------------------------------------------
-- Reads from existing tables only — never duplicates state.
-- Replying/Booked thresholds use email_replies.intent_score (0-10 scale).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW outbound_pipeline_counts AS
SELECT
  a.id                                              AS agent_id,
  a.workspace_id                                    AS workspace_id,
  a.outbound_campaign_id                            AS campaign_id,
  COALESCE(
    (SELECT prospects_found
       FROM outbound_runs
      WHERE agent_id = a.id
      ORDER BY started_at DESC
      LIMIT 1),
    0
  )                                                 AS prospecting_count,
  (SELECT COUNT(*)
     FROM campaign_leads cl
    WHERE cl.campaign_id = a.outbound_campaign_id
      AND cl.status IN ('pending','enriching'))     AS enriching_count,
  (SELECT COUNT(*)
     FROM email_sends es
    WHERE es.campaign_id = a.outbound_campaign_id
      AND es.status = 'pending_approval')           AS drafting_count,
  (SELECT COUNT(*)
     FROM email_sends es
    WHERE es.campaign_id = a.outbound_campaign_id
      AND es.status IN ('approved','sending','sent')
      AND es.replied_at IS NULL)                    AS engaging_count,
  (SELECT COUNT(*)
     FROM email_replies er
    WHERE er.campaign_id = a.outbound_campaign_id
      AND (er.sentiment IS NULL OR er.sentiment NOT IN ('unsubscribe','out_of_office')))
                                                    AS replying_count,
  (SELECT COUNT(*)
     FROM email_replies er
    WHERE er.campaign_id = a.outbound_campaign_id
      AND er.intent_score >= 8
      AND er.sentiment IN ('positive','question'))  AS booked_count
FROM agents a
WHERE a.outbound_enabled = true;

COMMENT ON VIEW outbound_pipeline_counts IS
  'Live counts for the 6-stage outbound pipeline. Queried by stats endpoint and stats refresher cron. Rows only appear for agents with outbound_enabled=true.';

-- ----------------------------------------------------------------------------
-- 7. RLS policies
-- ----------------------------------------------------------------------------
ALTER TABLE outbound_runs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_saved_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS outbound_runs_isolation             ON outbound_runs;
DROP POLICY IF EXISTS outbound_chat_isolation             ON outbound_chat_messages;
DROP POLICY IF EXISTS outbound_saved_prompts_read_policy  ON outbound_saved_prompts;
DROP POLICY IF EXISTS outbound_saved_prompts_write_policy ON outbound_saved_prompts;

CREATE POLICY outbound_runs_isolation ON outbound_runs
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
  ))
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY outbound_chat_isolation ON outbound_chat_messages
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
  ))
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
  ));

-- Read: globals (workspace_id IS NULL) + own workspace
CREATE POLICY outbound_saved_prompts_read_policy ON outbound_saved_prompts
  FOR SELECT
  USING (
    workspace_id IS NULL
    OR workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Write: only own workspace (cannot edit globals)
CREATE POLICY outbound_saved_prompts_write_policy ON outbound_saved_prompts
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
  ))
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
  ));
