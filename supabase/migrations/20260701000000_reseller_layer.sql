-- ============================================================================
-- Reseller / White-Label Layer
-- ============================================================================
-- Adds a reseller (parent org) -> end-customer (child workspace + pixel) model
-- on top of the existing AudienceLab pixel + lead pipeline. Each end-customer is
-- a headless, reseller-owned `workspaces` row so the entire existing
-- events -> normalize -> leads -> `lead/created` pipeline is reused unchanged.
--
-- TODO: MUST BE APPLIED MANUALLY (Supabase CLI not linked; project_id is a
-- placeholder in config.toml). Apply via dashboard SQL editor or:
--   npx supabase db push --db-url "postgresql://postgres:[DB_PASSWORD]@db.lrbftjspiiakfnydxbgk.supabase.co:5432/postgres"
--
-- All new tables are accessed only via the service-role admin client behind
-- API-key auth (resellers are NOT Supabase auth users). RLS is ENABLED with no
-- permissive client policy => deny-all to anon/authenticated; service role
-- bypasses RLS. This is defense-in-depth, matching the funnel_orders posture.
-- ============================================================================

-- ─── resellers ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resellers (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        TEXT NOT NULL,
  status                      TEXT NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'suspended')),
  -- Metering period: 'month' (calendar month) or 'day'.
  period_kind                 TEXT NOT NULL DEFAULT 'month'
                                CHECK (period_kind IN ('month', 'day')),
  -- Reseller-wide cap across all pixels for the current period (NULL = unlimited).
  lead_cap_per_period         INTEGER,
  -- Defaults applied to new pixels when the pixel does not override.
  default_lead_cap_per_period INTEGER,
  default_throttle_mode       BOOLEAN NOT NULL DEFAULT FALSE,
  -- Reseller-level meter (current period + lifetime).
  period_start                DATE NOT NULL DEFAULT (date_trunc('month', now())::date),
  leads_delivered_period      INTEGER NOT NULL DEFAULT 0,
  leads_delivered_lifetime    BIGINT NOT NULL DEFAULT 0,
  -- Billing hook stub (e.g. Stripe customer id) — not wired in this slice.
  billing_external_ref        TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── reseller_api_keys ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reseller_api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id  UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  key_hash     TEXT NOT NULL UNIQUE,       -- sha256 hex of the raw key; raw is never stored
  key_prefix   TEXT NOT NULL,              -- e.g. 'rk_live_ab12cd34' for display/support
  name         TEXT,
  scopes       TEXT[] NOT NULL DEFAULT ARRAY['pixels:read', 'pixels:write']::TEXT[],
  last_used_at TIMESTAMPTZ,
  revoked      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reseller_api_keys_hash
  ON reseller_api_keys(key_hash) WHERE revoked = FALSE;
CREATE INDEX IF NOT EXISTS idx_reseller_api_keys_reseller
  ON reseller_api_keys(reseller_id);

-- ─── reseller_pixels ────────────────────────────────────────────────────────
-- Maps a reseller + partner-supplied customer ref -> a headless child workspace
-- + provisioned AudienceLab pixel, plus that customer's outbound delivery config,
-- caps, throttle, and meter.
CREATE TABLE IF NOT EXISTS reseller_pixels (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id              UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  workspace_id             UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  pixel_id                 TEXT NOT NULL,                 -- audiencelab_pixels.pixel_id
  external_customer_ref    TEXT NOT NULL,                 -- partner's own id for the end-customer
  website_url              TEXT NOT NULL,
  domain                   TEXT,
  status                   TEXT NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active', 'inactive')),
  -- Outbound delivery (partner's receiving endpoint).
  destination_url          TEXT,
  signing_secret           TEXT,                          -- per-pixel HMAC-SHA256 secret
  -- Caps + throttle. NULL cap = inherit reseller default (which may also be NULL = unlimited).
  -- NULL throttle_mode = inherit reseller default_throttle_mode.
  lead_cap_per_period      INTEGER,
  throttle_mode            BOOLEAN,
  -- Per-pixel meter (current period + lifetime).
  period_start             DATE NOT NULL DEFAULT (date_trunc('month', now())::date),
  leads_delivered_period   INTEGER NOT NULL DEFAULT 0,
  leads_delivered_lifetime BIGINT NOT NULL DEFAULT 0,
  last_delivered_at        TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reseller_id, external_customer_ref)
);

CREATE INDEX IF NOT EXISTS idx_reseller_pixels_workspace ON reseller_pixels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reseller_pixels_pixel     ON reseller_pixels(pixel_id);
CREATE INDEX IF NOT EXISTS idx_reseller_pixels_reseller  ON reseller_pixels(reseller_id);

