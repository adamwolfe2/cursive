-- Workspace nav feature flags.
--
-- `visible_features` is a strict allowlist of nav feature keys. When NULL or
-- empty, the workspace shows ALL nav items (existing behavior — keeps admin
-- and test workspaces untouched). When populated, ONLY the listed features
-- render in the sidebar, taking precedence over role/plan/adminOnly gating.
-- Funnel-tier buyers default to ['dashboard','leads','settings'].

alter table workspaces
  add column if not exists visible_features text[] default null;

comment on column workspaces.visible_features is
  'Allowlist of nav feature keys to show in the sidebar. NULL/empty = show all (default). Populated = strict allowlist, precedence over role/plan gating. Funnel buyers default to [dashboard, leads, settings].';
