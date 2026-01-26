-- A/B Testing Infrastructure
-- Supports template variant testing with statistical analysis

-- Email template variants for A/B testing
CREATE TABLE IF NOT EXISTS email_template_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Variant identification
  name VARCHAR(100) NOT NULL, -- e.g., "Variant A", "Control", "Short Subject"
  variant_key VARCHAR(50) NOT NULL, -- e.g., "a", "b", "control"
  is_control BOOLEAN DEFAULT false,

  -- Template content
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,

  -- Traffic allocation
  weight INTEGER DEFAULT 50 CHECK (weight >= 0 AND weight <= 100), -- Percentage of traffic

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),

  -- Metadata
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(campaign_id, variant_key)
);

-- A/B test experiments
CREATE TABLE IF NOT EXISTS ab_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Experiment details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hypothesis TEXT,

  -- Configuration
  test_type VARCHAR(50) DEFAULT 'subject' CHECK (test_type IN ('subject', 'body', 'full_template', 'send_time')),
  success_metric VARCHAR(50) DEFAULT 'open_rate' CHECK (success_metric IN ('open_rate', 'click_rate', 'reply_rate', 'conversion_rate')),
  minimum_sample_size INTEGER DEFAULT 100,
  confidence_level DECIMAL(5,2) DEFAULT 95.00, -- 95% confidence

  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),

  -- Results
  winner_variant_id UUID REFERENCES email_template_variants(id),
  statistical_significance DECIMAL(5,2),
  result_summary JSONB DEFAULT '{}',

  -- Timing
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  auto_end_on_significance BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Variant assignments (which lead got which variant)
CREATE TABLE IF NOT EXISTS variant_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_lead_id UUID NOT NULL REFERENCES campaign_leads(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES email_template_variants(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES ab_experiments(id) ON DELETE SET NULL,

  -- Assignment details
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assignment_method VARCHAR(50) DEFAULT 'random', -- random, deterministic, manual

  UNIQUE(campaign_lead_id) -- Each lead only gets one variant
);

-- Add variant tracking to email_sends
ALTER TABLE email_sends ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES email_template_variants(id);
ALTER TABLE email_sends ADD COLUMN IF NOT EXISTS experiment_id UUID REFERENCES ab_experiments(id);

-- Variant performance stats (aggregated for efficiency)
CREATE TABLE IF NOT EXISTS variant_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES email_template_variants(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,

  -- Core metrics
  emails_sent INTEGER DEFAULT 0,
  emails_delivered INTEGER DEFAULT 0,
  emails_bounced INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  unique_opens INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  emails_replied INTEGER DEFAULT 0,
  emails_unsubscribed INTEGER DEFAULT 0,

  -- Derived rates (calculated on update)
  open_rate DECIMAL(5,2) DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0,
  reply_rate DECIMAL(5,2) DEFAULT 0,
  click_to_open_rate DECIMAL(5,2) DEFAULT 0,

  -- Statistical data
  sample_size INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,

  -- Time tracking
  first_send_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(variant_id, experiment_id)
);

-- Enable RLS
ALTER TABLE email_template_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Workspace isolation for variants" ON email_template_variants
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Workspace isolation for experiments" ON ab_experiments
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Workspace isolation for variant assignments" ON variant_assignments
  FOR ALL USING (
    variant_id IN (
      SELECT id FROM email_template_variants
      WHERE workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace isolation for variant stats" ON variant_stats
  FOR ALL USING (
    variant_id IN (
      SELECT id FROM email_template_variants
      WHERE workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- Function to assign a variant to a campaign lead
CREATE OR REPLACE FUNCTION assign_variant(
  p_campaign_lead_id UUID,
  p_campaign_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_variant_id UUID;
  v_total_weight INTEGER;
  v_random_value INTEGER;
  v_cumulative_weight INTEGER := 0;
BEGIN
  -- Check if already assigned
  SELECT variant_id INTO v_variant_id
  FROM variant_assignments
  WHERE campaign_lead_id = p_campaign_lead_id;

  IF v_variant_id IS NOT NULL THEN
    RETURN v_variant_id;
  END IF;

  -- Get total weight of active variants
  SELECT COALESCE(SUM(weight), 0) INTO v_total_weight
  FROM email_template_variants
  WHERE campaign_id = p_campaign_id AND status = 'active';

  IF v_total_weight = 0 THEN
    RETURN NULL;
  END IF;

  -- Generate random number
  v_random_value := floor(random() * v_total_weight)::INTEGER;

  -- Select variant based on weight
  FOR v_variant_id IN
    SELECT id
    FROM email_template_variants
    WHERE campaign_id = p_campaign_id AND status = 'active'
    ORDER BY created_at
  LOOP
    SELECT weight INTO v_cumulative_weight
    FROM email_template_variants WHERE id = v_variant_id;

    v_cumulative_weight := v_cumulative_weight + COALESCE(
      (SELECT SUM(weight) FROM email_template_variants
       WHERE campaign_id = p_campaign_id AND status = 'active'
       AND created_at < (SELECT created_at FROM email_template_variants WHERE id = v_variant_id)),
      0
    );

    IF v_random_value < v_cumulative_weight THEN
      -- Create assignment
      INSERT INTO variant_assignments (campaign_lead_id, variant_id)
      VALUES (p_campaign_lead_id, v_variant_id)
      ON CONFLICT (campaign_lead_id) DO NOTHING;

      RETURN v_variant_id;
    END IF;
  END LOOP;

  -- Fallback: return first active variant
  SELECT id INTO v_variant_id
  FROM email_template_variants
  WHERE campaign_id = p_campaign_id AND status = 'active'
  ORDER BY created_at
  LIMIT 1;

  IF v_variant_id IS NOT NULL THEN
    INSERT INTO variant_assignments (campaign_lead_id, variant_id)
    VALUES (p_campaign_lead_id, v_variant_id)
    ON CONFLICT (campaign_lead_id) DO NOTHING;
  END IF;

  RETURN v_variant_id;
END;
$$;

-- Function to update variant stats
CREATE OR REPLACE FUNCTION update_variant_stats(
  p_variant_id UUID,
  p_experiment_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_stats RECORD;
BEGIN
  -- Calculate stats from email_sends
  SELECT
    COUNT(*) AS sent,
    COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
    COUNT(*) FILTER (WHERE status = 'bounced') AS bounced,
    COUNT(*) FILTER (WHERE opened_at IS NOT NULL) AS opened,
    COUNT(DISTINCT CASE WHEN opened_at IS NOT NULL THEN recipient_email END) AS unique_opens,
    COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) AS clicked,
    COUNT(DISTINCT CASE WHEN clicked_at IS NOT NULL THEN recipient_email END) AS unique_clicks,
    COUNT(*) FILTER (WHERE replied_at IS NOT NULL) AS replied,
    COUNT(*) FILTER (WHERE unsubscribed_at IS NOT NULL) AS unsubscribed,
    MIN(sent_at) AS first_send
  INTO v_stats
  FROM email_sends
  WHERE variant_id = p_variant_id
    AND (p_experiment_id IS NULL OR experiment_id = p_experiment_id);

  -- Upsert stats
  INSERT INTO variant_stats (
    variant_id, experiment_id,
    emails_sent, emails_delivered, emails_bounced,
    emails_opened, unique_opens,
    emails_clicked, unique_clicks,
    emails_replied, emails_unsubscribed,
    open_rate, click_rate, reply_rate, click_to_open_rate,
    sample_size, first_send_at, last_updated_at
  ) VALUES (
    p_variant_id, p_experiment_id,
    v_stats.sent, v_stats.delivered, v_stats.bounced,
    v_stats.opened, v_stats.unique_opens,
    v_stats.clicked, v_stats.unique_clicks,
    v_stats.replied, v_stats.unsubscribed,
    CASE WHEN v_stats.delivered > 0 THEN ROUND((v_stats.unique_opens::DECIMAL / v_stats.delivered) * 100, 2) ELSE 0 END,
    CASE WHEN v_stats.delivered > 0 THEN ROUND((v_stats.unique_clicks::DECIMAL / v_stats.delivered) * 100, 2) ELSE 0 END,
    CASE WHEN v_stats.delivered > 0 THEN ROUND((v_stats.replied::DECIMAL / v_stats.delivered) * 100, 2) ELSE 0 END,
    CASE WHEN v_stats.unique_opens > 0 THEN ROUND((v_stats.unique_clicks::DECIMAL / v_stats.unique_opens) * 100, 2) ELSE 0 END,
    v_stats.sent,
    v_stats.first_send,
    NOW()
  )
  ON CONFLICT (variant_id, experiment_id)
  DO UPDATE SET
    emails_sent = EXCLUDED.emails_sent,
    emails_delivered = EXCLUDED.emails_delivered,
    emails_bounced = EXCLUDED.emails_bounced,
    emails_opened = EXCLUDED.emails_opened,
    unique_opens = EXCLUDED.unique_opens,
    emails_clicked = EXCLUDED.emails_clicked,
    unique_clicks = EXCLUDED.unique_clicks,
    emails_replied = EXCLUDED.emails_replied,
    emails_unsubscribed = EXCLUDED.emails_unsubscribed,
    open_rate = EXCLUDED.open_rate,
    click_rate = EXCLUDED.click_rate,
    reply_rate = EXCLUDED.reply_rate,
    click_to_open_rate = EXCLUDED.click_to_open_rate,
    sample_size = EXCLUDED.sample_size,
    first_send_at = COALESCE(variant_stats.first_send_at, EXCLUDED.first_send_at),
    last_updated_at = NOW();
END;
$$;

-- Function to calculate statistical significance (Z-test for proportions)
CREATE OR REPLACE FUNCTION calculate_significance(
  p_control_conversions INTEGER,
  p_control_sample INTEGER,
  p_variant_conversions INTEGER,
  p_variant_sample INTEGER
)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
AS $$
DECLARE
  v_p1 DECIMAL;
  v_p2 DECIMAL;
  v_pooled DECIMAL;
  v_se DECIMAL;
  v_z DECIMAL;
  v_p_value DECIMAL;
BEGIN
  -- Avoid division by zero
  IF p_control_sample = 0 OR p_variant_sample = 0 THEN
    RETURN 0;
  END IF;

  -- Calculate proportions
  v_p1 := p_control_conversions::DECIMAL / p_control_sample;
  v_p2 := p_variant_conversions::DECIMAL / p_variant_sample;

  -- Pooled proportion
  v_pooled := (p_control_conversions + p_variant_conversions)::DECIMAL / (p_control_sample + p_variant_sample);

  -- Avoid zero pooled proportion
  IF v_pooled = 0 OR v_pooled = 1 THEN
    RETURN 0;
  END IF;

  -- Standard error
  v_se := SQRT(v_pooled * (1 - v_pooled) * (1.0/p_control_sample + 1.0/p_variant_sample));

  -- Avoid division by zero
  IF v_se = 0 THEN
    RETURN 0;
  END IF;

  -- Z-score
  v_z := ABS(v_p1 - v_p2) / v_se;

  -- Approximate p-value to confidence level
  -- Using simplified mapping (actual would use normal distribution CDF)
  -- z > 1.645 => 90% confidence
  -- z > 1.96 => 95% confidence
  -- z > 2.576 => 99% confidence
  IF v_z >= 2.576 THEN
    RETURN 99.00;
  ELSIF v_z >= 1.96 THEN
    RETURN 95.00;
  ELSIF v_z >= 1.645 THEN
    RETURN 90.00;
  ELSIF v_z >= 1.28 THEN
    RETURN 80.00;
  ELSE
    RETURN ROUND(v_z * 30, 2); -- Rough approximation for lower values
  END IF;
END;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_variants_campaign ON email_template_variants(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_experiments_campaign ON ab_experiments(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_variant_assignments_variant ON variant_assignments(variant_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_variant ON email_sends(variant_id) WHERE variant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_variant_stats_variant ON variant_stats(variant_id);

-- Comments
COMMENT ON TABLE email_template_variants IS 'Email template variants for A/B testing';
COMMENT ON TABLE ab_experiments IS 'A/B test experiment definitions and results';
COMMENT ON TABLE variant_assignments IS 'Tracks which variant each lead was assigned';
COMMENT ON TABLE variant_stats IS 'Aggregated performance statistics per variant';
COMMENT ON FUNCTION assign_variant IS 'Assigns a variant to a campaign lead based on weight distribution';
COMMENT ON FUNCTION calculate_significance IS 'Calculates statistical significance between control and variant';
