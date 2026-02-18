/**
 * Retry Failed Operation API
 * Admin endpoint to manually retry a failed operation
 */


import { NextRequest, NextResponse } from 'next/server'
import { retryFailedOperation } from '@/lib/monitoring/failed-operations'
import { safeError } from '@/lib/utils/log-sanitizer'

/**
 * POST /api/admin/failed-operations/[id]/retry
 * Retry a failed operation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Verify platform admin access
    const { requireAdmin } = await import('@/lib/auth/admin')
    await requireAdmin()

    const { id } = await params

    // Retry the operation
    const result = await retryFailedOperation(id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Operation queued for retry' })
  } catch (error) {
    safeError('Failed to retry operation:', error)
    return NextResponse.json({ error: 'Failed to retry operation' }, { status: 500 })
  }
}
