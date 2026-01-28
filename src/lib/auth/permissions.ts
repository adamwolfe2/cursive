// Marketplace Permission System
// Defines granular permissions for the lead marketplace

import { getCurrentUser } from './helpers'
import { createClient } from '@/lib/supabase/server'
import type { Partner } from '@/types/database.types'

// Permission definitions
export const PERMISSIONS = {
  // Lead operations
  LEADS_VIEW: 'leads:view',
  LEADS_PURCHASE: 'leads:purchase',
  LEADS_EXPORT: 'leads:export',
  LEADS_UPLOAD: 'leads:upload',
  LEADS_DELETE: 'leads:delete',

  // Partner operations
  PARTNER_PORTAL_ACCESS: 'partner:portal_access',
  PARTNER_UPLOAD: 'partner:upload',
  PARTNER_VIEW_EARNINGS: 'partner:view_earnings',
  PARTNER_REQUEST_PAYOUT: 'partner:request_payout',

  // Marketplace operations
  MARKETPLACE_BROWSE: 'marketplace:browse',
  MARKETPLACE_PURCHASE: 'marketplace:purchase',

  // Credits operations
  CREDITS_VIEW: 'credits:view',
  CREDITS_PURCHASE: 'credits:purchase',

  // Admin operations
  ADMIN_VIEW_ALL: 'admin:view_all',
  ADMIN_MANAGE_PARTNERS: 'admin:manage_partners',
  ADMIN_MANAGE_USERS: 'admin:manage_users',
  ADMIN_MANAGE_PRICING: 'admin:manage_pricing',
  ADMIN_VIEW_FINANCIALS: 'admin:view_financials',
  ADMIN_VIEW_AUDIT_LOG: 'admin:view_audit_log',

  // Workspace operations
  WORKSPACE_MANAGE: 'workspace:manage',
  WORKSPACE_BILLING: 'workspace:billing',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// Role-based permission mappings
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: [
    // All permissions
    PERMISSIONS.LEADS_VIEW,
    PERMISSIONS.LEADS_PURCHASE,
    PERMISSIONS.LEADS_EXPORT,
    PERMISSIONS.LEADS_UPLOAD,
    PERMISSIONS.LEADS_DELETE,
    PERMISSIONS.MARKETPLACE_BROWSE,
    PERMISSIONS.MARKETPLACE_PURCHASE,
    PERMISSIONS.CREDITS_VIEW,
    PERMISSIONS.CREDITS_PURCHASE,
    PERMISSIONS.ADMIN_VIEW_ALL,
    PERMISSIONS.ADMIN_MANAGE_PARTNERS,
    PERMISSIONS.ADMIN_MANAGE_USERS,
    PERMISSIONS.ADMIN_MANAGE_PRICING,
    PERMISSIONS.ADMIN_VIEW_FINANCIALS,
    PERMISSIONS.ADMIN_VIEW_AUDIT_LOG,
    PERMISSIONS.WORKSPACE_MANAGE,
    PERMISSIONS.WORKSPACE_BILLING,
  ],
  admin: [
    PERMISSIONS.LEADS_VIEW,
    PERMISSIONS.LEADS_PURCHASE,
    PERMISSIONS.LEADS_EXPORT,
    PERMISSIONS.MARKETPLACE_BROWSE,
    PERMISSIONS.MARKETPLACE_PURCHASE,
    PERMISSIONS.CREDITS_VIEW,
    PERMISSIONS.ADMIN_MANAGE_USERS,
    PERMISSIONS.WORKSPACE_MANAGE,
  ],
  member: [
    PERMISSIONS.LEADS_VIEW,
    PERMISSIONS.LEADS_PURCHASE,
    PERMISSIONS.LEADS_EXPORT,
    PERMISSIONS.MARKETPLACE_BROWSE,
    PERMISSIONS.MARKETPLACE_PURCHASE,
    PERMISSIONS.CREDITS_VIEW,
  ],
}

// Partner permissions (separate from user roles)
const PARTNER_PERMISSIONS: Permission[] = [
  PERMISSIONS.PARTNER_PORTAL_ACCESS,
  PERMISSIONS.PARTNER_UPLOAD,
  PERMISSIONS.PARTNER_VIEW_EARNINGS,
  PERMISSIONS.PARTNER_REQUEST_PAYOUT,
]

