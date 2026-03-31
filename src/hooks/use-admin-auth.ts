'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseAdminAuthReturn {
  isAdmin: boolean
  authChecked: boolean
}

/**
 * Client-side admin role check hook.
 *
 * Note: The admin layout (`src/app/admin/layout.tsx`) already enforces
 * admin auth server-side, so this hook is a redundant safety net.
 * It exists to maintain the existing client-side guard pattern across
 * admin pages while keeping the code DRY.
 */
export function useAdminAuth(): UseAdminAuthReturn {
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .maybeSingle() as { data: { role: string } | null }
      if (!userData || (userData.role !== 'admin' && userData.role !== 'owner')) {
        window.location.href = '/dashboard'
        return
      }
      setIsAdmin(true)
      setAuthChecked(true)
    }
    checkAdmin().catch(() => setAuthChecked(true))
  }, [supabase])

  return { isAdmin, authChecked }
}
