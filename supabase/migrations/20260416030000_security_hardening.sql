-- Phase 7 security hardening — addresses Supabase advisor findings for
-- objects introduced by this codebase. External findings (extensions in
-- public schema, leaked password protection toggle, etc.) are Supabase
-- project-level configuration and handled separately.

-- -----------------------------------------------------------------------
-- 1. Pin search_path on update_onboarding_updated_at
-- -----------------------------------------------------------------------
-- A function with a mutable search_path is vulnerable to privilege
-- escalation: a malicious schema could shadow pg_catalog functions and
-- hijack execution. Pin to public, pg_catalog so the trigger always
-- resolves names from known-safe schemas.

create or replace function public.update_onboarding_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Belt and suspenders — revoke PUBLIC/anon execute on the trigger
-- function (triggers always run as the row owner; no one needs direct
-- EXECUTE on a trigger function).
revoke execute on function public.update_onboarding_updated_at() from public;
revoke execute on function public.update_onboarding_updated_at() from anon;

-- -----------------------------------------------------------------------
-- 2. Tighten anon INSERT on client_files
-- -----------------------------------------------------------------------
-- The current policy is WITH CHECK (true) — an attacker with anon access
-- could insert arbitrary rows (including linking to a real client_id)
-- and write to storage via the public upload policy. We can't verify
-- the client owns the row from anon (no auth identity), but we can at
-- minimum enforce shape: file_type must be one of the allowed types
-- (the column already has a CHECK constraint, but RLS adds defense in
-- depth when paired with the storage bucket's MIME allowlist), and
-- storage_path must start with 'client-uploads/' to prevent cross-bucket
-- path spoofing.

drop policy if exists "anon_insert_client_files" on public.client_files;

create policy "anon_insert_client_files" on public.client_files
  for insert to anon
  with check (
    file_type in (
      'brand_guidelines',
      'deck',
      'testimonials',
      'sample_offers',
      'examples',
      'existing_list',
      'suppression_list'
    )
    and storage_path is not null
    and length(storage_path) < 500
    and storage_path like 'client-uploads/%'
    and length(file_name) < 300
    and file_size is not null
    and file_size > 0
    and file_size <= 26214400  -- 25 MB
  );

-- -----------------------------------------------------------------------
-- 3. Enable RLS on toolkit_voice_waitlist
-- -----------------------------------------------------------------------
-- Advisor flagged RLS disabled on this public table. We can't know the
-- intended policy without owner context, but disabled RLS on a public
-- table is an ERROR — enable it and add a restrictive default policy
-- so any access pattern must be explicitly granted by a later migration.

do $$
begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'toolkit_voice_waitlist'
      and n.nspname = 'public'
      and c.relkind = 'r'
  ) then
    execute 'alter table public.toolkit_voice_waitlist enable row level security';

    -- Drop any existing policies to avoid stale grants
    -- (none expected since advisor says RLS was disabled)
    -- Leaving writes open to anon for lead capture (matches other waitlist
    -- tables in this codebase) but requires admin for SELECT.
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'toolkit_voice_waitlist'
        and policyname = 'anon_insert_waitlist'
    ) then
      create policy "anon_insert_waitlist" on public.toolkit_voice_waitlist
        for insert to anon
        with check (true);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'toolkit_voice_waitlist'
        and policyname = 'admin_select_waitlist'
    ) then
      create policy "admin_select_waitlist" on public.toolkit_voice_waitlist
        for select to authenticated
        using (
          exists (
            select 1 from public.users
            where users.auth_user_id = auth.uid()
            and users.role in ('owner', 'admin')
          )
        );
    end if;
  end if;
end $$;
