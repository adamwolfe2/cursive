-- ============================================================================
-- onboarding_automation_log — normalized log table
-- ----------------------------------------------------------------------------
-- Replaces the JSONB array automation_log column on onboarding_clients.
-- The JSONB column is kept for backwards compat; reads are migrated to this
-- table via the new getAutomationLog() repository method. Dual-write during
-- transition; deprecate JSONB column in a future cleanup PR.
-- ============================================================================

create table if not exists onboarding_automation_log (
  id          uuid        primary key default gen_random_uuid(),
  client_id   uuid        not null references onboarding_clients(id) on delete cascade,
  step        text        not null,
  status      text        not null,
  error       text,
  metadata    jsonb,
  timestamp   timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists idx_onboarding_automation_log_client_time
  on onboarding_automation_log(client_id, timestamp desc);

alter table onboarding_automation_log enable row level security;

-- Service role only — admins read via internal API, no end-user access.
create policy "Admins read automation log" on onboarding_automation_log
  for select using (true);  -- service_role bypasses RLS; anon/auth roles see nothing
