-- Make the AL daily quota report-only until a real limit is agreed.
--
-- 20260327000000_al_quota_usage.sql had never been applied to production, so
-- al_quota_usage / increment_al_quota / get_al_quota_today did not exist and
-- checkQuota() failed open — the cap was NEVER enforced in production.
--
-- Applying that migration switched a 1,000 leads/workspace/day cap on for the
-- first time. Workspaces above that volume immediately started having real
-- leads rejected and written off as error='quota_exhausted' (1,250 events in
-- the first hour on one workspace alone).
--
-- Usage still accrues through increment_al_quota, so consumption stays
-- measurable and the data needed to choose a real limit keeps accumulating.
-- get_al_quota_today reports 0 so nothing is blocked, restoring the behaviour
-- that existed before today.
--
-- TO RE-ENABLE: restore the body below to the SELECT from al_quota_usage in
-- 20260327000000_al_quota_usage.sql, and set AL_DAILY_QUOTA_PER_WORKSPACE to a
-- limit chosen from observed usage rather than the 1,000 default.

CREATE OR REPLACE FUNCTION get_al_quota_today(p_workspace_id UUID)
RETURNS INTEGER AS $$
BEGIN
  -- Report-only: usage is still recorded by increment_al_quota, but consumption
  -- is reported as 0 so checkQuota() never rejects a lead.
  PERFORM p_workspace_id;
  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION get_al_quota_today(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_al_quota_today(UUID) TO service_role;
