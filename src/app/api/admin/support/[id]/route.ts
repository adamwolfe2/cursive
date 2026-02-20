
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify admin using centralized helper
    await requireAdmin()

    const supabase = await createClient()

    // Get user for audit trail
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { status, admin_notes } = body

    // Update message using admin client
    const adminSupabase = createAdminClient()
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = status
      if (status === 'responded') {
        updateData.responded_at = new Date().toISOString()
        // Get user from users table
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (userData) {
          updateData.responded_by = userData.id
        }
      }
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes
    }

    const { data, error } = await adminSupabase
      .from('support_messages')
      .update(updateData)
      .eq('id', id)
      .select('id, user_id, workspace_id, subject, message, status, priority, category, admin_notes, created_at, updated_at')
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ message: data })
  } catch (error) {
    safeError('[Admin] Support message update error:', error)
    return NextResponse.json(
      { error: 'Failed to update support message' },
      { status: 500 }
    )
  }
}
