-- Weekly leads for free-leads workspaces that subscribed (funnel_orders bound via /api/start/checkout).
-- One row per order per ISO week: the unique key is the lock that stops a retried or overlapping
-- run from buying a second batch. offset_end is the cursor so each week pulls past earlier people.
-- Server-only: RLS on, no policies (service role from the Inngest job).
create table if not exists public.free_lead_weekly_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.funnel_orders(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  week text not null,
  status text not null default 'started' check (status in ('started', 'delivered', 'failed')),
  offset_start integer not null check (offset_start >= 0),
  offset_end integer check (offset_end >= offset_start),
  leads integer,
  credits integer,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  unique (order_id, week)
);
create index if not exists free_lead_weekly_deliveries_order_idx
  on public.free_lead_weekly_deliveries (order_id, created_at desc);
alter table public.free_lead_weekly_deliveries enable row level security;
revoke all on public.free_lead_weekly_deliveries from anon, authenticated;
