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

-- ─── Atomic cap enforcement + slot consumption RPC ──────────────────────────
-- Race-safe cap gate. Locks the reseller + pixel rows (FOR UPDATE), applies the
-- period reset, checks the reseller-wide cap and the effective per-pixel cap
-- (explicit pixel cap, else the reseller default), and — only if under cap —
-- increments both counters in the SAME transaction. Concurrent workers can
-- therefore never both pass a full cap (this fixes the check-then-increment
-- race). Returns {allowed, throttled, reason}.
--
-- A delivery ATTEMPT consumes a slot: a subsequent failed POST is NOT refunded
-- in v1 (attempts count toward the cap). This is intentional and documented in
-- the slice spec; failures are rare and the partner controls their endpoint.
CREATE OR REPLACE FUNCTION reseller_consume_delivery(
  p_reseller_id       UUID,
  p_reseller_pixel_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_period_kind   TEXT;
  v_cur_period    DATE;
  v_r_status      TEXT;
  v_r_cap         INTEGER;
  v_r_default_cap INTEGER;
  v_r_default_thr BOOLEAN;
  v_r_used        INTEGER;
  v_p_status      TEXT;
  v_p_cap         INTEGER;
  v_p_throttle    BOOLEAN;
  v_p_used        INTEGER;
  v_eff_cap       INTEGER;
  v_throttled     BOOLEAN;
BEGIN
  -- Lock reseller row.
  SELECT status, lead_cap_per_period, default_lead_cap_per_period, default_throttle_mode, period_kind
    INTO v_r_status, v_r_cap, v_r_default_cap, v_r_default_thr, v_period_kind
    FROM resellers WHERE id = p_reseller_id FOR UPDATE;
  IF v_r_status IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'throttled', false, 'reason', 'reseller_missing');
  END IF;
  IF v_r_status <> 'active' THEN
    RETURN jsonb_build_object('allowed', false, 'throttled', false, 'reason', 'reseller_suspended');
  END IF;

  -- Lock pixel row (asserting it belongs to this reseller).
  SELECT status, lead_cap_per_period, throttle_mode
    INTO v_p_status, v_p_cap, v_p_throttle
    FROM reseller_pixels
    WHERE id = p_reseller_pixel_id AND reseller_id = p_reseller_id FOR UPDATE;
  IF v_p_status IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'throttled', false, 'reason', 'pixel_missing');
  END IF;
  IF v_p_status <> 'active' THEN
    RETURN jsonb_build_object('allowed', false, 'throttled', false, 'reason', 'inactive');
  END IF;

  v_cur_period := CASE WHEN v_period_kind = 'day'
                       THEN now()::date
                       ELSE date_trunc('month', now())::date END;
  v_eff_cap   := COALESCE(v_p_cap, v_r_default_cap);           -- pixel cap else reseller default
  v_throttled := COALESCE(v_p_throttle, v_r_default_thr, false); -- pixel override else reseller default

  -- Reseller-wide cap (period-aware; stale period counts as 0).
  IF v_r_cap IS NOT NULL THEN
    SELECT CASE WHEN period_start < v_cur_period THEN 0 ELSE leads_delivered_period END
      INTO v_r_used FROM resellers WHERE id = p_reseller_id;
    IF v_r_used >= v_r_cap THEN
      RETURN jsonb_build_object('allowed', false, 'throttled', v_throttled, 'reason', 'reseller_cap');
    END IF;
  END IF;

  -- Effective per-pixel cap (period-aware).
  IF v_eff_cap IS NOT NULL THEN
    SELECT CASE WHEN period_start < v_cur_period THEN 0 ELSE leads_delivered_period END
      INTO v_p_used FROM reseller_pixels WHERE id = p_reseller_pixel_id;
    IF v_p_used >= v_eff_cap THEN
      RETURN jsonb_build_object('allowed', false, 'throttled', v_throttled, 'reason', 'pixel_cap');
    END IF;
  END IF;

  -- Under cap → consume one slot on both counters (period-aware reset).
  UPDATE resellers
  SET leads_delivered_period =
        CASE WHEN period_start < v_cur_period THEN 0 ELSE leads_delivered_period END + 1,
      leads_delivered_lifetime = leads_delivered_lifetime + 1,
      period_start = v_cur_period
  WHERE id = p_reseller_id;

  UPDATE reseller_pixels
  SET leads_delivered_period =
        CASE WHEN period_start < v_cur_period THEN 0 ELSE leads_delivered_period END + 1,
      leads_delivered_lifetime = leads_delivered_lifetime + 1,
      period_start = v_cur_period,
      last_delivered_at = now()
  WHERE id = p_reseller_pixel_id AND reseller_id = p_reseller_id;

  RETURN jsonb_build_object('allowed', true, 'throttled', v_throttled, 'reason', null);
END;
$$;

-- ─── Daily rollup RPC (reporting/billing; no counter mutation) ───────────────
-- Buckets a delivery outcome into the per-day rollup. Counters are handled by
-- reseller_consume_delivery; this only records outcome tallies for reporting.
-- p_outcome: 'delivered' | 'throttled' | 'skipped_cap' | 'failed' | 'no_destination'
CREATE OR REPLACE FUNCTION reseller_record_delivery(
  p_reseller_id       UUID,
  p_reseller_pixel_id UUID,
  p_outcome           TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
