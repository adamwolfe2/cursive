/**
 * Resolve Failed Operation API
 * Admin endpoint to mark a failed operation as resolved
 */


import { NextRequest, NextResponse } from 'next/server'
import { resolveFailedOperation } from '@/lib/monitoring/failed-operations'
import { safeError } from '@/lib/utils/log-sanitizer'

/**
 * POST /api/admin/failed-operations/[id]/resolve
 * Mark a failed operation as resolved
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Verify platform admin access
    const { requireAdmin, getCurrentAdminId } = await import('@/lib/auth/admin')
    await requireAdmin()

    const adminId = await getCurrentAdminId()
    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID not found' }, { status: 500 })
    }

    const { id } = await params

    // Resolve the operation
    const success = await resolveFailedOperation(id, adminId)

    if (!success) {
      return NextResponse.json({ error: 'Failed to resolve operation' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Operation marked as resolved' })
  } catch (error) {
    safeError('Failed to resolve operation:', error)
    return NextResponse.json({ error: 'Failed to resolve operation' }, { status: 500 })
  }
}
