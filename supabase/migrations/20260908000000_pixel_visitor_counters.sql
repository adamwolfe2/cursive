-- Migration: maintain pixel visitor counters + lock down AL quota RPC grants
--
-- audiencelab_pixels.visitor_count_total / visitor_count_identified are read by
-- the dashboard, the pixel status API, the pixel settings page, the admin pixel
-- table and the trial drip emails — but no code path ever wrote them, so they
-- were 0 for every workspace.
--
-- The counters are keyed by workspace_id, NOT pixel_id: the pixel_id carried in
-- SuperPixel webhook events comes from a different namespace than the AL
-- pixel-registry id we store at provisioning (verified against AL's /pixels
-- list), so the two can never be joined. The workspace id arrives on the
-- webhook URL (?ws=) and is the only identifier reliable at ingest time.

CREATE OR REPLACE FUNCTION increment_pixel_visitor_counts(
  p_workspace_id UUID,
  p_events INTEGER DEFAULT 1,
  p_identified INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE audiencelab_pixels
  SET visitor_count_total      = COALESCE(visitor_count_total, 0) + p_events,
      visitor_count_identified = COALESCE(visitor_count_identified, 0) + p_identified,
      updated_at               = NOW()
  WHERE workspace_id = p_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_pixel_visitor_counts(UUID, INTEGER, INTEGER) IS
  'Atomically bump a workspace pixel visitor counters. Server-side only.';

-- These functions are SECURITY DEFINER and take the workspace id as an argument,
-- so a caller could bump another tenant counters/quota if the default PUBLIC
-- execute grant were left in place. They are only ever called by the service
-- role from server code.
REVOKE ALL ON FUNCTION increment_pixel_visitor_counts(UUID, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION increment_al_quota(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION get_al_quota_today(UUID) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION increment_pixel_visitor_counts(UUID, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION increment_al_quota(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_al_quota_today(UUID) TO service_role;
