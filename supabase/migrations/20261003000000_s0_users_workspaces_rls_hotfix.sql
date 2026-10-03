-- S0 security hotfix: users/workspaces privilege escalation (lean decision doc S0 + section c)
--
-- Problem (verified read-only against live lrbftjspiiakfnydxbgk, 2026-10-03):
--   * authenticated holds table-level INSERT/UPDATE on public.users and public.workspaces.
--   * "Users can update own profile" has no WITH CHECK, "Users can insert own profile" lets a
--     client insert a users row with any role/workspace_id. Any signed-in visitor can set
--     users.role / users.workspace_id and become owner of any workspace.
--   * workspaces: any member can UPDATE settings (settings.source gates the free weekly
--     delivery), visible_features, has_*_access, is_white_label, etc.
--
-- Fix: column-level grants (service role is unaffected), WITH CHECK on update policies,
-- drop client INSERT paths. All server code that writes privileged columns uses the
-- service-role client.
--
-- Already fixed live (no-op here, kept idempotent): execute_nl_query dropped, partner/credit
-- RPCs absent or service_role-only, onboarding_automation_log has no select-true policy.
--
-- Rollback: see PR description (restores table-level grants and the dropped policies).

begin;

-- ---------------------------------------------------------------- users
revoke insert, update on table public.users from anon, authenticated, public;
grant update (full_name, avatar_url, updated_at) on table public.users to authenticated;

drop policy if exists "Users can insert own profile" on public.users;

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile" on public.users
  for update
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

drop policy if exists "Admins can update members" on public.users;
create policy "Admins can update members" on public.users
  for update
  using (
    workspace_id = get_user_workspace_id()
    and exists (
      select 1 from public.users u
      where u.auth_user_id = (select auth.uid())
        and u.role = any (array['owner'::user_role, 'admin'::user_role])
        and u.workspace_id = get_user_workspace_id()
    )
  )
  with check (workspace_id = get_user_workspace_id());

-- ----------------------------------------------------------- workspaces
revoke insert, update on table public.workspaces from anon, authenticated, public;
grant update (
  name, branding, logo_url, website_url, company_size, annual_revenue, industry_vertical,
  company_enrichment_data, billing_email, billing_address, has_seen_first_enrichment,
  target_industries, target_locations, target_company_sizes, webhook_endpoints, updated_at
) on table public.workspaces to authenticated;

drop policy if exists "Authenticated users can create workspace" on public.workspaces;

drop policy if exists workspace_update on public.workspaces;
create policy workspace_update on public.workspaces
  for update
  using (id in (select workspace_id from public.users where auth_user_id = (select auth.uid())))
  with check (id in (select workspace_id from public.users where auth_user_id = (select auth.uid())));

-- ---------------------------------------------------- privileged functions
do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in (
        'execute_nl_query', 'increment_partner_earnings', 'process_partner_payout',
        'credit_partner_for_sale', 'request_partner_payout', 'increment_credits',
        'update_user_role'
      )
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', fn.sig);
    execute format('grant execute on function %s to service_role', fn.sig);
  end loop;
end
$$;

-- ------------------------------------------- onboarding_automation_log
do $$
declare
  pol record;
begin
  if to_regclass('public.onboarding_automation_log') is not null then
    for pol in
      select polname from pg_policy
      where polrelid = 'public.onboarding_automation_log'::regclass
        and polcmd in ('r', '*')
        and pg_get_expr(polqual, polrelid) = 'true'
    loop
      execute format('drop policy %I on public.onboarding_automation_log', pol.polname);
    end loop;
  end if;
end
$$;

commit;
