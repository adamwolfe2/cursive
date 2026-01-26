-- ============================================================================
-- PHASE 1: SALES.CO COLD EMAIL PLATFORM - DATABASE SCHEMA
-- Migration: 20260126000001_sales_co_campaigns_templates.sql
-- ============================================================================

-- ============================================================================
-- 1. ENHANCE EMAIL_TEMPLATES TABLE
-- Add taxonomy columns (Option A: enum columns) and performance metrics
-- ============================================================================

-- Taxonomy columns for Sales.co template classification
ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS tone TEXT CHECK (tone IN ('informal', 'formal', 'energetic', 'humble')),
ADD COLUMN IF NOT EXISTS structure TEXT CHECK (structure IN ('problem_solution', 'value_prop_first', 'social_proof', 'question_based')),
ADD COLUMN IF NOT EXISTS cta_type TEXT CHECK (cta_type IN ('demo_request', 'meeting_request', 'free_trial', 'open_question', 'send_resource')),
ADD COLUMN IF NOT EXISTS target_seniority TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS company_types TEXT[] DEFAULT '{}';

-- Performance tracking columns
ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS emails_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_replies INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS positive_replies INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reply_rate DECIMAL(5,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS positive_reply_rate DECIMAL(5,4) DEFAULT 0;

-- Source tracking (sales_co, custom, ai_generated)
ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'custom';

-- Indexes for template filtering
CREATE INDEX IF NOT EXISTS idx_email_templates_tone ON email_templates(tone);
CREATE INDEX IF NOT EXISTS idx_email_templates_structure ON email_templates(structure);
CREATE INDEX IF NOT EXISTS idx_email_templates_cta_type ON email_templates(cta_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_target_seniority ON email_templates USING GIN(target_seniority);
CREATE INDEX IF NOT EXISTS idx_email_templates_source ON email_templates(source);

COMMENT ON COLUMN email_templates.tone IS 'Template tone: informal, formal, energetic, humble';
COMMENT ON COLUMN email_templates.structure IS 'Email structure: problem_solution, value_prop_first, social_proof, question_based';
COMMENT ON COLUMN email_templates.cta_type IS 'Call-to-action type: demo_request, meeting_request, free_trial, open_question, send_resource';
COMMENT ON COLUMN email_templates.target_seniority IS 'Target seniority levels: c_level, vp, director, manager';

-- ============================================================================
-- 2. ENHANCE EMAIL_CAMPAIGNS TABLE
-- Add review workflow, value props, template selection
-- ============================================================================

-- Associate campaign with AI agent
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;

-- Review workflow columns
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS client_approved_at TIMESTAMPTZ;

-- Targeting criteria
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS target_industries TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_company_sizes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_seniorities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_regions TEXT[] DEFAULT '{}';

-- Value propositions and trust signals (defined during campaign setup)
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS value_propositions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS trust_signals JSONB DEFAULT '[]'::jsonb;

-- Template selection
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS selected_template_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS matching_mode TEXT DEFAULT 'intelligent' CHECK (matching_mode IN ('intelligent', 'random'));

-- Sequence settings
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS sequence_steps INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS days_between_steps INTEGER[] DEFAULT '{3, 5}';

-- Scheduled start (for "scheduled" status)
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS scheduled_start_at TIMESTAMPTZ;

-- Additional stats
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS positive_replies INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS meetings_booked INTEGER DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_campaigns_agent ON email_campaigns(agent_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_reviewed_by ON email_campaigns(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_start ON email_campaigns(scheduled_start_at) WHERE status = 'scheduled';

COMMENT ON COLUMN email_campaigns.status IS 'Campaign status: draft, pending_review, approved, scheduled, active, paused, completed, rejected';
COMMENT ON COLUMN email_campaigns.value_propositions IS 'Array of value props: [{id, name, description, target_segments}]';
COMMENT ON COLUMN email_campaigns.trust_signals IS 'Array of trust signals: [{id, type, content}]';
COMMENT ON COLUMN email_campaigns.matching_mode IS 'Template matching: intelligent (AI-matched) or random';

-- ============================================================================
-- 3. ADD CLIENT REVIEW CONFIGURATION TO WORKSPACES
-- ============================================================================

ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS client_review_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN workspaces.client_review_enabled IS 'Whether campaigns require client approval after internal review';

-- ============================================================================
-- 4. CREATE CLIENT_PROFILES TABLE
-- Stores company info, value props, ICP from onboarding
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Company information
  company_name TEXT NOT NULL,
  company_description TEXT,
  website_url TEXT,
  industry TEXT,
  company_size TEXT,

  -- What they sell / offer
  primary_offering TEXT,
  secondary_offerings TEXT[],

  -- Value propositions
  value_propositions JSONB DEFAULT '[]'::jsonb,

  -- Trust signals / social proof
  trust_signals JSONB DEFAULT '[]'::jsonb,

  -- Pain points they solve
  pain_points TEXT[],

  -- Competitive positioning
  competitors TEXT[],
  differentiators TEXT[],

  -- Ideal Customer Profile (ICP)
  target_industries TEXT[],
  target_company_sizes TEXT[],
  target_seniorities TEXT[],
  target_regions TEXT[],
  target_titles TEXT[],

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_profiles_workspace ON client_profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_active ON client_profiles(is_active) WHERE is_active = true;

-- Updated_at trigger
DROP TRIGGER IF EXISTS client_profiles_updated_at ON client_profiles;
CREATE TRIGGER client_profiles_updated_at
  BEFORE UPDATE ON client_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace isolation for client_profiles" ON client_profiles;
CREATE POLICY "Workspace isolation for client_profiles" ON client_profiles
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

COMMENT ON TABLE client_profiles IS 'Client company profiles with value props, ICP, and competitive positioning';

-- ============================================================================
-- 5. CREATE CAMPAIGN_LEADS TABLE
-- Junction table linking campaigns to leads with enrichment and tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- AI Enrichment (gathered before first email)
  enrichment_data JSONB DEFAULT '{}'::jsonb,
  enriched_at TIMESTAMPTZ,

  -- Value prop matching
  matched_value_prop_id TEXT,
  match_reasoning TEXT,

  -- Sequence tracking
  current_step INTEGER DEFAULT 0,
  last_email_sent_at TIMESTAMPTZ,
  next_email_scheduled_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'enriching',
    'ready',
    'in_sequence',
    'replied',
    'positive',
    'negative',
    'bounced',
    'completed',
    'paused'
  )),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate enrollments
  CONSTRAINT unique_campaign_lead UNIQUE (campaign_id, lead_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign ON campaign_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_lead ON campaign_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_status ON campaign_leads(status);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_next_scheduled ON campaign_leads(next_email_scheduled_at)
  WHERE status IN ('ready', 'in_sequence');

-- RLS (through campaign's workspace)
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace isolation for campaign_leads" ON campaign_leads;
CREATE POLICY "Workspace isolation for campaign_leads" ON campaign_leads
  FOR ALL USING (
    campaign_id IN (
      SELECT id FROM email_campaigns WHERE workspace_id IN (
        SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

COMMENT ON TABLE campaign_leads IS 'Junction table linking leads to campaigns with enrichment data and sequence tracking';
COMMENT ON COLUMN campaign_leads.enrichment_data IS 'AI-gathered research: company news, funding, tech stack, etc.';
COMMENT ON COLUMN campaign_leads.matched_value_prop_id IS 'ID of value prop matched by AI for personalization';

-- ============================================================================
-- 6. CREATE CAMPAIGN_REVIEWS TABLE
-- Tracks approval workflow (internal and optional client review)
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),

  -- Review type
  review_type TEXT NOT NULL CHECK (review_type IN ('internal', 'client')),

  -- Review status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'approved_with_changes',
    'rejected',
    'changes_requested'
  )),

  -- Feedback
  notes TEXT,
  requested_changes JSONB DEFAULT '[]'::jsonb,

  -- Sample emails reviewed (stored for audit)
  sample_emails_reviewed JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_reviews_campaign ON campaign_reviews(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reviews_reviewer ON campaign_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reviews_status ON campaign_reviews(status);
CREATE INDEX IF NOT EXISTS idx_campaign_reviews_type ON campaign_reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_campaign_reviews_pending ON campaign_reviews(review_type, status)
  WHERE status = 'pending';

-- RLS (through campaign's workspace)
ALTER TABLE campaign_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace isolation for campaign_reviews" ON campaign_reviews;
CREATE POLICY "Workspace isolation for campaign_reviews" ON campaign_reviews
  FOR ALL USING (
    campaign_id IN (
      SELECT id FROM email_campaigns WHERE workspace_id IN (
        SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

COMMENT ON TABLE campaign_reviews IS 'Campaign approval workflow tracking for internal and client reviews';
COMMENT ON COLUMN campaign_reviews.sample_emails_reviewed IS 'Sample emails shown during review for audit trail';

-- ============================================================================
-- 7. ENHANCE EMAIL_SENDS TABLE
-- Add reference to campaign_lead and template used
-- ============================================================================

ALTER TABLE email_sends
ADD COLUMN IF NOT EXISTS campaign_lead_id UUID REFERENCES campaign_leads(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sequence_step INTEGER,
ADD COLUMN IF NOT EXISTS value_prop_id TEXT,
ADD COLUMN IF NOT EXISTS tone_used TEXT,
ADD COLUMN IF NOT EXISTS structure_used TEXT,
ADD COLUMN IF NOT EXISTS cta_type_used TEXT;

CREATE INDEX IF NOT EXISTS idx_email_sends_campaign_lead ON email_sends(campaign_lead_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_template ON email_sends(template_id);

COMMENT ON COLUMN email_sends.campaign_lead_id IS 'Reference to campaign_leads for sequence tracking';
COMMENT ON COLUMN email_sends.value_prop_id IS 'ID of value prop used in this email for performance tracking';

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate template performance metrics
CREATE OR REPLACE FUNCTION update_template_performance(p_template_id UUID)
RETURNS void AS $$
DECLARE
  v_sent INTEGER;
  v_replies INTEGER;
  v_positive INTEGER;
BEGIN
  -- Count emails sent with this template
  SELECT COUNT(*) INTO v_sent
  FROM email_sends
  WHERE template_id = p_template_id;

  -- Count replies
  SELECT COUNT(*) INTO v_replies
  FROM email_sends
  WHERE template_id = p_template_id
  AND replied_at IS NOT NULL;

  -- Count positive replies (status = 'replied' with positive intent)
  SELECT COUNT(*) INTO v_positive
  FROM email_sends es
  JOIN campaign_leads cl ON es.campaign_lead_id = cl.id
  WHERE es.template_id = p_template_id
  AND cl.status = 'positive';

  -- Update template metrics
  UPDATE email_templates
  SET
    emails_sent = v_sent,
    total_replies = v_replies,
    positive_replies = v_positive,
    reply_rate = CASE WHEN v_sent > 0 THEN v_replies::DECIMAL / v_sent ELSE 0 END,
    positive_reply_rate = CASE WHEN v_sent > 0 THEN v_positive::DECIMAL / v_sent ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_template_performance IS 'Recalculates performance metrics for a template based on email_sends data';

-- Function to submit campaign for review
CREATE OR REPLACE FUNCTION submit_campaign_for_review(
  p_campaign_id UUID,
  p_sample_emails JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_review_id UUID;
BEGIN
  -- Update campaign status
  UPDATE email_campaigns
  SET
    status = 'pending_review',
    submitted_for_review_at = NOW()
  WHERE id = p_campaign_id;

  -- Create review record
  INSERT INTO campaign_reviews (campaign_id, review_type, sample_emails_reviewed)
  VALUES (p_campaign_id, 'internal', p_sample_emails)
  RETURNING id INTO v_review_id;

  RETURN v_review_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION submit_campaign_for_review IS 'Submits a campaign for internal review and creates review record';

-- Function to approve/reject campaign review
CREATE OR REPLACE FUNCTION complete_campaign_review(
  p_review_id UUID,
  p_reviewer_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL,
  p_requested_changes JSONB DEFAULT '[]'::jsonb
)
RETURNS void AS $$
DECLARE
  v_campaign_id UUID;
  v_review_type TEXT;
  v_workspace_client_review_enabled BOOLEAN;
BEGIN
  -- Get campaign ID and review type
  SELECT campaign_id, review_type INTO v_campaign_id, v_review_type
  FROM campaign_reviews
  WHERE id = p_review_id;

  -- Update review record
  UPDATE campaign_reviews
  SET
    reviewer_id = p_reviewer_id,
    status = p_status,
    notes = p_notes,
    requested_changes = p_requested_changes,
    completed_at = NOW()
  WHERE id = p_review_id;

  -- Update campaign based on review outcome
  IF p_status IN ('approved', 'approved_with_changes') THEN
    -- Check if client review is needed
    SELECT client_review_enabled INTO v_workspace_client_review_enabled
    FROM workspaces w
    JOIN email_campaigns ec ON ec.workspace_id = w.id
    WHERE ec.id = v_campaign_id;

    IF v_review_type = 'internal' AND v_workspace_client_review_enabled THEN
      -- Internal approved, but client review needed
      UPDATE email_campaigns
      SET
        reviewed_by = p_reviewer_id,
        reviewed_at = NOW(),
        review_notes = p_notes,
        status = 'pending_review'
      WHERE id = v_campaign_id;

      -- Create client review record
      INSERT INTO campaign_reviews (campaign_id, review_type)
      VALUES (v_campaign_id, 'client');
    ELSE
      -- Fully approved
      UPDATE email_campaigns
      SET
        reviewed_by = p_reviewer_id,
        reviewed_at = NOW(),
        review_notes = p_notes,
        client_approved_at = CASE WHEN v_review_type = 'client' THEN NOW() ELSE client_approved_at END,
        status = CASE
          WHEN scheduled_start_at IS NOT NULL AND scheduled_start_at > NOW() THEN 'scheduled'
          ELSE 'approved'
        END
      WHERE id = v_campaign_id;
    END IF;
  ELSIF p_status = 'rejected' THEN
    UPDATE email_campaigns
    SET
      status = 'rejected',
      reviewed_by = p_reviewer_id,
      reviewed_at = NOW(),
      review_notes = p_notes
    WHERE id = v_campaign_id;
  ELSIF p_status = 'changes_requested' THEN
    UPDATE email_campaigns
    SET
      status = 'draft',
      review_notes = p_notes
    WHERE id = v_campaign_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION complete_campaign_review IS 'Completes a campaign review (approve/reject/request changes)';

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================

COMMENT ON TABLE email_templates IS 'Email templates with Sales.co taxonomy (tone, structure, CTA, seniority) and performance metrics';
COMMENT ON TABLE email_campaigns IS 'Email campaigns with review workflow, value props, and AI agent association';
