-- Migration: Production Hardening - Complete Package
-- Creates all necessary tables and security policies for production readiness
-- Includes: Webhook idempotency, payment failure tracking, fuzzy lead matching

-- ============================================================================
-- PART 1: Webhook Idempotency System
-- ============================================================================

-- Create table to track processed webhook events from all sources
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'stripe',
  event_type VARCHAR(100) NOT NULL,
  stripe_event_id VARCHAR(255), -- Kept for backwards compatibility
  payload_summary JSONB,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite unique constraint (event_id + source)
CREATE UNIQUE INDEX IF NOT EXISTS idx_processed_webhook_events_event_source
ON processed_webhook_events(event_id, source);

-- Create index for fast source lookup
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_source
ON processed_webhook_events(source);

-- Index for fast lookup by stripe_event_id (backwards compatibility)
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_stripe_id
ON processed_webhook_events(stripe_event_id)
WHERE stripe_event_id IS NOT NULL;

-- Auto-cleanup index
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_created
ON processed_webhook_events(created_at);

-- Add check constraint for valid sources
ALTER TABLE processed_webhook_events
ADD CONSTRAINT IF NOT EXISTS check_valid_webhook_source
CHECK (source IN ('stripe', 'audience-labs', 'clay', 'datashopper', 'emailbison', 'bland', 'inbound-email'));

-- Enable RLS
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role only (webhook events are internal system data)
CREATE POLICY "Service role full access" ON processed_webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policy: Admins can view for debugging
CREATE POLICY "Admins can view webhook events" ON processed_webhook_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND is_admin = TRUE
    )
  );

