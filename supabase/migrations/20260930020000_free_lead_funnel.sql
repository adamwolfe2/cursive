-- Free-leads funnel: one row per anonymous /start session (from the first paste), one row per step.
-- Server-only: RLS on, no policies (service role via /api/start/* and admin routes).
create table if not exists public.free_lead_sessions (
  id uuid primary key,                       -- client-generated (localStorage), validated as uuid
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ip_hash text,
  website text,
  domain text,
  icp jsonb,
  total integer,
  attribution jsonb not null default '{}'::jsonb,  -- utm_*, ref, referrer, landing (first touch)
  email text,                                -- from "Email me this profile" or the claim
  claim_id uuid references public.free_lead_claims(id) on delete set null,
  last_step text
);
create index if not exists free_lead_sessions_created_idx on public.free_lead_sessions (created_at desc);
create index if not exists free_lead_sessions_claim_idx on public.free_lead_sessions (claim_id);

create table if not exists public.free_lead_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.free_lead_sessions(id) on delete cascade,
  step text not null,
  created_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb      -- e.g. { usd, credits, cached, model }
);
create index if not exists free_lead_events_step_created_idx on public.free_lead_events (step, created_at desc);
create index if not exists free_lead_events_session_idx on public.free_lead_events (session_id, created_at);

alter table public.free_lead_claims add column if not exists session_id uuid;

alter table public.free_lead_sessions enable row level security;
alter table public.free_lead_events enable row level security;
revoke all on public.free_lead_sessions from anon, authenticated;
revoke all on public.free_lead_events from anon, authenticated;
