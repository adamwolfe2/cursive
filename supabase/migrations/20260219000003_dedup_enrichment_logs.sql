-- Dedup rejection log + enrichment activity log
-- Applied: 2026-02-19

-- ============================================
-- 1. dedup_rejections — track lead dedup filtering
-- ============================================

CREATE TABLE IF NOT EXISTS dedup_rejections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  reason text NOT NULL,           -- 'email_match', 'name_company_match', 'intra_batch'
  source text NOT NULL,           -- 'daily_distribution', 'onboarding', 'api_ingest'
  rejected_email text,
  rejected_name text,
  rejected_company text,
  batch_size int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dedup_rejections_workspace ON dedup_rejections(workspace_id);
CREATE INDEX idx_dedup_rejections_created ON dedup_rejections(created_at);

ALTER TABLE dedup_rejections ENABLE ROW LEVEL SECURITY;

-- Admin-only access (service role bypasses RLS)
CREATE POLICY "Service role only" ON dedup_rejections
  FOR ALL USING (false);

-- ============================================
-- 2. enrichment_log — track every enrichment for billing transparency
-- ============================================

CREATE TABLE IF NOT EXISTS enrichment_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL,            -- 'success', 'failed', 'no_data'
  credits_used int NOT NULL DEFAULT 1,
  fields_added text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_enrichment_log_workspace ON enrichment_log(workspace_id);
CREATE INDEX idx_enrichment_log_created ON enrichment_log(created_at);
CREATE INDEX idx_enrichment_log_lead ON enrichment_log(lead_id);

ALTER TABLE enrichment_log ENABLE ROW LEVEL SECURITY;

-- Workspace-scoped read access
CREATE POLICY "Users can view own workspace enrichments" ON enrichment_log
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Insert via service role only (API routes use admin client)
CREATE POLICY "Service role insert only" ON enrichment_log
  FOR INSERT WITH CHECK (false);