-- Cleanup function for old webhook events
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events(p_retention_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM processed_webhook_events
  WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Cleaned up % webhook events older than % days', v_deleted, p_retention_days;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE processed_webhook_events IS
'Tracks processed webhook events from all sources (Stripe, Audience Labs, etc.) to prevent duplicate processing.
Used for idempotency in webhook handlers. Old events are automatically cleaned up after 30 days.';

COMMENT ON COLUMN processed_webhook_events.event_id IS
'Unique event identifier from webhook source (e.g., Stripe event ID, import job ID, or payload hash)';

COMMENT ON COLUMN processed_webhook_events.source IS
'Webhook source identifier (stripe, audience-labs, etc.)';

COMMENT ON COLUMN processed_webhook_events.payload_summary IS
'JSON summary of webhook payload for debugging (lead count, workspace, etc.)';

-- ============================================================================
-- PART 2: Subscription Payment Failure Tracking & Workspace Access Control
-- ============================================================================

-- Add columns to subscriptions table for tracking payment failures
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS failed_payment_count INTEGER DEFAULT 0;

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS last_payment_failed_at TIMESTAMPTZ;

-- Add columns to workspaces table for access control
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS access_disabled BOOLEAN DEFAULT FALSE;

ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS access_disabled_reason VARCHAR(100);

ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS access_disabled_at TIMESTAMPTZ;

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_failed_payments
ON subscriptions(failed_payment_count, status)
WHERE failed_payment_count > 0;

CREATE INDEX IF NOT EXISTS idx_workspaces_access_disabled
ON workspaces(access_disabled)
WHERE access_disabled = TRUE;

-- Add check constraint for valid access_disabled_reason
ALTER TABLE workspaces
DROP CONSTRAINT IF EXISTS check_valid_access_disabled_reason;

ALTER TABLE workspaces
ADD CONSTRAINT check_valid_access_disabled_reason
CHECK (
  access_disabled_reason IS NULL OR
  access_disabled_reason IN (
    'subscription_payment_failed',
    'subscription_canceled',
    'terms_violation',
    'manual_suspension'
  )
);

-- Function to check if workspace has active access
CREATE OR REPLACE FUNCTION workspace_has_active_access(p_workspace_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_disabled BOOLEAN;
  v_subscription_status VARCHAR;
BEGIN
  SELECT access_disabled INTO v_disabled
  FROM workspaces
  WHERE id = p_workspace_id;

  IF v_disabled THEN
    RETURN FALSE;
  END IF;

  SELECT status INTO v_subscription_status
  FROM subscriptions
  WHERE workspace_id = p_workspace_id;

  IF v_subscription_status IS NULL OR v_subscription_status = 'active' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON COLUMN subscriptions.failed_payment_count IS
'Number of consecutive failed payment attempts. Reset to 0 when payment succeeds.';

COMMENT ON COLUMN subscriptions.last_payment_failed_at IS
'Timestamp of the most recent failed payment attempt.';

COMMENT ON COLUMN workspaces.access_disabled IS
'Whether workspace access is disabled due to payment failure or other reasons.';

COMMENT ON COLUMN workspaces.access_disabled_reason IS
'Reason why workspace access was disabled (subscription_payment_failed, subscription_canceled, terms_violation, manual_suspension).';

COMMENT ON COLUMN workspaces.access_disabled_at IS
'Timestamp when workspace access was disabled.';

COMMENT ON FUNCTION workspace_has_active_access IS
'Checks if a workspace has active access based on subscription status and access_disabled flag. Returns TRUE if workspace can access the platform.';

-- ============================================================================
-- PART 3: Fuzzy Lead Matching (PostgreSQL Trigram Similarity)
-- ============================================================================

-- Enable pg_trgm extension for trigram similarity matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add indexes for fast trigram similarity searches
CREATE INDEX IF NOT EXISTS idx_leads_company_name_trgm
ON leads USING gin (company_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_leads_email_trgm
ON leads USING gin (email gin_trgm_ops)
WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_linkedin_url_trgm
ON leads USING gin (linkedin_url gin_trgm_ops)
WHERE linkedin_url IS NOT NULL;

-- Function to find similar leads using fuzzy matching
CREATE OR REPLACE FUNCTION find_similar_leads(
  p_company_name VARCHAR DEFAULT NULL,
  p_email VARCHAR DEFAULT NULL,
  p_linkedin_url VARCHAR DEFAULT NULL,
  p_similarity_threshold REAL DEFAULT 0.8,
  p_workspace_id UUID DEFAULT NULL
)
RETURNS TABLE (
  lead_id UUID,
  similarity_score REAL,
  match_field VARCHAR,
  matched_company_name VARCHAR,
  matched_email VARCHAR,
  matched_linkedin_url VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id AS lead_id,
    GREATEST(
      COALESCE(similarity(l.company_name, p_company_name), 0),
      COALESCE(similarity(l.email, p_email), 0),
      COALESCE(similarity(l.linkedin_url, p_linkedin_url), 0)
    ) AS similarity_score,
    CASE
      WHEN similarity(l.company_name, p_company_name) >= p_similarity_threshold THEN 'company_name'
      WHEN similarity(l.email, p_email) >= p_similarity_threshold THEN 'email'
      WHEN similarity(l.linkedin_url, p_linkedin_url) >= p_similarity_threshold THEN 'linkedin_url'
      ELSE 'unknown'
    END AS match_field,
    l.company_name AS matched_company_name,
    l.email AS matched_email,
    l.linkedin_url AS matched_linkedin_url
  FROM leads l
  WHERE
    (p_workspace_id IS NULL OR l.workspace_id = p_workspace_id)
    AND (
      (p_company_name IS NOT NULL AND similarity(l.company_name, p_company_name) >= p_similarity_threshold)
      OR (p_email IS NOT NULL AND similarity(l.email, p_email) >= p_similarity_threshold)
      OR (p_linkedin_url IS NOT NULL AND similarity(l.linkedin_url, p_linkedin_url) >= p_similarity_threshold)
    )
  ORDER BY similarity_score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a lead is a duplicate (exact or fuzzy match)
CREATE OR REPLACE FUNCTION check_lead_duplicate(
  p_company_name VARCHAR,
  p_email VARCHAR DEFAULT NULL,
  p_linkedin_url VARCHAR DEFAULT NULL,
  p_phone VARCHAR DEFAULT NULL,
  p_workspace_id UUID DEFAULT NULL,
  p_use_fuzzy_matching BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE
  v_duplicate_id UUID;
  v_hash VARCHAR;
BEGIN
  -- STEP 1: Check for exact duplicates using hash
  v_hash := MD5(
    COALESCE(LOWER(TRIM(p_company_name)), '') || '::' ||
    COALESCE(LOWER(TRIM(p_email)), '') || '::' ||
    COALESCE(LOWER(TRIM(p_linkedin_url)), '') || '::' ||
    COALESCE(LOWER(TRIM(p_phone)), '')
  );

  SELECT id INTO v_duplicate_id
  FROM leads
  WHERE dedupe_hash = v_hash
    AND (p_workspace_id IS NULL OR workspace_id = p_workspace_id)
  LIMIT 1;

  IF v_duplicate_id IS NOT NULL THEN
    RETURN v_duplicate_id;
  END IF;

  -- STEP 2: If fuzzy matching enabled, check for similar leads
  IF p_use_fuzzy_matching THEN
    SELECT lead_id INTO v_duplicate_id
    FROM find_similar_leads(
      p_company_name,
      p_email,
      p_linkedin_url,
      0.85, -- 85% similarity threshold for duplicates
      p_workspace_id
    )
    LIMIT 1;

    IF v_duplicate_id IS NOT NULL THEN
      RETURN v_duplicate_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to merge duplicate leads
CREATE OR REPLACE FUNCTION merge_duplicate_leads(
  p_primary_lead_id UUID,
  p_duplicate_lead_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_primary_created TIMESTAMPTZ;
  v_duplicate_created TIMESTAMPTZ;
BEGIN
  SELECT created_at INTO v_primary_created
  FROM leads
  WHERE id = p_primary_lead_id;

  SELECT created_at INTO v_duplicate_created
  FROM leads
  WHERE id = p_duplicate_lead_id;

  IF v_duplicate_created < v_primary_created THEN
    RAISE EXCEPTION 'Cannot merge: duplicate lead (%) is older than primary lead (%). Swap them and retry.',
      p_duplicate_lead_id, p_primary_lead_id;
  END IF;

  -- Update references in marketplace_purchases to point to primary lead
  UPDATE marketplace_purchase_items
  SET lead_id = p_primary_lead_id
  WHERE lead_id = p_duplicate_lead_id;

  -- Update references in lead_deliveries to point to primary lead
  UPDATE lead_deliveries
  SET lead_id = p_primary_lead_id
  WHERE lead_id = p_duplicate_lead_id;

  -- Merge enrichment data from duplicate if primary is missing it
  UPDATE leads
  SET
    email = COALESCE(leads.email, dup.email),
    phone = COALESCE(leads.phone, dup.phone),
    first_name = COALESCE(leads.first_name, dup.first_name),
    last_name = COALESCE(leads.last_name, dup.last_name),
    job_title = COALESCE(leads.job_title, dup.job_title),
    linkedin_url = COALESCE(leads.linkedin_url, dup.linkedin_url),
    company_location = COALESCE(leads.company_location, dup.company_location),
    company_industry = COALESCE(leads.company_industry, dup.company_industry),
    updated_at = NOW()
  FROM leads dup
  WHERE leads.id = p_primary_lead_id
    AND dup.id = p_duplicate_lead_id;

  -- Soft delete the duplicate lead
  UPDATE leads
  SET
    is_deleted = TRUE,
    deleted_at = NOW(),
    deleted_reason = 'merged_duplicate',
    updated_at = NOW()
  WHERE id = p_duplicate_lead_id;

  RAISE NOTICE 'Merged duplicate lead % into primary lead %', p_duplicate_lead_id, p_primary_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add columns to leads table for tracking duplicates
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS deleted_reason VARCHAR(100);

-- Add index for filtering out deleted leads
CREATE INDEX IF NOT EXISTS idx_leads_not_deleted
ON leads(is_deleted, workspace_id)
WHERE is_deleted = FALSE;

-- Add check constraint for valid deleted_reason
ALTER TABLE leads
DROP CONSTRAINT IF EXISTS check_valid_deleted_reason;

ALTER TABLE leads
ADD CONSTRAINT check_valid_deleted_reason
CHECK (
  deleted_reason IS NULL OR
  deleted_reason IN (
    'merged_duplicate',
    'data_quality',
    'user_request',
    'manual_deletion'
  )
);

-- Create view for non-deleted leads
CREATE OR REPLACE VIEW active_leads AS
SELECT *
FROM leads
WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Comments
COMMENT ON FUNCTION find_similar_leads IS
'Finds leads similar to the provided criteria using fuzzy matching (trigram similarity).
Useful for detecting duplicates even with typos. Default similarity threshold is 0.8 (80% similar).';

COMMENT ON FUNCTION check_lead_duplicate IS
'Checks if a lead is a duplicate using both exact hash matching and fuzzy similarity matching.
Returns the UUID of the duplicate lead if found, NULL otherwise.
Use p_use_fuzzy_matching=FALSE to disable fuzzy matching and only check exact duplicates.';

COMMENT ON FUNCTION merge_duplicate_leads IS
'Merges a duplicate lead into the primary lead, updating all references and soft-deleting the duplicate.
Preserves the older lead as primary. Enrichment data from duplicate is merged if primary is missing it.';

COMMENT ON COLUMN leads.is_deleted IS
'Soft delete flag. Deleted leads are hidden from queries but preserved for audit trail.';

COMMENT ON COLUMN leads.deleted_at IS
'Timestamp when the lead was soft-deleted.';

COMMENT ON COLUMN leads.deleted_reason IS
'Reason why the lead was deleted (merged_duplicate, data_quality, user_request, manual_deletion).';

COMMENT ON VIEW active_leads IS
'View of all active (non-deleted) leads. Use this view instead of querying leads table directly to automatically filter out deleted leads.';
