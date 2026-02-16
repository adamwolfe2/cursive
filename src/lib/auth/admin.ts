/**
 * Admin Authentication & Impersonation
 * Cursive Platform
 *
 * Utilities for admin authentication, authorization, and workspace impersonation.
 * Admins can "switch into" any workspace to view/manage it as if they were the owner.
 */

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import type { PlatformAdmin, AdminContext, Workspace, AdminActionType } from '@/types'
import { sanitizeSearchTerm } from '@/lib/utils/sanitize-search'
import { safeError } from '@/lib/utils/log-sanitizer'

// Cookie name for impersonation session
const IMPERSONATION_COOKIE = 'cursive_impersonation_session'

/**
 * Check if current user is a platform admin
 * NOTE: Admins must be in the platform_admins database table.
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null

    if (!user?.email) {
      return false
    }

    // Check database - this is the only source of truth for admin status
    const { data: admin } = await supabase
      .from('platform_admins')
      .select('id')
      .eq('email', user.email)
      .eq('is_active', true)
      .single()

    return !!admin
  } catch (error) {
    safeError('Admin check error:', error)
    return false
  }
}

/**
 * Get current admin email
 */
export async function getCurrentAdminEmail(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    return user?.email || null
  } catch {
    return null
  }
}

/**
 * Require admin authentication
 * Throws if not authenticated as admin
 * Returns admin info (id, email) for audit logging
 */
export async function requireAdmin(): Promise<{ id: string; email: string }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  if (!user?.email) {
    throw new Error('Unauthorized: Admin access required')
  }

  const { data: admin } = await supabase
    .from('platform_admins')
    .select('id, email')
    .eq('email', user.email)
    .eq('is_active', true)
    .single()

  if (!admin) {
    throw new Error('Unauthorized: Admin access required')
  }

  return { id: admin.id, email: admin.email ?? user.email }
}

/**
 * Get current admin's ID from platform_admins table
 */
export async function getCurrentAdminId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null

    if (!user?.email) {
      return null
    }

    const { data: admin } = await supabase
      .from('platform_admins')
      .select('id')
      .eq('email', user.email)
      .eq('is_active', true)
      .single()

    return admin?.id || null
  } catch {
    return null
  }
}

/**
 * Get full admin record
 */
export async function getCurrentAdmin(): Promise<PlatformAdmin | null> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null

    if (!user?.email) {
      return null
    }

    const { data: admin } = await supabase
      .from('platform_admins')
      .select('*')
      .eq('email', user.email)
      .eq('is_active', true)
      .single()

    return admin as PlatformAdmin | null
  } catch {
    return null
  }
}

// ============================================================================
// IMPERSONATION FUNCTIONS
// ============================================================================

/**
 * Start impersonation session for a workspace
 * Creates a super_admin_session record and sets a cookie
 */
export async function startImpersonation(
  workspaceId: string,
  reason?: string
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { success: false, error: 'Not authenticated as admin' }
    }

    const supabase = await createClient()

    // End any existing active session for this admin
    await supabase
      .from('super_admin_sessions')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('admin_id', admin.id)
      .eq('is_active', true)

    // Verify workspace exists
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('id', workspaceId)
      .single()

    if (workspaceError || !workspace) {
      return { success: false, error: 'Workspace not found' }
    }

    // Create new session
    const { data: session, error: sessionError } = await supabase
      .from('super_admin_sessions')
      .insert({
        admin_id: admin.id,
        workspace_id: workspaceId,
        reason: reason || null,
        is_active: true,
      })
      .select('id')
      .single()

    if (sessionError || !session) {
      return { success: false, error: 'Failed to create impersonation session' }
    }

    // Log the action
    await logAdminAction('impersonate_start', 'workspace', workspaceId, null, {
      workspace_name: workspace.name,
      reason,
    })

    // Set cookie for client-side awareness
    // SECURITY: Impersonation sessions limited to 1 hour max to reduce risk window
    const cookieStore = await cookies()
    cookieStore.set(IMPERSONATION_COOKIE, session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1, // 1 hour (reduced from 8 hours for security)
      path: '/',
    })

    return { success: true, sessionId: session.id }
  } catch (error) {
    safeError('Start impersonation error:', error)
    return { success: false, error: 'Failed to start impersonation' }
  }
}

/**
 * End current impersonation session
 */
export async function endImpersonation(): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { success: false, error: 'Not authenticated as admin' }
    }

    const supabase = await createClient()

    // Get current active session
    const { data: activeSession } = await supabase
      .from('super_admin_sessions')
      .select('id, workspace_id')
      .eq('admin_id', admin.id)
      .eq('is_active', true)
      .single()

    if (activeSession) {
      // End the session
      await supabase
        .from('super_admin_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
        })
        .eq('id', activeSession.id)

      // Log the action
      await logAdminAction('impersonate_end', 'workspace', activeSession.workspace_id)
    }

    // Clear the cookie
    const cookieStore = await cookies()
    cookieStore.delete(IMPERSONATION_COOKIE)

    return { success: true }
  } catch (error) {
    safeError('End impersonation error:', error)
    return { success: false, error: 'Failed to end impersonation' }
  }
}

