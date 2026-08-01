-- ============================================================================
-- SECURITY DEFINER RPC grant lockdown
-- ============================================================================
-- ⚠️  NOT APPLIED. Written during an unattended hardening pass; a human must
--     review and apply this. See AUTONOMOUS_IMPROVEMENT_LOG.md.
--
-- PROBLEM
-- -------
-- Supabase grants EXECUTE on new public-schema functions to `anon` and
-- `authenticated` by default, and exposes them at /rest/v1/rpc/<name>. Every
-- function below is SECURITY DEFINER — so it bypasses RLS — and takes the
-- thing it authorizes on (workspace id, actor id, beneficiary id) as a plain
-- ARGUMENT rather than deriving it from auth.uid().
--
-- The API routes that call these functions DO scope them correctly. That
-- scoping is advisory: a caller with the public anon key and their own JWT can
-- invoke the same function directly and pass whatever arguments they like.
--
-- The 2026-02-12 sweep (archive/20260212_hardening_audit.sql) revoked a batch
-- of these, but every function added since has re-inherited the default grant.
-- Nothing has stopped the drift.
--
-- BEFORE APPLYING — confirm the exposure is real on this database:
--
--   SELECT p.proname, p.proacl
--   FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
--   WHERE n.nspname = 'public' AND p.proname IN (
--     'create_team_invite','accept_team_invite','update_user_role',
--     'remove_user_from_workspace','bulk_update_lead_status','bulk_assign_leads',
--     'bulk_add_tags','bulk_remove_tags','process_partner_payout',
--     'increment_partner_earnings','affiliate_add_earnings',
--     'increment_al_quota','get_al_quota_today');
--
-- If `authenticated=X` appears in proacl, that function is reachable.
--
-- SAFETY: every function below is only ever called server-side, from a route
-- using the service-role or SSR client. Revoking from anon/authenticated should
-- therefore change no application behaviour. Verify that claim against your own
-- call sites before applying — if any client calls one of these directly from
-- the browser, that call will start failing.
--
-- Apply via the dashboard SQL editor, or:
--   psql "postgresql://postgres:[DB_PASSWORD]@db.lrbftjspiiakfnydxbgk.supabase.co:5432/postgres" \
--     -f supabase/migrations/20260731000000_rpc_grant_lockdown.sql
-- ============================================================================

