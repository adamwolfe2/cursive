/**
 * Access Control Middleware
 * Role-based access for partner vs business users
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type UserRole = 'owner' | 'admin' | 'member' | 'partner'

export interface AccessControlUser {
  id: string
  email: string
  role: UserRole
  partner_approved: boolean
  active_subscription: boolean
  plan: string
  workspace_id: string
}

/**
 * Get current user with access control fields
 */
export async function getCurrentUserWithAccess(): Promise<AccessControlUser | null> {
  const supabase = await createClient()

  // SECURITY: Use getUser() for server-side JWT verification
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null

  const { data: user } = await supabase
    .from('users')
    .select('id, email, role, partner_approved, active_subscription, plan, workspace_id')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  return user
}

/**
 * Require business user with active subscription
 * Redirects to /pricing if no subscription
 */
export async function requireBusinessAccess(): Promise<AccessControlUser> {
  const user = await getCurrentUserWithAccess()

  if (!user) {
    redirect('/login')
  }

  // Business users are: owner, admin, member (not partner)
  const isBusinessUser = ['owner', 'admin', 'member'].includes(user.role)

  if (!isBusinessUser) {
    redirect('/partner/dashboard') // Partners go to their dashboard
  }

  if (!user.active_subscription) {
    redirect('/pricing') // Business users need subscription
  }

  return user
}

/**
 * Require partner access
 * Partners are auto-approved on signup
 */
export async function requirePartnerAccess(): Promise<AccessControlUser> {
  const user = await getCurrentUserWithAccess()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'partner') {
    redirect('/dashboard') // Non-partners go to regular dashboard
  }

  // Partners are auto-approved (partner_approved defaults to true)
  return user
}

/**
 * Check if user has marketplace access (business with subscription)
 */
export function hasMarketplaceAccess(user: AccessControlUser): boolean {
  const isBusinessUser = ['owner', 'admin', 'member'].includes(user.role)
  return isBusinessUser && user.active_subscription
}

/**
 * Check if user can upload leads (approved partner)
 */
export function canUploadLeads(user: AccessControlUser): boolean {
  return user.role === 'partner' && user.partner_approved
}

/**
 * Get redirect path based on user role
 */
export function getRoleBasedRedirect(user: AccessControlUser): string {
  if (user.role === 'partner') {
    return '/partner/dashboard'
  }

  return '/dashboard'
}
