-- Autoresearch System + AI SDR Enhancements
-- Adds Karpathy-style optimization loop tables and SDR knowledge base
-- ============================================================================

-- ============================================================================
-- 1. AUTORESEARCH PROGRAMS
-- The "program.md" equivalent — per-client optimization configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS autoresearch_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES onboarding_clients(id) ON DELETE SET NULL,

  -- Program identity
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),

  -- Configuration (the "program.md" contents)
  config JSONB NOT NULL DEFAULT '{
    "targetNiche": "",
    "targetPersona": "",
    "maxVariantsPerExperiment": 3,
    "testDurationHours": 72,
    "minSampleSize": 100,
    "successMetric": "positive_reply_rate",
    "maxConcurrentExperiments": 1,
    "autoApplyWinner": true,
    "elementRotation": ["subject", "opening_line", "body", "cta"],
    "qualityConstraints": {
      "maxWordCount": 120,
      "minWordCount": 50,
      "maxSubjectLength": 60,
      "requirePersonalization": true
    }
  }',

  -- Current baseline (the "best known" copy)
  baseline_subject TEXT,
  baseline_body TEXT,
  baseline_positive_reply_rate DECIMAL(7,4) DEFAULT 0,
  baseline_updated_at TIMESTAMPTZ,

  -- Linked EmailBison campaign
  emailbison_campaign_id TEXT,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,

  -- Counters
  total_experiments_run INT DEFAULT 0,
  total_sends INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  current_experiment_id UUID, -- FK added after autoresearch_experiments created
  last_element_tested TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_autoresearch_programs_workspace
  ON autoresearch_programs(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_autoresearch_programs_client
  ON autoresearch_programs(client_id) WHERE client_id IS NOT NULL;

-- ============================================================================
-- 2. AUTORESEARCH EXPERIMENTS
-- Individual experiment runs within a program
-- ============================================================================

CREATE TABLE IF NOT EXISTS autoresearch_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES autoresearch_programs(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Experiment identity
  experiment_number INT NOT NULL,
  hypothesis TEXT NOT NULL,
  element_tested TEXT NOT NULL CHECK (element_tested IN (
    'subject', 'opening_line', 'body', 'cta', 'angle', 'full_template', 'send_time'
  )),

  -- Status
  status TEXT DEFAULT 'generating' CHECK (status IN (
    'generating', 'active', 'waiting', 'evaluating', 'completed', 'failed', 'cancelled'
  )),

  -- Link to existing A/B testing infrastructure
  ab_experiment_id UUID REFERENCES ab_experiments(id) ON DELETE SET NULL,

  -- Variant tracking
  control_variant_id UUID REFERENCES email_template_variants(id) ON DELETE SET NULL,
  challenger_variant_ids UUID[] DEFAULT '{}',

  -- Timing
  started_at TIMESTAMPTZ,
  evaluation_at TIMESTAMPTZ, -- When to evaluate (started_at + test_duration)
  completed_at TIMESTAMPTZ,

  -- Results
  winner_variant_id UUID REFERENCES email_template_variants(id) ON DELETE SET NULL,
  result_status TEXT CHECK (result_status IN (
    'winner_found', 'no_winner', 'insufficient_data', 'extended', 'baseline_kept'
  )),
  result_summary JSONB DEFAULT '{}',
  lift_percent DECIMAL(7,2),
  confidence_level DECIMAL(5,2),

  -- Metadata
  generation_prompt TEXT, -- The prompt used to generate variants
  variant_copies JSONB DEFAULT '{}', -- Snapshot of variant subject/body for audit

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(program_id, experiment_number)
);

-- Now add FK for current_experiment_id
ALTER TABLE autoresearch_programs
  ADD CONSTRAINT fk_current_experiment
  FOREIGN KEY (current_experiment_id)
  REFERENCES autoresearch_experiments(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_autoresearch_experiments_program
  ON autoresearch_experiments(program_id, experiment_number DESC);
CREATE INDEX IF NOT EXISTS idx_autoresearch_experiments_status
  ON autoresearch_experiments(status) WHERE status IN ('active', 'waiting', 'evaluating');
CREATE INDEX IF NOT EXISTS idx_autoresearch_experiments_evaluation
  ON autoresearch_experiments(evaluation_at) WHERE status = 'waiting';

-- ============================================================================
-- 3. AUTORESEARCH RESULTS
-- Per-variant metrics for each experiment (sentiment-aware)
-- ============================================================================

CREATE TABLE IF NOT EXISTS autoresearch_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES autoresearch_experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES email_template_variants(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Send metrics
  emails_sent INT DEFAULT 0,
  emails_delivered INT DEFAULT 0,
  emails_bounced INT DEFAULT 0,

  -- Open/click metrics
  emails_opened INT DEFAULT 0,
  unique_opens INT DEFAULT 0,

  -- Reply metrics (total)
  emails_replied INT DEFAULT 0,

  -- Sentiment breakdown (the key differentiator)
  positive_replies INT DEFAULT 0,
  neutral_replies INT DEFAULT 0,
  negative_replies INT DEFAULT 0,
  unsubscribe_replies INT DEFAULT 0,
  ooo_replies INT DEFAULT 0,

  -- Calculated rates
  positive_reply_rate DECIMAL(7,4) DEFAULT 0,
  total_reply_rate DECIMAL(7,4) DEFAULT 0,
  open_rate DECIMAL(7,4) DEFAULT 0,
  bounce_rate DECIMAL(7,4) DEFAULT 0,

  -- Meeting outcomes
  meetings_booked INT DEFAULT 0,

  -- Snapshot timing
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  is_final BOOLEAN DEFAULT false,

  UNIQUE(experiment_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_autoresearch_results_experiment
  ON autoresearch_results(experiment_id);

-- ============================================================================
-- 4. WINNING PATTERNS (Memory Silo)
-- Stores what worked, tagged by context for cross-campaign learning
-- ============================================================================

CREATE TABLE IF NOT EXISTS winning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  program_id UUID REFERENCES autoresearch_programs(id) ON DELETE SET NULL,
  experiment_id UUID REFERENCES autoresearch_experiments(id) ON DELETE SET NULL,

  -- Context tags
  niche TEXT,
  persona TEXT,
  element_type TEXT NOT NULL CHECK (element_type IN (
    'subject', 'opening_line', 'body', 'cta', 'angle', 'full_template'
  )),

  -- The pattern itself
  pattern_description TEXT NOT NULL, -- Natural language: "Personalized LinkedIn reference in subject"
  winning_copy TEXT NOT NULL, -- The actual copy that won
  baseline_copy TEXT, -- What it beat

  -- Performance data
  lift_percent DECIMAL(7,2),
  positive_reply_rate DECIMAL(7,4),
  confidence_level DECIMAL(5,2),
  sample_size INT,

  -- Replication tracking
  replication_count INT DEFAULT 1,
  last_replicated_at TIMESTAMPTZ,

  -- Tags for flexible querying
  tags TEXT[] DEFAULT '{}',

  -- Cross-client sharing (anonymized)
  is_cross_client BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_winning_patterns_workspace
  ON winning_patterns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_winning_patterns_context
  ON winning_patterns(niche, persona, element_type);
CREATE INDEX IF NOT EXISTS idx_winning_patterns_program
  ON winning_patterns(program_id) WHERE program_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_winning_patterns_tags
  ON winning_patterns USING GIN(tags);

-- ============================================================================
-- 5. SDR KNOWLEDGE BASE
-- Per-client knowledge entries that inform AI reply generation
-- ============================================================================

CREATE TABLE IF NOT EXISTS sdr_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Categorization
  category TEXT NOT NULL CHECK (category IN (
    'product', 'objection_handling', 'pricing', 'scheduling',
    'competitor', 'case_study', 'faq', 'custom'
  )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- Matching
  keywords TEXT[] DEFAULT '{}',
  priority INT DEFAULT 0, -- Higher = preferred when multiple match

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Performance tracking
  usage_count INT DEFAULT 0,
  success_count INT DEFAULT 0, -- Times this entry was used and reply was positive
  success_rate DECIMAL(5,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sdr_knowledge_workspace
  ON sdr_knowledge_base(workspace_id, category);
CREATE INDEX IF NOT EXISTS idx_sdr_knowledge_keywords
  ON sdr_knowledge_base USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_sdr_knowledge_active
  ON sdr_knowledge_base(workspace_id) WHERE is_active = true;

-- ============================================================================
-- 6. ENHANCE EXISTING TABLES
-- ============================================================================

-- Add conversation stage tracking to email_conversations
ALTER TABLE email_conversations
  ADD COLUMN IF NOT EXISTS conversation_stage TEXT DEFAULT 'new'
    CHECK (conversation_stage IN (
      'new', 'engaged', 'qualifying', 'scheduling', 'booked', 'closed', 'lost'
    )),
  ADD COLUMN IF NOT EXISTS ai_turn_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS human_turn_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_ai_reply_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalation_reason TEXT,
  ADD COLUMN IF NOT EXISTS meeting_booked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- Add autoresearch experiment link to email_replies
ALTER TABLE email_replies
  ADD COLUMN IF NOT EXISTS autoresearch_experiment_id UUID
    REFERENCES autoresearch_experiments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS autoresearch_sentiment TEXT
    CHECK (autoresearch_sentiment IN ('positive', 'neutral', 'negative', 'unsubscribe', 'out_of_office'));

CREATE INDEX IF NOT EXISTS idx_email_replies_autoresearch
  ON email_replies(autoresearch_experiment_id)
  WHERE autoresearch_experiment_id IS NOT NULL;

-- Enhance reply_response_templates with trigger conditions and category
ALTER TABLE reply_response_templates
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general'
    CHECK (category IN (
      'interested', 'question', 'objection', 'scheduling',
      'follow_up', 'breakup', 'referral', 'general'
    )),
  ADD COLUMN IF NOT EXISTS trigger_conditions JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS conversation_stage_trigger TEXT,
  ADD COLUMN IF NOT EXISTS reply_rate DECIMAL(5,2) DEFAULT 0;

-- Enhance sdr_configurations with knowledge base and autoresearch settings
ALTER TABLE sdr_configurations
  ADD COLUMN IF NOT EXISTS knowledge_base_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_ai_turns INT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS escalation_after_turns INT DEFAULT 3,
  ADD COLUMN IF NOT EXISTS auto_booking_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS brand_voice_notes TEXT,
  ADD COLUMN IF NOT EXISTS autoresearch_program_id UUID
    REFERENCES autoresearch_programs(id) ON DELETE SET NULL;

-- ============================================================================
-- 7. RLS POLICIES
-- ============================================================================

ALTER TABLE autoresearch_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE autoresearch_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE autoresearch_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE winning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace isolation for autoresearch_programs"
  ON autoresearch_programs FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Workspace isolation for autoresearch_experiments"
  ON autoresearch_experiments FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Workspace isolation for autoresearch_results"
  ON autoresearch_results FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Workspace isolation for winning_patterns"
  ON winning_patterns FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Workspace isolation for sdr_knowledge_base"
  ON sdr_knowledge_base FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Get experiment metrics from email_replies sentiment data
CREATE OR REPLACE FUNCTION get_autoresearch_experiment_metrics(p_experiment_id UUID)
RETURNS TABLE (
  variant_id UUID,
  emails_sent BIGINT,
  total_replies BIGINT,
  positive_replies BIGINT,
  neutral_replies BIGINT,
  negative_replies BIGINT,
  positive_reply_rate DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    es.variant_id,
    COUNT(DISTINCT es.id) AS emails_sent,
    COUNT(DISTINCT er.id) AS total_replies,
    COUNT(DISTINCT er.id) FILTER (
      WHERE er.autoresearch_sentiment = 'positive'
    ) AS positive_replies,
    COUNT(DISTINCT er.id) FILTER (
      WHERE er.autoresearch_sentiment = 'neutral'
    ) AS neutral_replies,
    COUNT(DISTINCT er.id) FILTER (
      WHERE er.autoresearch_sentiment IN ('negative', 'unsubscribe')
    ) AS negative_replies,
    CASE
      WHEN COUNT(DISTINCT es.id) > 0
      THEN ROUND(
        COUNT(DISTINCT er.id) FILTER (WHERE er.autoresearch_sentiment = 'positive')::DECIMAL
        / COUNT(DISTINCT es.id) * 100, 4
      )
      ELSE 0
    END AS positive_reply_rate
  FROM email_sends es
  LEFT JOIN email_replies er
    ON er.email_send_id = es.id
    AND er.autoresearch_experiment_id = p_experiment_id
  WHERE es.experiment_id IN (
    SELECT ae.ab_experiment_id
    FROM autoresearch_experiments ae
    WHERE ae.id = p_experiment_id
  )
  AND es.variant_id IS NOT NULL
  GROUP BY es.variant_id;
END;
$$;

COMMENT ON FUNCTION get_autoresearch_experiment_metrics IS
  'Returns per-variant metrics with sentiment breakdown for an autoresearch experiment';

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================

COMMENT ON TABLE autoresearch_programs IS
  'Karpathy-style optimization programs — per-client configuration for autonomous email experimentation';
COMMENT ON TABLE autoresearch_experiments IS
  'Individual experiment runs within an autoresearch program (generate → test → evaluate → decide)';
COMMENT ON TABLE autoresearch_results IS
  'Per-variant results with sentiment-aware metrics for autoresearch experiments';
COMMENT ON TABLE winning_patterns IS
  'Memory silo of winning email patterns, tagged by niche/persona for cross-campaign learning';
COMMENT ON TABLE sdr_knowledge_base IS
  'Per-workspace knowledge entries that inform AI SDR reply generation';
