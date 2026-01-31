/**
 * Role-Based Access Control Utilities
 * Cursive Platform
 */

import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'

export type UserRole = 'owner' | 'admin' | 'partner' | 'member'
export type UserPlan = 'free' | 'starter' | 'pro' | 'enterprise'

export interface UserWithRole {
  id: string
  auth_user_id: string
  email: string
  full_name: string | null
  role: UserRole
  plan: UserPlan
  workspace_id: string
}

/**
 * Get user data with role from database
 */
export async function getUserWithRole(authUser: User): Promise<UserWithRole | null> {
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('id, auth_user_id, email, full_name, role, plan, workspace_id')
    .eq('auth_user_id', authUser.id)
    .single()

  if (error || !user) {
    console.error('[getUserWithRole] Failed to fetch user:', error)
    return null
  }

  return user as UserWithRole
}

/**
 * Check if user is admin (owner or admin role)
 */
export async function isAdmin(authUser: User): Promise<boolean> {
  const user = await getUserWithRole(authUser)
  if (!user) return false

  return user.role === 'owner' || user.role === 'admin'
}

/**
 * Check if user is owner (highest privilege)
 */
export async function isOwner(authUser: User): Promise<boolean> {
  const user = await getUserWithRole(authUser)
  if (!user) return false

  return user.role === 'owner'
}

/**
 * Check if user is approved partner
 */
export async function isApprovedPartner(authUser: User): Promise<boolean> {
  const user = await getUserWithRole(authUser)
  if (!user) return false

  // Must have partner role
  if (user.role !== 'partner') return false

  // Check if partner is approved in partners table
  const supabase = await createClient()
  const { data: partner, error } = await supabase
    .from('partners')
    .select('id, status, is_active, stripe_onboarding_complete')
    .eq('email', user.email)
    .single()

  if (error || !partner) return false

  return (
    partner.status === 'active' &&
    partner.is_active === true &&
    partner.stripe_onboarding_complete === true
  )
}

/**
 * Require admin role or throw error
 */
export async function requireAdmin(authUser: User | null): Promise<UserWithRole> {
  if (!authUser) {
    throw new Error('Authentication required')
  }

  const user = await getUserWithRole(authUser)
  if (!user) {
    throw new Error('User profile not found')
  }

  if (user.role !== 'owner' && user.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return user
}

/**
 * Require partner role (approved) or throw error
 */
export async function requireApprovedPartner(authUser: User | null): Promise<UserWithRole> {
  if (!authUser) {
    throw new Error('Authentication required')
  }

  const user = await getUserWithRole(authUser)
  if (!user) {
    throw new Error('User profile not found')
  }

  if (user.role !== 'partner') {
    throw new Error('Partner access required')
  }

  const isApproved = await isApprovedPartner(authUser)
  if (!isApproved) {
    throw new Error('Partner approval required. Your account is pending review.')
  }

  return user
}

/**
 * Get plan limits based on user plan
 */
export function getPlanLimits(plan: UserPlan): {
  dailyCreditLimit: number
  leadUploadLimit: number
  teamMemberLimit: number
  apiCallsPerMinute: number
} {
  switch (plan) {
    case 'free':
      return {
        dailyCreditLimit: 3,
        leadUploadLimit: 0, // Free users cannot upload leads
        teamMemberLimit: 1,
        apiCallsPerMinute: 10,
      }
    case 'starter':
      return {
        dailyCreditLimit: 50,
        leadUploadLimit: 0, // Only partners can upload leads
        teamMemberLimit: 3,
        apiCallsPerMinute: 30,
      }
    case 'pro':
      return {
        dailyCreditLimit: 1000,
        leadUploadLimit: 0, // Only partners can upload leads
        teamMemberLimit: 10,
        apiCallsPerMinute: 100,
      }
    case 'enterprise':
      return {
        dailyCreditLimit: -1, // Unlimited
        leadUploadLimit: 0, // Only partners can upload leads
        teamMemberLimit: -1, // Unlimited
        apiCallsPerMinute: 1000,
      }
  }
}

/**
 * Check if user can upload leads (must be approved partner)
 */
export async function canUploadLeads(authUser: User): Promise<boolean> {
  return await isApprovedPartner(authUser)
}
