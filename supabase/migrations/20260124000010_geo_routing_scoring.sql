-- Cursive Platform - Geographic Routing and Lead Scoring
-- Migration for advanced routing and scoring

-- ============================================================================
-- GEOGRAPHIC REGIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS geographic_regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  states TEXT[] NOT NULL, -- array of state codes
  timezone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert regions
INSERT INTO geographic_regions (name, display_name, states, timezone) VALUES
  ('northeast', 'Northeast', ARRAY['CT', 'DE', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'], 'America/New_York'),
  ('southeast', 'Southeast', ARRAY['AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'], 'America/New_York'),
  ('midwest', 'Midwest', ARRAY['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'], 'America/Chicago'),
  ('southwest', 'Southwest', ARRAY['AZ', 'NM', 'OK', 'TX'], 'America/Denver'),
  ('west', 'West Coast', ARRAY['CA', 'NV', 'OR', 'WA'], 'America/Los_Angeles'),
  ('mountain', 'Mountain', ARRAY['CO', 'ID', 'MT', 'UT', 'WY'], 'America/Denver'),
  ('pacific', 'Pacific', ARRAY['AK', 'HI'], 'America/Anchorage')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SERVICE AREA MAPPINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS workspace_service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  state_code CHAR(2) NOT NULL,
  city TEXT,
  zip_codes TEXT[], -- specific zip codes if needed
  radius_miles INTEGER, -- for radius-based targeting
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, state_code, city)
);

-- Index for service area lookups
CREATE INDEX IF NOT EXISTS idx_service_areas_workspace ON workspace_service_areas(workspace_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_state ON workspace_service_areas(state_code);

-- ============================================================================
-- LEAD SCORING RULES
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_global BOOLEAN DEFAULT true, -- applies to all workspaces
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE, -- if not global
  condition_type TEXT NOT NULL, -- field_match, intent_signal, engagement, source, etc.
  condition_field TEXT, -- field to check
  condition_operator TEXT NOT NULL, -- equals, contains, greater_than, etc.
  condition_value TEXT, -- value to match
  score_adjustment INTEGER NOT NULL, -- positive or negative
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default scoring rules
INSERT INTO lead_scoring_rules (name, description, condition_type, condition_field, condition_operator, condition_value, score_adjustment) VALUES
  ('High Intent Signal', 'Boost score for high-intent keywords', 'intent_signal', 'intent_signal', 'contains', 'ready to buy', 20),
  ('Urgent Need', 'Boost score for urgent requests', 'intent_signal', 'intent_signal', 'contains', 'urgent', 15),
  ('Email Verified', 'Boost score for verified emails', 'field_match', 'email_verified', 'equals', 'true', 10),
  ('Phone Provided', 'Boost score when phone is provided', 'field_match', 'phone', 'not_empty', '', 10),
  ('Company Provided', 'Boost score when company is known', 'field_match', 'company_name', 'not_empty', '', 5),
  ('Reply Engagement', 'Major boost for email replies', 'engagement', 'email_reply', 'equals', 'true', 25),
  ('Email Click', 'Boost for clicking email links', 'engagement', 'email_click', 'equals', 'true', 15),
  ('Email Open', 'Small boost for opening emails', 'engagement', 'email_open', 'equals', 'true', 5),
  ('Partner Source', 'Trusted partner source', 'source', 'source', 'equals', 'partner', 10),
  ('Low Quality Indicator', 'Penalty for suspicious patterns', 'field_match', 'email', 'contains', 'test@', -20)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LEAD SCORE HISTORY (for analytics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  previous_score INTEGER,
  new_score INTEGER NOT NULL,
  change_reason TEXT,
  rule_id UUID REFERENCES lead_scoring_rules(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for score history
CREATE INDEX IF NOT EXISTS idx_lead_score_history_lead ON lead_score_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_score_history_created ON lead_score_history(created_at);

-- ============================================================================
-- FUNCTION TO CALCULATE LEAD SCORE
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_lead_score(p_lead_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 50; -- base score
  v_lead RECORD;
  v_rule RECORD;
BEGIN
  -- Get lead data
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Apply scoring rules
  FOR v_rule IN
    SELECT * FROM lead_scoring_rules
    WHERE is_active = true
    AND (is_global = true OR workspace_id = v_lead.workspace_id)
  LOOP
    -- Apply rule based on condition type
    IF v_rule.condition_type = 'field_match' THEN
      CASE v_rule.condition_operator
        WHEN 'equals' THEN
          IF v_lead ->> v_rule.condition_field = v_rule.condition_value THEN
            v_score := v_score + v_rule.score_adjustment;
          END IF;
        WHEN 'not_empty' THEN
          IF v_lead ->> v_rule.condition_field IS NOT NULL AND v_lead ->> v_rule.condition_field != '' THEN
            v_score := v_score + v_rule.score_adjustment;
          END IF;
        WHEN 'contains' THEN
          IF v_lead ->> v_rule.condition_field ILIKE '%' || v_rule.condition_value || '%' THEN
            v_score := v_score + v_rule.score_adjustment;
          END IF;
        ELSE
          -- skip unknown operators
      END CASE;
    ELSIF v_rule.condition_type = 'intent_signal' THEN
      IF v_lead.intent_signal ILIKE '%' || v_rule.condition_value || '%' THEN
        v_score := v_score + v_rule.score_adjustment;
      END IF;
    ELSIF v_rule.condition_type = 'source' THEN
      IF v_lead.source = v_rule.condition_value THEN
        v_score := v_score + v_rule.score_adjustment;
      END IF;
    END IF;
  END LOOP;

  -- Ensure score is within bounds (0-100)
  v_score := GREATEST(0, LEAST(100, v_score));

  -- Update lead score
  UPDATE leads
  SET lead_score = v_score
  WHERE id = p_lead_id;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROUTING PRIORITY CALCULATION
-- ============================================================================
CREATE OR REPLACE FUNCTION find_best_workspace_for_lead(
  p_industry TEXT,
  p_state TEXT,
  p_lead_score INTEGER DEFAULT 50
)
RETURNS UUID AS $$
DECLARE
  v_workspace_id UUID;
BEGIN
  -- Find workspace with matching industry and region, ordered by priority
  SELECT w.id INTO v_workspace_id
  FROM workspaces w
  LEFT JOIN industry_routing_rules irr ON irr.workspace_id = w.id AND irr.industry = p_industry
  WHERE
    w.is_active = true
    AND (w.allowed_industries IS NULL OR p_industry = ANY(w.allowed_industries))
    AND (w.allowed_regions IS NULL OR p_state = ANY(w.allowed_regions))
    AND (irr.is_active IS NULL OR irr.is_active = true)
    AND (irr.min_lead_score IS NULL OR p_lead_score >= irr.min_lead_score)
  ORDER BY
    COALESCE(irr.priority, 1) DESC,
    w.created_at ASC
  LIMIT 1;

  RETURN v_workspace_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE workspace_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace service areas" ON workspace_service_areas
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace score history" ON lead_score_history
  FOR ALL USING (
    lead_id IN (
      SELECT id FROM leads WHERE workspace_id IN (
        SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE geographic_regions IS 'US geographic regions for routing';
COMMENT ON TABLE workspace_service_areas IS 'Specific service areas per workspace';
COMMENT ON TABLE lead_scoring_rules IS 'Rules for calculating lead scores';
COMMENT ON TABLE lead_score_history IS 'Historical record of score changes';
COMMENT ON FUNCTION calculate_lead_score IS 'Calculate and update lead score based on rules';
COMMENT ON FUNCTION find_best_workspace_for_lead IS 'Find the best workspace match for a lead';
