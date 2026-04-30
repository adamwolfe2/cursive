/**
 * Lead Scoring System
 * Automatically score leads based on multiple factors
 * Score range: 0-100
 */

-- Add score column if not exists
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_factors JSONB DEFAULT '{}'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_calculated_at TIMESTAMPTZ;

-- Add verification status columns for scoring
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Create index on score for sorting
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(workspace_id, score DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_high_score ON leads(workspace_id, score DESC)
  WHERE score >= 80 AND deleted_at IS NULL;

-- Priority industries for scoring bonus
CREATE TABLE IF NOT EXISTS workspace_priority_industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  industry TEXT NOT NULL,
  score_bonus INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, industry)
);

CREATE INDEX idx_priority_industries_workspace ON workspace_priority_industries(workspace_id);

-- Lead scoring function
CREATE OR REPLACE FUNCTION calculate_lead_score(
  p_lead_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_lead RECORD;
  v_score INTEGER := 0;
  v_factors JSONB := '{}'::jsonb;
  v_priority_bonus INTEGER := 0;
BEGIN
  -- Fetch lead data
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Factor 1: Email Deliverability (max 25 points)
  IF v_lead.email_verified THEN
    v_score := v_score + 25;
    v_factors := jsonb_set(v_factors, '{email_verified}', '25'::jsonb);
  ELSIF v_lead.email IS NOT NULL AND v_lead.email LIKE '%@%' THEN
    v_score := v_score + 10;
    v_factors := jsonb_set(v_factors, '{email_present}', '10'::jsonb);
  END IF;

  -- Factor 2: Phone Deliverability (max 15 points)
  IF v_lead.phone_verified THEN
    v_score := v_score + 15;
    v_factors := jsonb_set(v_factors, '{phone_verified}', '15'::jsonb);
  ELSIF v_lead.phone IS NOT NULL THEN
    v_score := v_score + 7;
    v_factors := jsonb_set(v_factors, '{phone_present}', '7'::jsonb);
  END IF;

  -- Factor 3: Data Completeness (max 20 points)
  IF v_lead.company_name IS NOT NULL THEN
    v_score := v_score + 5;
  END IF;
  IF v_lead.job_title IS NOT NULL THEN
    v_score := v_score + 5;
  END IF;
  IF v_lead.linkedin_url IS NOT NULL THEN
    v_score := v_score + 5;
  END IF;
  IF v_lead.industry IS NOT NULL THEN
    v_score := v_score + 5;
  END IF;
  v_factors := jsonb_set(v_factors, '{completeness}',
    to_jsonb(CASE
      WHEN v_lead.company_name IS NOT NULL THEN 5 ELSE 0 END +
      CASE WHEN v_lead.job_title IS NOT NULL THEN 5 ELSE 0 END +
      CASE WHEN v_lead.linkedin_url IS NOT NULL THEN 5 ELSE 0 END +
      CASE WHEN v_lead.industry IS NOT NULL THEN 5 ELSE 0 END
    )
  );

  -- Factor 4: Firmographic Fit (max 20 points)
  -- Company size scoring
  IF v_lead.company_size IN ('201-500', '501-1000', '1001-5000') THEN
    v_score := v_score + 10;
    v_factors := jsonb_set(v_factors, '{company_size}', '10'::jsonb);
  ELSIF v_lead.company_size IN ('51-200', '5001+') THEN
    v_score := v_score + 5;
    v_factors := jsonb_set(v_factors, '{company_size}', '5'::jsonb);
  END IF;

  -- Industry match with workspace priorities
  SELECT COALESCE(score_bonus, 0) INTO v_priority_bonus
  FROM workspace_priority_industries
  WHERE workspace_id = v_lead.workspace_id
    AND industry = v_lead.industry
  LIMIT 1;

  IF v_priority_bonus > 0 THEN
    v_score := v_score + v_priority_bonus;
    v_factors := jsonb_set(v_factors, '{priority_industry}', to_jsonb(v_priority_bonus));
  END IF;

  -- Factor 5: Recency (max 20 points)
  -- Newer leads score higher
  DECLARE
    v_days_old INTEGER := EXTRACT(DAY FROM NOW() - v_lead.created_at);
    v_recency_score INTEGER;
  BEGIN
    v_recency_score := GREATEST(20 - v_days_old, 0);
    v_score := v_score + v_recency_score;
    v_factors := jsonb_set(v_factors, '{recency}', to_jsonb(v_recency_score));
  END;

  -- Factor 6: Source Quality (bonus points)
  IF v_lead.source = 'audiencelab_database' THEN
    v_score := v_score + 5;
    v_factors := jsonb_set(v_factors, '{source_bonus}', '5'::jsonb);
  ELSIF v_lead.source = 'audiencelab_pixel' AND v_lead.pages_viewed > 3 THEN
    v_score := v_score + 10;
    v_factors := jsonb_set(v_factors, '{high_engagement}', '10'::jsonb);
  END IF;

  -- Cap score at 100
  v_score := LEAST(v_score, 100);

  -- Update lead with new score
  UPDATE leads
  SET
    score = v_score,
    score_factors = v_factors,
    score_calculated_at = NOW()
  WHERE id = p_lead_id;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate score on insert/update
CREATE OR REPLACE FUNCTION trigger_calculate_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.score := calculate_lead_score(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only recalculate if relevant fields changed
DROP TRIGGER IF EXISTS trg_leads_auto_score ON leads;
CREATE TRIGGER trg_leads_auto_score
  AFTER INSERT OR UPDATE OF email, phone, company_name, job_title,
                                  industry, company_size, linkedin_url,
                                  email_verified, phone_verified
  ON leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_lead_score();

-- Batch recalculate scores for all leads
CREATE OR REPLACE FUNCTION recalculate_all_lead_scores(
  p_workspace_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_lead_id UUID;
BEGIN
  FOR v_lead_id IN
    SELECT id FROM leads
    WHERE (p_workspace_id IS NULL OR workspace_id = p_workspace_id)
      AND deleted_at IS NULL
  LOOP
    PERFORM calculate_lead_score(v_lead_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_lead_score TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_all_lead_scores TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON workspace_priority_industries TO authenticated;

-- Backfill scores for existing leads (run async)
-- SELECT recalculate_all_lead_scores();

COMMENT ON COLUMN leads.score IS 'Automated lead quality score (0-100) based on multiple factors';
COMMENT ON COLUMN leads.score_factors IS 'JSON breakdown of score components for transparency';
COMMENT ON FUNCTION calculate_lead_score IS 'Calculates quality score for a lead based on deliverability, completeness, fit, and recency';
