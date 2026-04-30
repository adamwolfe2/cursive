-- Marketplace App Installs
--
-- Generic install-tracking table that any third-party marketplace install
-- (GHL, Shopify, future: HubSpot, Wix, etc.) maps into a Cursive workspace.
--
-- One row per (source, external_id). For GHL this is one row per location
-- (an agency installing across 50 sub-accounts creates 50 rows). For Shopify
-- this is one row per shop.
--
-- Every install row links to exactly one Cursive workspace, which owns the
-- pixel, API key, billing, and all downstream data for that install.

CREATE TYPE app_install_source AS ENUM ('ghl', 'shopify');

CREATE TABLE IF NOT EXISTS app_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which marketplace this install came from
  source app_install_source NOT NULL,
  -- Source-specific external ID (GHL location_id, Shopify shop_domain, etc.)
  external_id TEXT NOT NULL,
  -- Optional source-specific parent ID (GHL agency company_id, etc.)
  external_parent_id TEXT,
  -- Human-readable name (shop name, location name)
  external_name TEXT,

  -- The Cursive workspace this install owns
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- The AudienceLab-side pixel bound to this install's workspace
  pixel_id TEXT,
  pixel_install_url TEXT,

  -- Marketplace OAuth credentials
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],

  -- Installer identity (for magic-link email)
  installer_email TEXT,
  installer_name TEXT,

  -- Site the pixel should deploy to (for GHL: funnel domain; for Shopify: shop myshopify.com)
  site_url TEXT,

  -- Marketplace-specific state + audit
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uninstalled_at TIMESTAMPTZ,
  last_refreshed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_app_installs_source_external UNIQUE (source, external_id),
  CONSTRAINT app_installs_status_check CHECK (status IN ('active', 'suspended', 'uninstalled'))
);

CREATE INDEX IF NOT EXISTS idx_app_installs_workspace ON app_installs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_app_installs_source ON app_installs(source, status);
CREATE INDEX IF NOT EXISTS idx_app_installs_external_parent
  ON app_installs(external_parent_id) WHERE external_parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_app_installs_token_expires
  ON app_installs(token_expires_at) WHERE status = 'active' AND token_expires_at IS NOT NULL;

-- Updated_at trigger (reuses existing helper from 20260101000001_init_core_tables.sql)
CREATE TRIGGER app_installs_updated_at
  BEFORE UPDATE ON app_installs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: workspace members see their own installs; service role has full access
ALTER TABLE app_installs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_read_installs" ON app_installs
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "service_role_full_access_installs" ON app_installs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE app_installs IS
  'Marketplace app installations. Maps a GHL location, Shopify shop, or other marketplace install to a Cursive workspace. One row per install.';

COMMENT ON COLUMN app_installs.external_id IS
  'Source-specific canonical ID. GHL: location_id (agency installs expand to one row per location). Shopify: shop domain.';

COMMENT ON COLUMN app_installs.external_parent_id IS
  'Optional grouping ID. GHL: agency company_id. Shopify: null (merchants are standalone).';

COMMENT ON COLUMN app_installs.pixel_id IS
  'AudienceLab pixel UUID provisioned at install time. Carries workspace-scoping on every visitor event webhook.';

COMMENT ON COLUMN app_installs.access_token IS
  'Marketplace OAuth access token. Used by source-specific code (GHL contact sync, Shopify Web Pixel deployment).';
