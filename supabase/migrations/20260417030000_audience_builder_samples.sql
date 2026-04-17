-- Audience Builder — Phase 1+2+3: sample leads, reveal tiers, conversion tracking
--
-- New:
--   audience_builder_sample_views   — one row per sample fetch (AL API call)
--   audience_builder_conversions    — funnel event log
--
-- Extends audience_builder_leads with unlock_tier + qualifier + call + trial fields

-- -----------------------------------------------------------------------
-- 1. Extend leads with unlock-tier tracking
-- -----------------------------------------------------------------------
alter table public.audience_builder_leads
  add column if not exists unlock_tier integer default 0,
  add column if not exists qualifier_answers jsonb,
  add column if not exists call_booked_at timestamptz,
  add column if not exists trial_started_at timestamptz;

-- 0 = email-only (default after /start)
-- 1 = qualifier answered (BANT)
-- 2 = call booked via Cal.com
-- 3 = trial started (workspace signup via ?ref=audience-builder)
comment on column public.audience_builder_leads.unlock_tier is '0=email, 1=qualifier, 2=call_booked, 3=trial';

-- Re-issue anon insert policy — unlock_tier must default to 0
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
    and unlock_tier = 0
    and qualifier_answers is null
    and call_booked_at is null
    and trial_started_at is null
  );

-- -----------------------------------------------------------------------
-- 2. Sample views table
-- -----------------------------------------------------------------------
create table if not exists public.audience_builder_sample_views (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.audience_builder_leads(id) on delete cascade,
  session_id uuid references public.audience_builder_sessions(id) on delete set null,
  segment_pseudo_id text not null,    -- the hashed id shown to the client
  segment_real_id text not null,      -- AL segment id (server-side only, never exposed)
  sample_count integer default 0,      -- how many we pulled
  revealed_count integer default 3,    -- how many are fully unmasked (starts at 3)
  al_total_count integer,              -- what AL reported as total segment size
  al_cost_usd numeric default 0,
  ip_hash text,
  created_at timestamptz default now()
);

create index if not exists idx_audience_builder_sample_views_lead on public.audience_builder_sample_views (lead_id, created_at desc);
create index if not exists idx_audience_builder_sample_views_session on public.audience_builder_sample_views (session_id);
create index if not exists idx_audience_builder_sample_views_segment on public.audience_builder_sample_views (segment_real_id);
create index if not exists idx_audience_builder_sample_views_created on public.audience_builder_sample_views (created_at desc);

alter table public.audience_builder_sample_views enable row level security;

-- Admin SELECT, service role for writes
drop policy if exists "admin_select_audience_builder_sample_views" on public.audience_builder_sample_views;
create policy "admin_select_audience_builder_sample_views" on public.audience_builder_sample_views
  for select to authenticated
  using (
    exists (
      select 1 from public.users
      where users.auth_user_id = auth.uid()
      and users.role in ('owner', 'admin')
    )
  );

-- -----------------------------------------------------------------------
-- 3. Conversions / funnel log
-- -----------------------------------------------------------------------
create table if not exists public.audience_builder_conversions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.audience_builder_leads(id) on delete cascade,
  session_id uuid references public.audience_builder_sessions(id) on delete set null,
  event_type text not null check (event_type in (
    'preview_done',
    'email_captured',
    'segment_viewed',
    'sample_pulled',
    'reveal_gate_shown',
    'qualifier_submitted',
    'reveal_unlocked',
    'call_booked',
    'export_requested',
    'trial_started',
    'pixel_interest'
  )),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_audience_builder_conversions_lead on public.audience_builder_conversions (lead_id, created_at desc);
create index if not exists idx_audience_builder_conversions_event on public.audience_builder_conversions (event_type, created_at desc);
create index if not exists idx_audience_builder_conversions_created on public.audience_builder_conversions (created_at desc);

alter table public.audience_builder_conversions enable row level security;

drop policy if exists "admin_select_audience_builder_conversions" on public.audience_builder_conversions;
create policy "admin_select_audience_builder_conversions" on public.audience_builder_conversions
  for select to authenticated
  using (
    exists (
      select 1 from public.users
      where users.auth_user_id = auth.uid()
      and users.role in ('owner', 'admin')
    )
  );

-- -----------------------------------------------------------------------
-- 4. Rate-check RPCs
-- -----------------------------------------------------------------------

-- How many sample pulls has this lead done in last 24h? And per segment?
create or replace function public.audience_builder_sample_check(
  lead_id_filter uuid,
  segment_real_id_filter text default null
)
returns table (
  samples_today integer,
  samples_for_segment_today integer
)
language sql
stable
set search_path = public, pg_catalog
as $$
  select
    coalesce((
      select count(*)::integer
      from public.audience_builder_sample_views v
      where v.lead_id = lead_id_filter
      and v.created_at >= now() - interval '24 hours'
    ), 0) as samples_today,
    coalesce((
      select count(*)::integer
      from public.audience_builder_sample_views v
      where v.lead_id = lead_id_filter
      and v.segment_real_id = coalesce(segment_real_id_filter, '')
      and v.created_at >= now() - interval '24 hours'
    ), 0) as samples_for_segment_today;
$$;

revoke execute on function public.audience_builder_sample_check(uuid, text) from public;
revoke execute on function public.audience_builder_sample_check(uuid, text) from anon;

-- Quick admin summary: funnel counts for last N hours
create or replace function public.audience_builder_funnel_summary(
  hours_back integer default 24
)
returns table (
  event_type text,
  count bigint
)
language sql
stable
set search_path = public, pg_catalog
as $$
  select
    event_type,
    count(*)::bigint
  from public.audience_builder_conversions
  where created_at >= now() - (hours_back || ' hours')::interval
  group by event_type
  order by count(*) desc;
$$;

revoke execute on function public.audience_builder_funnel_summary(integer) from public;
revoke execute on function public.audience_builder_funnel_summary(integer) from anon;
