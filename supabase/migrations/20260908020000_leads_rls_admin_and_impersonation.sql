-- Let platform admins and active impersonation sessions read leads.
--
-- The SELECT policy on leads only ever matched the caller's OWN workspace. Two
-- consequences, both of which looked like missing data rather than a permission
-- rule:
--   * The admin account "Usage" tab counts leads from the browser client, so it
--     showed 0 for every workspace except the admin's own.
--   * While impersonating, any client-side read of leads returned nothing, so
--     the customer's list looked empty.
--
-- This mirrors the shape already used by the workspaces SELECT policy:
-- own workspace OR platform admin OR the workspace being impersonated. Both
-- helpers are SECURITY DEFINER and do not recurse into leads.
--
-- No new capability: platform admins already read any workspace's leads through
-- the service-role admin API routes. This only lets the same person do it
-- through the request-scoped client.

DROP POLICY IF EXISTS "Users can view leads in their workspace" ON leads;

CREATE POLICY "Users can view leads in their workspace" ON leads
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT users.workspace_id FROM users
      WHERE users.auth_user_id = (SELECT auth.uid())
    )
    OR is_current_user_platform_admin()
    OR workspace_id = get_impersonated_workspace_id()
  );
