-- Audience Builder: preview-first flow
-- - Add last_name + username columns to audience_builder_leads
-- - Add audience_builder_previews table for IP-rate-limited unauthenticated previews
-- - Add audience_builder_preview_check RPC

-- -----------------------------------------------------------------------
-- 1. Extend audience_builder_leads with last_name + username
-- -----------------------------------------------------------------------
alter table public.audience_builder_leads
  add column if not exists last_name text,
  add column if not exists username text;

-- Re-declare the anon insert policy to include the new optional columns
drop policy if exists "anon_insert_audience_builder_leads" on public.audience_builder_leads;
create policy "anon_insert_audience_builder_leads" on public.audience_builder_leads
  for insert to anon
  with check (
    email is not null
    and length(email) > 3
    and length(email) <= 320
    and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    and (first_name is null or length(first_name) <= 100)
    and (last_name is null or length(last_name) <= 100)
    and (username is null or length(username) <= 100)
    and (company is null or length(company) <= 200)
    and (use_case is null or length(use_case) <= 2000)
    and (source is null or length(source) <= 100)
    and total_sessions = 0
    and total_turns = 0
    and notified_at is null
    and marked_qualified_at is null
  );

-- -----------------------------------------------------------------------
-- 2. Preview tracking table (unauthenticated searches pre-email)
-- -----------------------------------------------------------------------
create table if not exists public.audience_builder_previews (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  user_agent text,
  query text not null,
  segment_count integer default 0,
  cost_usd numeric default 0,
  converted_lead_id uuid references public.audience_builder_leads(id) on delete set null,
  converted_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_audience_builder_previews_ip on public.audience_builder_previews (ip_hash, created_at desc);
create index if not exists idx_audience_builder_previews_created on public.audience_builder_previews (created_at desc);
create index if not exists idx_audience_builder_previews_converted on public.audience_builder_previews (converted_lead_id) where converted_lead_id is not null;

alter table public.audience_builder_previews enable row level security;

-- Admin SELECT only
drop policy if exists "admin_select_audience_builder_previews" on public.audience_builder_previews;
create policy "admin_select_audience_builder_previews" on public.audience_builder_previews
  for select to authenticated
  using (
    exists (
      select 1 from public.users
      where users.auth_user_id = auth.uid()
      and users.role in ('owner', 'admin')
    )
  );

-- -----------------------------------------------------------------------
-- 3. Preview rate-check RPC — returns count of previews from IP today
-- -----------------------------------------------------------------------
create or replace function public.audience_builder_preview_check(
  ip_hash_filter text
)
returns integer
language sql
stable
set search_path = public, pg_catalog
as $$
  select coalesce(count(*)::integer, 0)
  from public.audience_builder_previews
  where ip_hash = ip_hash_filter
  and created_at >= now() - interval '24 hours';
$$;

revoke execute on function public.audience_builder_preview_check(text) from public;
revoke execute on function public.audience_builder_preview_check(text) from anon;
