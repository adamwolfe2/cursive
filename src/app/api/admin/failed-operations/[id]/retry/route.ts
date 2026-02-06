/**
 * Retry Failed Operation API
 * Admin endpoint to manually retry a failed operation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { retryFailedOperation } from '@/lib/monitoring/failed-operations'

/**
 * POST /api/admin/failed-operations/[id]/retry
 * Retry a failed operation
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
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { id } = params

    // Retry the operation
    const result = await retryFailedOperation(id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Operation queued for retry' })
  } catch (error) {
    console.error('Failed to retry operation:', error)
    return NextResponse.json({ error: 'Failed to retry operation' }, { status: 500 })
  }
}
