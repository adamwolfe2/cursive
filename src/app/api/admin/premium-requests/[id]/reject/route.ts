export const runtime = 'edge'

/**
 * Admin Premium Request Rejection API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { handleApiError, unauthorized, forbidden, badRequest } from '@/lib/utils/api-error-handler'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // SECURITY: Verify platform admin authorization (not workspace admin)
    const admin = await requireAdmin()

    const body = await request.json()
    const { notes } = body

    // Update the request status
    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
      .from('premium_feature_requests')
      .update({
        status: 'rejected',
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || 'Rejected',
      })
      .eq('id', id)

    if (error) {
      console.error('[Admin] Failed to reject request:', error)
      return NextResponse.json(
        { error: 'Failed to update request status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Request rejected',
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