/**
 * Check if user has a specific permission
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role] || []
  if (rolePermissions.includes(permission)) {
    return true
  }

  // Check partner permissions if user is linked to a partner
  if (user.linked_partner_id && PARTNER_PERMISSIONS.includes(permission)) {
    const partner = await getLinkedPartner(user.linked_partner_id)
    if (partner && partner.is_active && partner.status !== 'suspended') {
      return true
    }
  }

  return false
}

/**
 * Check if user has all specified permissions
 */
export async function hasAllPermissions(permissions: Permission[]): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(permission))) {
      return false
    }
  }
  return true
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(permissions: Permission[]): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(permission)) {
      return true
    }
  }
  return false
}

/**
 * Require permission - throws if not authorized
 */
export async function requirePermission(permission: Permission): Promise<void> {
  const has = await hasPermission(permission)
  if (!has) {
    throw new Error(`Permission denied: ${permission}`)
  }
}

/**
 * Get all permissions for current user
 */
export async function getUserPermissions(): Promise<Permission[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const permissions = new Set<Permission>()

  // Add role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role] || []
  rolePermissions.forEach((p) => permissions.add(p))

  // Add partner permissions if applicable
  if (user.linked_partner_id) {
    const partner = await getLinkedPartner(user.linked_partner_id)
    if (partner && partner.is_active && partner.status !== 'suspended') {
      PARTNER_PERMISSIONS.forEach((p) => permissions.add(p))
    }
  }

  return Array.from(permissions)
}

/**
 * Check if user is a platform admin (from platform_admins table)
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const supabase = await createClient()
  const { data } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('email', user.email)
    .eq('is_active', true)
    .single()

  return !!data
}

/**
 * Check if user can access partner portal
 */
export async function canAccessPartnerPortal(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  // Check if user is linked to an active partner
  if (user.linked_partner_id) {
    const partner = await getLinkedPartner(user.linked_partner_id)
    return !!(partner && partner.is_active && partner.status !== 'suspended')
  }

  return false
}

/**
 * Check if user can purchase leads from marketplace
 */
export async function canPurchaseLeads(): Promise<boolean> {
  return hasPermission(PERMISSIONS.MARKETPLACE_PURCHASE)
}

/**
 * Check if user can upload leads (partner)
 */
export async function canUploadLeads(): Promise<boolean> {
  return hasPermission(PERMISSIONS.PARTNER_UPLOAD)
}

/**
 * Check if user can view lead attribution (admin only)
 */
export async function canViewLeadAttribution(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  // Only owners and admins can see which partner uploaded a lead
  return user.role === 'owner' || user.role === 'admin'
}

/**
 * Check if user can manage partners (owner/platform admin only)
 */
export async function canManagePartners(): Promise<boolean> {
  const isAdmin = await isPlatformAdmin()
  if (isAdmin) return true

  const user = await getCurrentUser()
  return user?.role === 'owner'
}

/**
 * Check if user can view financial data
 */
export async function canViewFinancials(): Promise<boolean> {
  const isAdmin = await isPlatformAdmin()
  if (isAdmin) return true

  const user = await getCurrentUser()
  return user?.role === 'owner'
}

/**
 * Get the partner linked to a user
 */
async function getLinkedPartner(partnerId: string): Promise<Partner | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('partners')
    .select('*')
    .eq('id', partnerId)
    .single()

  return data as Partner | null
}

/**
 * Authorization context for API routes
 */
export interface AuthContext {
  user: {
    id: string
    email: string
    role: string
    workspace_id: string
  } | null
  partner: Partner | null
  permissions: Permission[]
  isPlatformAdmin: boolean
}

/**
 * Get full authorization context
 */
export async function getAuthContext(): Promise<AuthContext> {
  const user = await getCurrentUser()
  const permissions = await getUserPermissions()
  const isAdmin = await isPlatformAdmin()

  let partner: Partner | null = null
  if (user?.linked_partner_id) {
    partner = await getLinkedPartner(user.linked_partner_id)
  }

  return {
    user: user
      ? {
          id: user.id,
          email: user.email,
          role: user.role,
          workspace_id: user.workspace_id,
        }
      : null,
    partner,
    permissions,
    isPlatformAdmin: isAdmin,
  }
}