-- ─── reseller_lead_deliveries (per-lead audit) ──────────────────────────────
CREATE TABLE IF NOT EXISTS reseller_lead_deliveries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id       UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  reseller_pixel_id UUID NOT NULL REFERENCES reseller_pixels(id) ON DELETE CASCADE,
  lead_id           UUID,
  status            TEXT NOT NULL
                      CHECK (status IN ('delivered', 'throttled', 'skipped_cap', 'failed', 'no_destination')),
  throttled         BOOLEAN NOT NULL DEFAULT FALSE,
  response_status   INT,
  error_message     TEXT,
  attempts          INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reseller_lead_deliveries_pixel
  ON reseller_lead_deliveries(reseller_pixel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reseller_lead_deliveries_reseller
  ON reseller_lead_deliveries(reseller_id, created_at DESC);

-- ─── reseller_usage_daily (rollup for reporting/billing) ────────────────────
CREATE TABLE IF NOT EXISTS reseller_usage_daily (
  reseller_id       UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  reseller_pixel_id UUID NOT NULL REFERENCES reseller_pixels(id) ON DELETE CASCADE,
  usage_date        DATE NOT NULL,
  leads_delivered   INTEGER NOT NULL DEFAULT 0,
  leads_throttled   INTEGER NOT NULL DEFAULT 0,
  leads_skipped_cap INTEGER NOT NULL DEFAULT 0,
  leads_failed      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (reseller_id, reseller_pixel_id, usage_date)
);

-- ─── updated_at triggers (reuse existing shared trigger fn) ──────────────────
DROP TRIGGER IF EXISTS trg_resellers_updated_at ON resellers;
CREATE TRIGGER trg_resellers_updated_at BEFORE UPDATE ON resellers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_reseller_pixels_updated_at ON reseller_pixels;
CREATE TRIGGER trg_reseller_pixels_updated_at BEFORE UPDATE ON reseller_pixels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Atomic delivery metering RPC ───────────────────────────────────────────
-- Resets stale period counters (calendar month or day), increments the pixel
-- and reseller counters when the outcome consumed quota, and upserts the daily
-- rollup. Called once per lead-delivery attempt by the Inngest worker.
--
-- p_outcome: 'delivered' | 'throttled' | 'skipped_cap' | 'failed' | 'no_destination'
-- 'delivered' and 'throttled' both consume quota (a throttled lead is still a
-- delivered lead, just a reduced payload). Others do not increment meters.
CREATE OR REPLACE FUNCTION reseller_record_delivery(
  p_reseller_id       UUID,
  p_reseller_pixel_id UUID,
  p_outcome           TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_period_kind TEXT;
  v_cur_period  DATE;
  v_consumed    BOOLEAN := (p_outcome IN ('delivered', 'throttled'));
BEGIN
  SELECT period_kind INTO v_period_kind FROM resellers WHERE id = p_reseller_id;
  IF v_period_kind IS NULL THEN
    RETURN; -- reseller vanished; nothing to meter
  END IF;

  IF v_period_kind = 'day' THEN
    v_cur_period := now()::date;
  ELSE
    v_cur_period := date_trunc('month', now())::date;
  END IF;

  -- Reseller-level period reset + increment
  UPDATE resellers
  SET
    leads_delivered_period =
      CASE WHEN period_start < v_cur_period THEN 0 ELSE leads_delivered_period END
      + (CASE WHEN v_consumed THEN 1 ELSE 0 END),
    leads_delivered_lifetime = leads_delivered_lifetime + (CASE WHEN v_consumed THEN 1 ELSE 0 END),
    period_start = v_cur_period
  WHERE id = p_reseller_id;

  -- Pixel-level period reset + increment
  UPDATE reseller_pixels
  SET
    leads_delivered_period =
      CASE WHEN period_start < v_cur_period THEN 0 ELSE leads_delivered_period END
      + (CASE WHEN v_consumed THEN 1 ELSE 0 END),
    leads_delivered_lifetime = leads_delivered_lifetime + (CASE WHEN v_consumed THEN 1 ELSE 0 END),
    period_start = v_cur_period,
    last_delivered_at = CASE WHEN v_consumed THEN now() ELSE last_delivered_at END
  WHERE id = p_reseller_pixel_id;

  -- Daily rollup upsert
  INSERT INTO reseller_usage_daily (
    reseller_id, reseller_pixel_id, usage_date,
    leads_delivered, leads_throttled, leads_skipped_cap, leads_failed
  ) VALUES (
    p_reseller_id, p_reseller_pixel_id, now()::date,
    CASE WHEN p_outcome IN ('delivered', 'throttled') THEN 1 ELSE 0 END,
    CASE WHEN p_outcome = 'throttled'   THEN 1 ELSE 0 END,
    CASE WHEN p_outcome = 'skipped_cap' THEN 1 ELSE 0 END,
    CASE WHEN p_outcome = 'failed'      THEN 1 ELSE 0 END
  )
  ON CONFLICT (reseller_id, reseller_pixel_id, usage_date) DO UPDATE SET
    leads_delivered   = reseller_usage_daily.leads_delivered   + EXCLUDED.leads_delivered,
    leads_throttled   = reseller_usage_daily.leads_throttled   + EXCLUDED.leads_throttled,
    leads_skipped_cap = reseller_usage_daily.leads_skipped_cap + EXCLUDED.leads_skipped_cap,
    leads_failed      = reseller_usage_daily.leads_failed      + EXCLUDED.leads_failed;
END;
$$;

-- ─── RLS: enable, deny-all to clients (service role bypasses) ────────────────
ALTER TABLE resellers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_api_keys       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_pixels         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_lead_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_usage_daily    ENABLE ROW LEVEL SECURITY;
-- No permissive policies are created on purpose: every access path is the
-- service-role admin client behind API-key auth. anon/authenticated get nothing.
