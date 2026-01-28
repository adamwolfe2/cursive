-- Migration: Fix freshness floor to 15 (per spec)
-- Previous: Floor was 5
-- New: Floor is 15

-- Recreate the freshness score function with correct floor default
CREATE OR REPLACE FUNCTION calculate_freshness_score(
  p_created_at TIMESTAMPTZ,
  p_max_score INTEGER DEFAULT 100,
  p_midpoint INTEGER DEFAULT 30,
  p_steepness NUMERIC DEFAULT 0.15,
  p_floor INTEGER DEFAULT 15  -- Changed from 5 to 15
)
RETURNS INTEGER AS $$
DECLARE
  v_days_old NUMERIC;
  v_score NUMERIC;
BEGIN
  -- Calculate days since creation
  v_days_old := EXTRACT(EPOCH FROM (NOW() - p_created_at)) / 86400.0;

  -- Sigmoid decay formula
  -- score = max_score / (1 + e^(steepness * (days - midpoint)))
  v_score := p_max_score / (1 + EXP(p_steepness * (v_days_old - p_midpoint)));

  -- Apply floor
  v_score := GREATEST(v_score, p_floor);

  RETURN ROUND(v_score)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comment for documentation
COMMENT ON FUNCTION calculate_freshness_score IS
'Calculates lead freshness score using sigmoid decay.
Day 0: ~100, Day 14: ~90, Day 30: ~50, Day 45: ~25, Day 60+: floor (15)
Floor changed from 5 to 15 per spec in migration 20260128110000.';

-- Update the batch freshness update function to use new default
CREATE OR REPLACE FUNCTION update_all_freshness_scores()
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Update freshness scores for all marketplace-listed leads
  UPDATE leads
  SET
    freshness_score = calculate_freshness_score(created_at),
    marketplace_price = calculate_lead_marketplace_price(
      intent_score_calculated,
      calculate_freshness_score(created_at),
      phone IS NOT NULL,
      COALESCE(verification_status, 'pending')::VARCHAR
    )
  WHERE is_marketplace_listed = true;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;
