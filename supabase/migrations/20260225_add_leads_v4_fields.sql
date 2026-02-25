-- Migration: Add AudienceLab v4 enrichment fields to leads table
-- Created: 2026-02-25

-- DNC (Do Not Contact) flags
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS dnc_mobile BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dnc_landline BOOLEAN DEFAULT FALSE;

-- Department (v4 provides richer professional data)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS department TEXT;

-- Page URL the visitor was on when identified (from FULL_URL in v4)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS page_url TEXT;

-- Last time this lead was synced via v4 pixel pull
ALTER TABLE audiencelab_pixels
  ADD COLUMN IF NOT EXISTS last_v4_synced_at TIMESTAMPTZ;

-- Index for fast DNC lookups (compliance queries)
CREATE INDEX IF NOT EXISTS leads_dnc_mobile_idx ON leads (workspace_id, dnc_mobile) WHERE dnc_mobile = TRUE;
CREATE INDEX IF NOT EXISTS leads_dnc_landline_idx ON leads (workspace_id, dnc_landline) WHERE dnc_landline = TRUE;
