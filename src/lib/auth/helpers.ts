// Authentication Helper Functions

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types'

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  // Development-only bypass for local testing
  if (process.env.NODE_ENV === 'development') {
    const cookieStore = await cookies()
    const hasAdminBypass = cookieStore.get('admin_bypass_waitlist')?.value === 'true'

    if (hasAdminBypass) {
      // Return mock admin user
      return {
        id: '00000000-0000-0000-0000-000000000000',
        auth_user_id: '00000000-0000-0000-0000-000000000000',
        email: 'adam@meetcursive.com',
        full_name: 'Admin (Bypass Mode)',
        role: 'owner',
        plan: 'pro',
        workspace_id: '00000000-0000-0000-0000-000000000000',
        daily_credit_limit: 10000,
        daily_credits_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as User
    }
  }

  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const authUser = session?.user ?? null

  if (!authUser) {
    return null
  }

  // Get user profile from database
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .single()

  return user as User | null
}

/**
 * Get the current user's workspace ID
 * Returns null if not authenticated or no workspace
 */
export async function getCurrentWorkspaceId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.workspace_id ?? null
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: 'owner' | 'admin' | 'member'): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const roles = {
    owner: ['owner'],
    admin: ['owner', 'admin'],
    member: ['owner', 'admin', 'member'],
  }

  return roles[role].includes(user.role)
}

/**
 * Check if user has Pro plan
 */
export async function hasPro(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.plan === 'pro'
}

/**
 * Get user with workspace data
 */
export async function getUserWithWorkspace() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const authUser = session?.user ?? null

  if (!authUser) {
    return null
  }

  const { data: user } = await supabase
    .from('users')
    .select('*, workspaces(*)')
    .eq('auth_user_id', authUser.id)
    .single()

  return user
}

/**
 * Check if user has available credits
 */
export async function hasCreditsAvailable(creditsNeeded: number = 1): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  return (user.daily_credits_used + creditsNeeded) <= user.daily_credit_limit
}

/**
 * Get credits remaining for user
 */
export async function getCreditsRemaining(): Promise<number> {
  const user = await getCurrentUser()
  if (!user) return 0

  return Math.max(0, user.daily_credit_limit - user.daily_credits_used)
}

/**
 * Require authentication
 * Throws UnauthorizedError if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * Check if user has specific permission
 * Permissions are role-based: owner > admin > member
 */
export async function checkPermissions(
  requiredRole: 'owner' | 'admin' | 'member'
): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const roleHierarchy: Record<string, number> = {
    owner: 3,
    admin: 2,
    member: 1,
  }

  const userLevel = roleHierarchy[user.role] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0

  return userLevel >= requiredLevel
}

/**
 * Require specific permission
 * Throws UnauthorizedError if user doesn't have permission
 */
export async function requirePermission(
  requiredRole: 'owner' | 'admin' | 'member'
) {
  const hasPermission = await checkPermissions(requiredRole)
  if (!hasPermission) {
    throw new Error('Insufficient permissions')
  }
}

/**
 * Get authenticated user
 * Returns the Supabase auth user via getSession() (fast local cookie read)
 */
export async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user ?? null
}

/**
 * Check if user's email is verified
 */
export async function isEmailVerified(): Promise<boolean> {
  const authUser = await getAuthUser()
  return !!authUser?.email_confirmed_at
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  // User has completed onboarding if they have a workspace
  return !!user.workspace_id
}

/**
 * Verify workspace ownership
 * Checks if a brand workspace belongs to the current user's workspace
 * @param brandWorkspaceId - The brand workspace ID to verify
 * @returns true if user owns the workspace, false otherwise
 */
export async function verifyWorkspaceOwnership(brandWorkspaceId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user || !user.workspace_id) return false

  const supabase = await createClient()

  const { data: workspace, error } = await supabase
    .from('brand_workspaces')
    .select('workspace_id')
    .eq('id', brandWorkspaceId)
    .single()

  if (error || !workspace) return false

  return workspace.workspace_id === user.workspace_id
}
