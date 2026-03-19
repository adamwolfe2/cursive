/**
 * Fast Auth Helper
 *
 * A lightweight alternative to getCurrentUser() for high-traffic API routes
 * that only need userId + workspaceId.
 *
 * getCurrentUser() makes 3 sequential network calls:
 *   1. supabase.auth.getUser() — JWT verify
 *   2. users table query — fetch user row
 *   3. audiencelab_pixels query — fetch pixel row
 *
 * fastAuth() makes 2 calls: JWT verify + workspace membership verification.
 * The workspace membership check prevents IDOR attacks where an attacker
 * modifies the x-workspace-id cookie to access another workspace's data.
 *
 * IMPORTANT: Only use fastAuth() when you only need userId + workspaceId + email.
 * Use getCurrentUser() when you need plan, credits, trial status, or role data.
 */

import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface FastAuthUser {
  userId: string
  workspaceId: string
  email: string | undefined
}

/**
 * Authenticate and verify workspace membership.
 * Returns null if JWT is invalid, workspace cookie is missing, or user
 * does not belong to the claimed workspace.
 *
 * SECURITY: Always verifies that the authenticated user's workspace_id
 * matches the cookie value. Never trusts the cookie alone.
 */
export async function fastAuth(request: NextRequest): Promise<FastAuthUser | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Read workspace ID from cookie (set by middleware)
  const workspaceId = request.cookies.get('x-workspace-id')?.value

  if (!workspaceId) return null

  // SECURITY: Verify the authenticated user actually belongs to this workspace.
  // This prevents IDOR attacks where an attacker modifies the cookie to access
  // another workspace's data. The query uses RLS-respecting client (anon key),
  // so the user can only see their own record.
  const { data: userRecord } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('auth_user_id', user.id)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!userRecord) return null

  return {
    userId: user.id,
    workspaceId: userRecord.workspace_id,
    email: user.email,
  }
}
