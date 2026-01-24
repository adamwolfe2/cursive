/**
 * Admin Authentication
 * Cursive Platform
 *
 * Utilities for admin authentication and authorization.
 */

import { createClient } from '@/lib/supabase/server'

// Hardcoded admin emails (fallback)
const ADMIN_EMAILS = ['adam@meetcursive.com']

export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()

    // Get current session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.email) {
      return false
    }

    // Check database first
    const { data: admin } = await supabase
      .from('platform_admins')
      .select('id')
      .eq('email', session.user.email)
      .eq('is_active', true)
      .single()

    if (admin) {
      return true
    }

    // Fallback to hardcoded list
    return ADMIN_EMAILS.includes(session.user.email)
  } catch (error) {
    console.error('Admin check error:', error)
    return false
  }
}

export async function getCurrentAdminEmail(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.email || null
  } catch {
    return null
  }
}

export async function requireAdmin(): Promise<void> {
  const isAdminUser = await isAdmin()
  if (!isAdminUser) {
    throw new Error('Unauthorized: Admin access required')
  }
}

export async function getCurrentAdminId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.email) {
      return null
    }

    const { data: admin } = await supabase
      .from('platform_admins')
      .select('id')
      .eq('email', session.user.email)
      .eq('is_active', true)
      .single()

    return admin?.id || null
  } catch {
    return null
  }
}