-- ─── 1. Team membership — cross-tenant workspace takeover ────────────────────
-- create_team_invite performs NO authorization at all: it never checks that
-- p_invited_by exists, is an owner/admin, or belongs to p_workspace_id. An
-- attacker who knows a victim workspace UUID can mint themselves an 'owner'
-- invite and then accept it — accept_team_invite runs
-- `UPDATE users SET workspace_id = <victim>, role = 'owner'`.
REVOKE EXECUTE ON FUNCTION create_team_invite(UUID, TEXT, user_role, UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION create_team_invite(UUID, TEXT, user_role, UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION accept_team_invite(TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION accept_team_invite(TEXT, UUID) TO service_role;

-- ─── 2. Role mutation — attacker supplies the actor identity ─────────────────
-- Both authorize against the CALLER-SUPPLIED p_updated_by / p_removed_by.
-- Passing the victim workspace's own owner id satisfies every guard.
-- remove_user_from_workspace ends in `DELETE FROM users WHERE id = p_user_id`.
REVOKE EXECUTE ON FUNCTION update_user_role(UUID, user_role, UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION update_user_role(UUID, user_role, UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION remove_user_from_workspace(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION remove_user_from_workspace(UUID, UUID) TO service_role;

-- ─── 3. Bulk lead mutation — tenant scope is a parameter ─────────────────────
-- Added 2026-03-02, after the hardening sweep, so never revoked. The migration
-- header states the isolation model outright: "The API routes call these
-- functions WITH p_workspace_id (for isolation)".
-- NOTE: bulk_update_lead_status / bulk_assign_leads / bulk_add_tags /
-- bulk_remove_tags each have TWO overloads (an older signature without
-- p_workspace_id). Both are revoked below — drop the older ones separately if
-- they are confirmed dead.
REVOKE EXECUTE ON FUNCTION bulk_update_lead_status(UUID[], TEXT, UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION bulk_update_lead_status(UUID[], TEXT, UUID, UUID, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION bulk_assign_leads(UUID[], UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION bulk_assign_leads(UUID[], UUID, UUID, UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION bulk_add_tags(UUID[], UUID[], UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION bulk_add_tags(UUID[], UUID[], UUID, UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION bulk_remove_tags(UUID[], UUID[], UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION bulk_remove_tags(UUID[], UUID[], UUID) TO service_role;

-- Older overloads (pre-workspace-scoping). Guarded so this migration does not
-- fail if they were already dropped.
DO $$
BEGIN
  EXECUTE 'REVOKE EXECUTE ON FUNCTION bulk_update_lead_status(UUID[], lead_status, UUID, TEXT) FROM PUBLIC, anon, authenticated';
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'REVOKE EXECUTE ON FUNCTION bulk_assign_leads(UUID[], UUID, UUID) FROM PUBLIC, anon, authenticated';
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'REVOKE EXECUTE ON FUNCTION bulk_add_tags(UUID[], UUID[], UUID) FROM PUBLIC, anon, authenticated';
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'REVOKE EXECUTE ON FUNCTION bulk_remove_tags(UUID[], UUID[]) FROM PUBLIC, anon, authenticated';
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

-- ─── 4. Money movement — beneficiary is a parameter, caller unchecked ────────
-- affiliate_add_earnings is a bare `UPDATE affiliates SET total_earnings = ...`.
-- An authenticated affiliate can inflate their own balance and then request a
-- payout through the legitimate route, which validates against the forged value.
REVOKE EXECUTE ON FUNCTION process_partner_payout(UUID, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION process_partner_payout(UUID, NUMERIC) TO service_role;

REVOKE EXECUTE ON FUNCTION increment_partner_earnings(UUID, DECIMAL) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION increment_partner_earnings(UUID, DECIMAL) TO service_role;

REVOKE EXECUTE ON FUNCTION affiliate_add_earnings(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION affiliate_add_earnings(UUID, INTEGER) TO service_role;

-- ─── 5. Quota / metering — burn a competitor's daily allowance ───────────────
-- p_count is a plain INTEGER with no sign check, so it can also be used to
-- deflate the caller's own counter.
REVOKE EXECUTE ON FUNCTION increment_al_quota(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION increment_al_quota(UUID, INTEGER) TO service_role;

REVOKE EXECUTE ON FUNCTION get_al_quota_today(UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_al_quota_today(UUID) TO service_role;

-- ─── 6. Pin search_path on the SECURITY DEFINER functions missing it ─────────
-- Standard hardening: without a pinned search_path a SECURITY DEFINER function
-- can be steered to attacker-controlled objects.
ALTER FUNCTION create_team_invite(UUID, TEXT, user_role, UUID)        SET search_path = public;
ALTER FUNCTION accept_team_invite(TEXT, UUID)                          SET search_path = public;
ALTER FUNCTION update_user_role(UUID, user_role, UUID)                 SET search_path = public;
ALTER FUNCTION remove_user_from_workspace(UUID, UUID)                  SET search_path = public;
ALTER FUNCTION process_partner_payout(UUID, NUMERIC)                   SET search_path = public;
ALTER FUNCTION increment_partner_earnings(UUID, DECIMAL)               SET search_path = public;
ALTER FUNCTION increment_al_quota(UUID, INTEGER)                       SET search_path = public;
ALTER FUNCTION get_al_quota_today(UUID)                                SET search_path = public;

-- ============================================================================
-- STILL OPEN after this migration — deliberately not included
-- ============================================================================
-- These read-only SECURITY DEFINER functions also take p_workspace_id with no
-- caller check, but they ARE called with the user's own workspace from
-- server-side services, so a blanket revoke needs each call site verified
-- first. The better fix is an in-function guard:
--
--   IF p_workspace_id <> (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
--      AND auth.role() <> 'service_role'
--   THEN RAISE EXCEPTION 'forbidden'; END IF;
--
--   leads_within_radius, get_leads_by_intent_score, get_billing_summary,
--   get_workspace_features, get_workspace_daily_lead_limit,
--   get_workspace_daily_lead_usage, get_workspace_monthly_lead_usage,
--   can_workspace_fetch_leads
--
-- RECOMMENDED FOLLOW-UP: add a CI assertion that no public function carries
-- anon=X / authenticated=X outside an explicit allowlist. The 2026-02-12 sweep
-- worked; nothing has prevented drift since.
-- ============================================================================
