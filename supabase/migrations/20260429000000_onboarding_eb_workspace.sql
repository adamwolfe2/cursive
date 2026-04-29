-- Add eb_workspace_id to onboarding_clients so we can target a specific
-- EmailBison workspace per client. Distinct from assigned_workspace_id
-- (the Cursive workspace UUID); eb_workspace_id is EmailBison's own
-- integer workspace identifier.
alter table onboarding_clients
  add column if not exists eb_workspace_id integer;

create index if not exists idx_onboarding_clients_eb_workspace
  on onboarding_clients(eb_workspace_id)
  where eb_workspace_id is not null;
