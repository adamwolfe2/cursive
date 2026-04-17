-- Audience Builder — Public lead-magnet copilot
-- Tables: audience_builder_leads (captured emails), audience_builder_sessions (chat sessions)
--
-- Note: table `public_copilot_leads` already exists for a different feature (AL sample pulls) —
-- we use `audience_builder_*` names here to avoid collision.

-- -----------------------------------------------------------------------
-- Leads
-- -----------------------------------------------------------------------
create table if not exists public.audience_builder_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text,
  company text,
  use_case text,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  ip_hash text,
  user_agent text,
  referrer text,
  total_sessions integer default 0,
  total_turns integer default 0,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  notified_at timestamptz,
  marked_qualified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_audience_builder_leads_email on public.audience_builder_leads (lower(email));
create index if not exists idx_audience_builder_leads_created on public.audience_builder_leads (created_at desc);

alter table public.audience_builder_leads enable row level security;

drop policy if exists "anon_insert_audience_builder_leads" on public.audience_builder_leads;
create policy "anon_insert_audience_builder_leads" on public.audience_builder_leads
  for insert to anon
  with check (
    email is not null
    and length(email) > 3
    and length(email) <= 320
    and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    and (first_name is null or length(first_name) <= 100)
    and (company is null or length(company) <= 200)
    and (use_case is null or length(use_case) <= 2000)
    and (source is null or length(source) <= 100)
    and total_sessions = 0
    and total_turns = 0
    and notified_at is null
    and marked_qualified_at is null
  );

drop policy if exists "admin_all_audience_builder_leads" on public.audience_builder_leads;
create policy "admin_all_audience_builder_leads" on public.audience_builder_leads
  for all to authenticated
  using (
    exists (
      select 1 from public.users
      where users.auth_user_id = auth.uid()
      and users.role in ('owner', 'admin')
    )
  );

-- -----------------------------------------------------------------------
-- Sessions
-- -----------------------------------------------------------------------
create table if not exists public.audience_builder_sessions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.audience_builder_leads(id) on delete cascade,
  email text not null,
  turn_count integer default 0,
  last_turn_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_audience_builder_sessions_lead on public.audience_builder_sessions (lead_id);
create index if not exists idx_audience_builder_sessions_email on public.audience_builder_sessions (email);
create index if not exists idx_audience_builder_sessions_created on public.audience_builder_sessions (created_at desc);

alter table public.audience_builder_sessions enable row level security;

-- Service role only — the API layer manages these, no direct anon access.
drop policy if exists "admin_all_audience_builder_sessions" on public.audience_builder_sessions;
create policy "admin_all_audience_builder_sessions" on public.audience_builder_sessions
  for all to authenticated
  using (
    exists (
      select 1 from public.users
      where users.auth_user_id = auth.uid()
      and users.role in ('owner', 'admin')
    )
  );

-- -----------------------------------------------------------------------
-- Updated_at trigger (reuses existing function)
-- -----------------------------------------------------------------------
drop trigger if exists audience_builder_leads_updated on public.audience_builder_leads;
create trigger audience_builder_leads_updated
  before update on public.audience_builder_leads
  for each row execute function public.update_onboarding_updated_at();

drop trigger if exists audience_builder_sessions_updated on public.audience_builder_sessions;
create trigger audience_builder_sessions_updated
  before update on public.audience_builder_sessions
  for each row execute function public.update_onboarding_updated_at();

-- -----------------------------------------------------------------------
-- Rate-limit helper
-- -----------------------------------------------------------------------
create or replace function public.audience_builder_rate_check(
  email_filter text,
  ip_hash_filter text default null
)
returns table (
  sessions_today integer,
  turns_today integer,
  ip_sessions_today integer
)
language sql
stable
set search_path = public, pg_catalog
as $$
  select
    coalesce((
      select count(*)::integer
      from public.audience_builder_sessions s
      where s.email = email_filter
      and s.created_at >= now() - interval '24 hours'
    ), 0) as sessions_today,
    coalesce((
      select sum(turn_count)::integer
      from public.audience_builder_sessions s
      where s.email = email_filter
      and s.created_at >= now() - interval '24 hours'
    ), 0) as turns_today,
    coalesce((
      select count(distinct s.id)::integer
      from public.audience_builder_sessions s
      join public.audience_builder_leads l on l.id = s.lead_id
      where ip_hash_filter is not null
      and l.ip_hash = ip_hash_filter
      and s.created_at >= now() - interval '24 hours'
    ), 0) as ip_sessions_today;
$$;

revoke execute on function public.audience_builder_rate_check(text, text) from public;
revoke execute on function public.audience_builder_rate_check(text, text) from anon;
