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
 * fastAuth() makes only 1 call (JWT verify) and reads workspaceId from the
 * x-workspace-id cookie that middleware already set. Use this for read-heavy
 * routes like /api/visitors, /api/leads, /api/analytics.
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
 * Authenticate in 1 network call instead of 3.
 * Returns null if JWT is invalid or workspace cookie is missing.
 */
export async function fastAuth(request: NextRequest): Promise<FastAuthUser | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Middleware sets x-workspace-id after verifying auth — read from cookie
  const workspaceId = request.cookies.get('x-workspace-id')?.value

  if (!workspaceId) return null

  return {
    userId: user.id,
    workspaceId,
    email: user.email,
  }
}
