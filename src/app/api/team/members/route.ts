// Team Members API
// GET /api/team/members - Get all team members in workspace

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success } from '@/lib/utils/api-error-handler'

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Get all team members in workspace
    const supabase = await createClient()
    const { data: members, error } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, role, created_at, last_login_at')
      .eq('workspace_id', user.workspace_id)
      .order('role', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch members: ${error.message}`)
    }

    // Sort by role priority: owner first, then admin, then member
    const sortedMembers = (members || []).sort((a, b) => {
      const roleOrder = { owner: 0, admin: 1, member: 2 }
      return (roleOrder[a.role as keyof typeof roleOrder] || 2) -
             (roleOrder[b.role as keyof typeof roleOrder] || 2)
    })

    return success({ members: sortedMembers })
  } catch (error: any) {
    return handleApiError(error)
  }
}
