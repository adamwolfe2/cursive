-- SECURITY (verified in prod 2026-10-02 after 20261002000000): 17 more SECURITY DEFINER functions were executable by
-- anon, none check auth.uid(). Callers checked in src/:
--   service-role only (or no callers / trigger): affiliate_*, increment_user_targeting_counts, reseller_*,
--     refresh_workspace_stats, get_visitor_stats, cursive_am_stats, purchase_marketplace_leads -> service_role only.
--   user client (api/leads/bulk, api/leads/ingest): bulk_*, update_source_stats -> keep authenticated, drop anon.
--     Follow-up: those still trust the caller's p_workspace_id; move the calls to the admin client after the
--     route's own workspace check, then revoke authenticated too.
-- onboarding_automation_log: SELECT policy `using (true)` for role public let anon read it; only the service role
-- reads it (onboarding-client.repository.ts), and service_role bypasses RLS.

do $$
declare f regprocedure;
begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'affiliate_add_earnings','affiliate_churn_referral','affiliate_mark_paying','affiliate_record_churn',
      'affiliate_reject_self_referral','increment_user_targeting_counts','reseller_consume_delivery',
      'reseller_record_delivery','refresh_workspace_stats','get_visitor_stats','cursive_am_stats',
      'purchase_marketplace_leads')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;

  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'bulk_add_tags','bulk_assign_leads','bulk_remove_tags','bulk_update_lead_status','update_source_stats')
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;

drop policy if exists "Admins read automation log" on public.onboarding_automation_log;
