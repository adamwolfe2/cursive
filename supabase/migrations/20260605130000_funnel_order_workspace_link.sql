-- Funnel → Dashboard integration (Phases 2 & 4).
--
-- Links a funnel order to its auto-provisioned dashboard workspace, and tracks
-- whether the buyer's AL audience has been pushed into that workspace's leads.

alter table funnel_orders
  add column if not exists workspace_id uuid references workspaces(id) on delete set null;

alter table funnel_orders
  add column if not exists audience_pushed_at timestamptz;

create index if not exists idx_funnel_orders_workspace on funnel_orders(workspace_id);

comment on column funnel_orders.workspace_id is
  'Auto-provisioned workspace for this funnel buyer (Phase 2). Links the order to the dashboard surface.';
comment on column funnel_orders.audience_pushed_at is
  'When the AL audience was pushed into the workspace leads table (Phase 4). Guards against double-push.';
