-- ============================================================================
-- FIX MISSING COLUMNS
-- Adds columns referenced by campaign compose/send/webhook code and
-- by the activate/audience API route
-- ============================================================================

-- ============================================================================
-- 1. EMAIL_SENDS — columns used by campaign Inngest functions and webhook handler
-- ============================================================================

-- Used by campaign-compose.ts (insert) and webhook handler (query)
ALTER TABLE email_sends
ADD COLUMN IF NOT EXISTS recipient_email TEXT,
ADD COLUMN IF NOT EXISTS recipient_name TEXT;

-- Used by campaign-compose.ts (insert step tracking)
ALTER TABLE email_sends
ADD COLUMN IF NOT EXISTS step_number INTEGER;

-- Used by campaign-compose.ts (insert metadata)
ALTER TABLE email_sends
ADD COLUMN IF NOT EXISTS composition_metadata JSONB;

-- Used by campaign-send.ts (update after send) and webhook handler (query/update)
ALTER TABLE email_sends
ADD COLUMN IF NOT EXISTS emailbison_message_id TEXT;

-- Used by campaign-send.ts (update send metadata, suppression, rate limiting)
ALTER TABLE email_sends
ADD COLUMN IF NOT EXISTS send_metadata JSONB;

-- Used by campaigns/[id]/emails/approve route
ALTER TABLE email_sends
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Used by campaign-compose.ts for A/B test variant tracking
ALTER TABLE email_sends
ADD COLUMN IF NOT EXISTS variant_id UUID;

-- Index for webhook lookups by recipient_email
CREATE INDEX IF NOT EXISTS idx_email_sends_recipient_email
ON email_sends(recipient_email) WHERE recipient_email IS NOT NULL;

-- Index for webhook lookups by emailbison_message_id
CREATE INDEX IF NOT EXISTS idx_email_sends_emailbison_message_id
ON email_sends(emailbison_message_id) WHERE emailbison_message_id IS NOT NULL;

-- ============================================================================
-- 2. CUSTOM_AUDIENCE_REQUESTS — columns used by /api/activate/audience
-- ============================================================================

-- Request type (audience vs lookalike)
ALTER TABLE custom_audience_requests
ADD COLUMN IF NOT EXISTS request_type TEXT;

-- ICP details
ALTER TABLE custom_audience_requests
ADD COLUMN IF NOT EXISTS job_titles TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS icp_description TEXT,
ADD COLUMN IF NOT EXISTS use_case TEXT,
ADD COLUMN IF NOT EXISTS data_sources TEXT[] DEFAULT '{}';

-- Budget and timeline
ALTER TABLE custom_audience_requests
ADD COLUMN IF NOT EXISTS budget_range TEXT,
ADD COLUMN IF NOT EXISTS timeline TEXT;

-- Contact info
ALTER TABLE custom_audience_requests
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Context data
ALTER TABLE custom_audience_requests
ADD COLUMN IF NOT EXISTS pixel_lead_count INTEGER DEFAULT 0;

-- ============================================================================
-- 3. EMAIL_TEMPLATES — ensure is_active column exists (used by compose function)
-- ============================================================================

ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================================
-- 4. CAMPAIGN_LEADS — add missing status values to CHECK constraint
-- Code uses 'awaiting_approval' (compose) and 'unsubscribed' (webhook handler)
-- ============================================================================

ALTER TABLE campaign_leads DROP CONSTRAINT IF EXISTS campaign_leads_status_check;
ALTER TABLE campaign_leads ADD CONSTRAINT campaign_leads_status_check
  CHECK (status IN (
    'pending',
    'enriching',
    'ready',
    'awaiting_approval',
    'in_sequence',
    'replied',
    'positive',
    'negative',
    'bounced',
    'unsubscribed',
    'completed',
    'paused'
  ));
