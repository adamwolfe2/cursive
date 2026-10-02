-- SECURITY: SECURITY DEFINER functions that take a workspace/user id from the caller and never check
-- auth.uid() were executable by every logged-in user, so any user could read or change another workspace's
-- data by calling them directly through PostgREST. Verified 2026-10-02: none is used in an RLS policy; the
-- only nested callers are other definer functions (run as owner); app callers use the service role
-- (api/leads/bulk switched to it in this change; dead callers of get_leads_by_intent_score and
-- update_source_stats removed). Functions that do check auth.uid()/auth.role() are left alone.
do $$
declare f regprocedure;
begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef and p.proname in (
      'bulk_add_tags','bulk_assign_leads','bulk_remove_tags','bulk_update_lead_status',
      'can_create_query','can_create_saved_search','can_workspace_fetch_leads','check_lead_duplicate',
      'find_similar_leads','get_billing_summary','get_leads_by_intent_score','get_user_plan_limits',
      'get_workspace_daily_lead_limit','get_workspace_daily_lead_usage','get_workspace_features',
      'get_workspace_monthly_lead_usage','increment_cache_hit','is_admin','is_approved_partner',
      'is_platform_admin','update_source_stats','validate_partner_api_key','workspace_has_active_access')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
