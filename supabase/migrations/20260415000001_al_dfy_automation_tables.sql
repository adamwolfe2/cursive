-- AudienceLab DFY Automation Tables
--
-- Tracks audiences and enrichment jobs created during DFY client onboarding
-- automation. Also adds client_id linkage to audiencelab_pixels so pixels
-- created for DFY clients can be traced back to their service subscription.
--
-- Referenced by:
--   src/inngest/functions/dfy-onboarding-sequence.ts (onboarding automation)
--   src/inngest/functions/al-audience-refresh.ts (weekly DFY refresh cron)
--   src/inngest/functions/al-enrichment-poller.ts (batch enrichment poller)

-- ─── al_audiences ────────────────────────────────────────────────────────────
-- Tracks every AL audience created for Cursive workspaces.
-- Used to support weekly refresh (re-pull net-new leads) and cleanup.

CREATE TABLE IF NOT EXISTS al_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- AL-assigned audience ID — used to call fetchAudienceRecords
  al_audience_id TEXT NOT NULL,
  name TEXT NOT NULL,
  -- 'dfy_onboarding' | 'weekly_refresh' | 'manual'
  source TEXT NOT NULL DEFAULT 'dfy_onboarding',
  -- ICP filters snapshot (industry + geo) stored for refresh re-use
  filters JSONB DEFAULT '{}'::jsonb,
  -- Total leads imported from this audience pull
  leads_imported INTEGER NOT NULL DEFAULT 0,
  -- Whether to include in weekly refresh cron
  refresh_enabled BOOLEAN NOT NULL DEFAULT true,
  last_refreshed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT al_audiences_workspace_al_id_unique UNIQUE (workspace_id, al_audience_id)
);

CREATE INDEX IF NOT EXISTS idx_al_audiences_workspace ON al_audiences(workspace_id);
CREATE INDEX IF NOT EXISTS idx_al_audiences_refresh ON al_audiences(workspace_id) WHERE refresh_enabled = true;
CREATE INDEX IF NOT EXISTS idx_al_audiences_created ON al_audiences(created_at DESC);

ALTER TABLE al_audiences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace isolation al_audiences" ON al_audiences;
CREATE POLICY "Workspace isolation al_audiences" ON al_audiences
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service role al_audiences" ON al_audiences;
CREATE POLICY "Service role al_audiences" ON al_audiences
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── al_enrichment_jobs ───────────────────────────────────────────────────────
-- Tracks batch enrichment jobs submitted to AL.
-- The enrichment poller cron polls rows where status = 'pending' | 'processing'
-- and downloads the CSV when complete.

CREATE TABLE IF NOT EXISTS al_enrichment_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- AL-assigned job ID returned by createBatchEnrichment
  al_job_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  -- Number of records submitted
  total_submitted INTEGER NOT NULL DEFAULT 0,
  -- Number of records successfully enriched
  total_enriched INTEGER NOT NULL DEFAULT 0,
  -- AL download URL for the completed CSV
  download_url TEXT,
  -- Error detail if failed
  error_message TEXT,
  -- ISO timestamp of last status poll
  last_polled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_al_enrichment_jobs_workspace ON al_enrichment_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_al_enrichment_jobs_pending ON al_enrichment_jobs(created_at DESC)
  WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_al_enrichment_jobs_status ON al_enrichment_jobs(status, created_at DESC);

ALTER TABLE al_enrichment_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace isolation al_enrichment_jobs" ON al_enrichment_jobs;
CREATE POLICY "Workspace isolation al_enrichment_jobs" ON al_enrichment_jobs
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service role al_enrichment_jobs" ON al_enrichment_jobs;
CREATE POLICY "Service role al_enrichment_jobs" ON al_enrichment_jobs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── audiencelab_pixels: add dfy_client_id linkage ────────────────────────────
-- Links pixels created for DFY clients back to their service subscription,
-- enabling the admin dashboard to show which client owns which pixel.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'audiencelab_pixels'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'audiencelab_pixels' AND column_name = 'dfy_subscription_id'
    ) THEN
      ALTER TABLE audiencelab_pixels
        ADD COLUMN dfy_subscription_id UUID REFERENCES service_subscriptions(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'audiencelab_pixels' AND column_name = 'provisioned_by_automation'
    ) THEN
      ALTER TABLE audiencelab_pixels
        ADD COLUMN provisioned_by_automation BOOLEAN NOT NULL DEFAULT false;
    END IF;
  END IF;
END $$;

-- ─── updated_at triggers ──────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_al_audiences_updated_at') THEN
    CREATE TRIGGER trg_al_audiences_updated_at BEFORE UPDATE ON al_audiences
      FOR EACH ROW EXECUTE FUNCTION update_drift_recovery_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_al_enrichment_jobs_updated_at') THEN
    CREATE TRIGGER trg_al_enrichment_jobs_updated_at BEFORE UPDATE ON al_enrichment_jobs
      FOR EACH ROW EXECUTE FUNCTION update_drift_recovery_updated_at();
  END IF;
END $$;
