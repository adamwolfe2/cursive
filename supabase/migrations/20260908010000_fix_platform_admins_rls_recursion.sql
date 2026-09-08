-- Fix infinite recursion in the platform_admins RLS policy.
--
-- The SELECT policy on platform_admins was itself a subquery over
-- platform_admins, so Postgres raised
--   42P17: infinite recursion detected in policy for relation "platform_admins"
-- on every read through a user-scoped (anon/authenticated) client.
--
-- Effect: getCurrentAdmin() and requirePlatformAdmin() both read platform_admins
-- with the request-scoped client, so both failed for genuine admins. Admin
-- impersonation ("Switch Into Account") returned "Failed to start impersonation"
-- every time, and any other route relying on that read was equally dead.
--
-- is_current_user_platform_admin() answers the same question without recursing:
-- it is SECURITY DEFINER owned by postgres, which owns the table and does not
-- have FORCE ROW LEVEL SECURITY, so the lookup inside it bypasses RLS. The
-- policies on workspaces and super_admin_sessions already use it.

DROP POLICY IF EXISTS "Admins can view admin list" ON platform_admins;

CREATE POLICY "Admins can view admin list" ON platform_admins
  FOR SELECT
  USING (is_current_user_platform_admin());