/**
 * Get current impersonation session
 */
export async function getActiveImpersonationSession(): Promise<{
  sessionId: string
  workspaceId: string
  workspace: Workspace
} | null> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return null
    }

    const supabase = await createClient()

    const { data: session } = await supabase
      .from('super_admin_sessions')
      .select(`
        id,
        workspace_id,
        workspaces (*)
      `)
      .eq('admin_id', admin.id)
      .eq('is_active', true)
      .single()

    if (!session) {
      return null
    }

    return {
      sessionId: session.id,
      workspaceId: session.workspace_id,
      workspace: session.workspaces as unknown as Workspace,
    }
  } catch {
    return null
  }
}

/**
 * Get admin context with impersonation info
 * This is the main function to use in API routes/pages
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return null
    }

    const impersonation = await getActiveImpersonationSession()

    return {
      admin,
      impersonatedWorkspace: impersonation?.workspace || null,
      isImpersonating: !!impersonation,
      sessionId: impersonation?.sessionId || null,
    }
  } catch {
    return null
  }
}

/**
 * Get effective workspace ID for current context
 * Returns impersonated workspace if active, otherwise null
 * Used for filtering data when admin is viewing a specific workspace
 */
export async function getEffectiveWorkspaceId(): Promise<string | null> {
  const impersonation = await getActiveImpersonationSession()
  return impersonation?.workspaceId || null
}

/**
 * Check if currently impersonating a specific workspace
 */
export async function isImpersonatingWorkspace(workspaceId: string): Promise<boolean> {
  const effectiveId = await getEffectiveWorkspaceId()
  return effectiveId === workspaceId
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log an admin action for audit trail
 */
export async function logAdminAction(
  action: AdminActionType | string,
  resourceType: string,
  resourceId?: string | null,
  oldValues?: Record<string, unknown> | null,
  newValues?: Record<string, unknown> | null,
  workspaceId?: string | null
): Promise<void> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return
    }

    const supabase = await createClient()

    await supabase.from('admin_audit_logs').insert({
      admin_id: admin.id,
      action,
      resource_type: resourceType,
      resource_id: resourceId || null,
      old_values: oldValues || null,
      new_values: newValues || null,
      workspace_id: workspaceId || null,
    })
  } catch (error) {
    // Don't throw on audit log failures, just log
    safeError('Failed to log admin action:', error)
  }
}

// ============================================================================
// WORKSPACE ACCESS FUNCTIONS
// ============================================================================

/**
 * Get all workspaces (admin only)
 * Optionally filter by various criteria
 */
export async function getAllWorkspaces(options?: {
  search?: string
  onboardingStatus?: string
  isSuspended?: boolean
  limit?: number
  offset?: number
}): Promise<{ workspaces: Workspace[]; total: number }> {
  await requireAdmin()

  const supabase = await createClient()

  let query = supabase
    .from('workspaces')
    .select('*, workspace_tiers(*, product_tiers(*))', { count: 'exact' })

  if (options?.search) {
    const term = sanitizeSearchTerm(options.search)
    query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`)
  }

  if (options?.onboardingStatus) {
    query = query.eq('onboarding_status', options.onboardingStatus)
  }

  if (options?.isSuspended !== undefined) {
    query = query.eq('is_suspended', options.isSuspended)
  }

  query = query.order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, count, error } = await query

  if (error) {
    throw new Error(`Failed to fetch workspaces: ${error.message}`)
  }

  return {
    workspaces: (data || []) as unknown as Workspace[],
    total: count || 0,
  }
}

/**
 * Get a specific workspace by ID (admin only)
 */
export async function getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
  await requireAdmin()

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_tiers(*, product_tiers(*)),
      users(*)
    `)
    .eq('id', workspaceId)
    .single()

  if (error) {
    return null
  }

  return data as unknown as Workspace
}

/**
 * Suspend a workspace (admin only)
 */
export async function suspendWorkspace(
  workspaceId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()

    const supabase = await createClient()

    // Get current state for audit log
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('is_suspended, suspended_reason')
      .eq('id', workspaceId)
      .single()

    const { error } = await supabase
      .from('workspaces')
      .update({
        is_suspended: true,
        suspended_reason: reason,
        suspended_at: new Date().toISOString(),
      })
      .eq('id', workspaceId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Log action
    await logAdminAction(
      'workspace_suspend',
      'workspace',
      workspaceId,
      { is_suspended: workspace?.is_suspended },
      { is_suspended: true, reason },
      workspaceId
    )

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Unsuspend a workspace (admin only)
 */
export async function unsuspendWorkspace(
  workspaceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()

    const supabase = await createClient()

    const { error } = await supabase
      .from('workspaces')
      .update({
        is_suspended: false,
        suspended_reason: null,
        suspended_at: null,
      })
      .eq('id', workspaceId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Log action
    await logAdminAction('workspace_unsuspend', 'workspace', workspaceId, null, null, workspaceId)

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
