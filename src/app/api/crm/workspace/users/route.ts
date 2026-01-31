/**
 * Workspace Users API
 * GET /api/crm/workspace/users
 * Fetch all users in the current workspace for assignment dropdowns
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Fetch all users in the workspace
    const { data: usersData, error } = await supabase
      .from('users')
      .select('auth_user_id, full_name, email')
      .eq('workspace_id', user.workspace_id)
      .order('full_name')

    if (error) {
      console.error('[Workspace Users] Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch workspace users' },
        { status: 500 }
      )
    }

    // Map auth_user_id to id for frontend compatibility
    const users = usersData?.map(u => ({
      id: u.auth_user_id,
      full_name: u.full_name,
      email: u.email
    })) || []

    return NextResponse.json({ users })

  } catch (error: any) {
    console.error('[Workspace Users] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch workspace users' },
      { status: 500 }
    )
  }
}
