-- Onboarding workspace assignment + test-client flag
--
-- Adds two columns to onboarding_clients:
--   1. assigned_workspace_id — admin picks which Cursive workspace this client
--      will be associated with. Determines which email_accounts are attached
--      when EmailBison campaigns are created. Null = use existing onboarding
--      fallback (all connected senders).
--   2. is_test_client — when true, the EmailBison push runs in dry-run mode:
--      no real API calls, fake campaign IDs. Lets us preview the full
--      approval -> push -> activation flow without polluting production.

alter table onboarding_clients
  add column if not exists assigned_workspace_id uuid references workspaces(id) on delete set null,
  add column if not exists is_test_client boolean not null default false;

create index if not exists idx_onboarding_clients_assigned_workspace
  on onboarding_clients(assigned_workspace_id)
  where assigned_workspace_id is not null;
