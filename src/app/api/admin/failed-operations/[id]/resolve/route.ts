/**
 * Resolve Failed Operation API
 * Admin endpoint to mark a failed operation as resolved
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveFailedOperation } from '@/lib/monitoring/failed-operations'

/**
 * POST /api/admin/failed-operations/[id]/resolve
 * Mark a failed operation as resolved
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Auth check - admin only
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { id } = params

    // Resolve the operation
    const success = await resolveFailedOperation(id, userData.id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to resolve operation' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Operation marked as resolved' })
  } catch (error) {
    console.error('Failed to resolve operation:', error)
    return NextResponse.json({ error: 'Failed to resolve operation' }, { status: 500 })
  }
}
