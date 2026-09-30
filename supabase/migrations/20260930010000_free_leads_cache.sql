-- Shared cache for the public free-leads flow (scan results per domain, match counts and
-- preview contacts per filter hash). Server-only: RLS on, no policies (service role via
-- /api/start/* routes). Replaces per-instance in-memory caches so every instance shares hits.
create table if not exists public.free_leads_cache (
  key text primary key,
  value jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists free_leads_cache_expires_idx on public.free_leads_cache (expires_at);
alter table public.free_leads_cache enable row level security;
revoke all on public.free_leads_cache from anon, authenticated;
