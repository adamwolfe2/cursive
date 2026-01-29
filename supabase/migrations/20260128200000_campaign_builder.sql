-- ============================================================================
-- CAMPAIGN BUILDER (Sales.co-Style Campaign Crafter)
-- NOT for email sending - purely for crafting email sequences
-- EmailBison handles all actual email delivery
-- ============================================================================

-- Campaign drafts table (wizard responses + AI-generated content)
CREATE TABLE IF NOT EXISTS campaign_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Campaign metadata
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, generating, review, approved, exported

  -- ============================================================================
  -- STEP 1: COMPANY PROFILE
  -- ============================================================================
  company_name TEXT,
  industry TEXT,
  company_size TEXT, -- employees, revenue range
  website_url TEXT,
  value_proposition TEXT, -- 1-2 sentences
  differentiators TEXT[], -- vs competitors

  -- ============================================================================
  -- STEP 2: PRODUCT/SERVICE DETAILS
  -- ============================================================================
  product_name TEXT,
  problem_solved TEXT,
  key_features JSONB, -- Array of {title, description}
  pricing_model TEXT,
  social_proof TEXT, -- Case studies, testimonials
  objection_rebuttals JSONB, -- {objection: rebuttal}

  -- ============================================================================
  -- STEP 3: IDEAL CUSTOMER PROFILE (ICP)
  -- ============================================================================
  target_titles TEXT[], -- Job titles/roles
  target_company_sizes TEXT[], -- Company size ranges
  target_industries TEXT[], -- Industries
  target_locations TEXT[], -- Geographic focus
  pain_points TEXT[], -- Pain points prospects experience
  buying_triggers TEXT[], -- What makes them ready to buy

  -- ============================================================================
  -- STEP 4: OFFER/CTA CONFIGURATION
  -- ============================================================================
  primary_cta TEXT, -- book demo, free trial, etc
  secondary_cta TEXT, -- download resource, watch video
  urgency_elements TEXT, -- Scarcity/urgency messaging
  meeting_link TEXT, -- Calendly, etc

  -- ============================================================================
  -- STEP 5: TONE & STYLE PREFERENCES
  -- ============================================================================
  tone TEXT, -- professional, casual, witty, direct
  email_length TEXT, -- short, medium, long
  personalization_level TEXT, -- light, medium, heavy
  reference_style TEXT, -- formal, casual, first-name

  -- ============================================================================
  -- STEP 6: SEQUENCE CONFIGURATION
  -- ============================================================================
  email_count INTEGER DEFAULT 5, -- Number of emails in sequence
  sequence_type TEXT, -- cold_outreach, follow_up, nurture, re_engagement
  days_between_emails INTEGER DEFAULT 3,
  sequence_goal TEXT, -- meeting_booked, reply, click

  -- ============================================================================
  -- AI-GENERATED CONTENT
  -- ============================================================================
  generated_emails JSONB, -- Array of {step: 1, subject, body, day, personalization_notes}
  generation_prompt TEXT, -- The prompt used to generate emails
  ai_model TEXT, -- claude-3-5-sonnet-20241022, etc
  generation_error TEXT, -- Error message if generation failed
  generated_at TIMESTAMPTZ,

  -- ============================================================================
  -- EXPORT TRACKING
  -- ============================================================================
  exported_at TIMESTAMPTZ,
  export_format TEXT, -- csv, api, manual
  emailbison_campaign_id TEXT, -- If synced to EmailBison

  -- ============================================================================
  -- METADATA
  -- ============================================================================
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_campaign_drafts_workspace ON campaign_drafts(workspace_id);
CREATE INDEX idx_campaign_drafts_created_by ON campaign_drafts(created_by);
CREATE INDEX idx_campaign_drafts_status ON campaign_drafts(status) WHERE status != 'exported';
CREATE INDEX idx_campaign_drafts_created_at ON campaign_drafts(created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE campaign_drafts ENABLE ROW LEVEL SECURITY;

-- Users can read their own workspace's campaign drafts
CREATE POLICY "Users can view workspace campaign drafts"
  ON campaign_drafts FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Users can create campaign drafts in their workspace
CREATE POLICY "Users can create campaign drafts"
  ON campaign_drafts FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Users can update their own workspace's campaign drafts
CREATE POLICY "Users can update workspace campaign drafts"
  ON campaign_drafts FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Users can delete their own workspace's campaign drafts
CREATE POLICY "Users can delete workspace campaign drafts"
  ON campaign_drafts FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Service role bypass for background jobs
CREATE POLICY "Service role bypass"
  ON campaign_drafts FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
CREATE TRIGGER update_campaign_drafts_updated_at
  BEFORE UPDATE ON campaign_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ANALYTICS VIEW (Optional - for tracking campaign builder usage)
-- ============================================================================
CREATE OR REPLACE VIEW campaign_builder_stats AS
SELECT
  workspace_id,
  COUNT(*) AS total_drafts,
  COUNT(*) FILTER (WHERE status = 'draft') AS drafts_in_progress,
  COUNT(*) FILTER (WHERE status = 'approved') AS drafts_approved,
  COUNT(*) FILTER (WHERE status = 'exported') AS drafts_exported,
  COUNT(*) FILTER (WHERE generated_at IS NOT NULL) AS drafts_with_ai_content,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) / 3600 AS avg_completion_time_hours
FROM campaign_drafts
GROUP BY workspace_id;

-- ============================================================================
-- DONE
-- ============================================================================
COMMENT ON TABLE campaign_drafts IS 'Campaign Builder wizard responses and AI-generated email sequences. NOT for email sending - content is exported to EmailBison.';
