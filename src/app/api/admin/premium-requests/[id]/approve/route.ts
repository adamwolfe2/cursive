export const runtime = 'edge'

/**
 * Admin Premium Request Approval API
 * Allows admins to approve premium feature requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { handleApiError, unauthorized, forbidden, badRequest } from '@/lib/utils/api-error-handler'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/admin/premium-requests/[id]/approve
 * Approve a premium feature request and grant access
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // SECURITY: Verify platform admin authorization (not workspace admin)
    // This prevents workspace owners from approving premium requests for other workspaces
    const admin = await requireAdmin()
    const supabase = await createClient()

    // Get the feature request
    const { data: featureRequest, error: fetchError } = await supabase
      .from('premium_feature_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !featureRequest) {
      return badRequest('Feature request not found')
    }

    const body = await request.json()
    const { notes } = body

    // Use admin client to update workspace permissions and request status
    const adminSupabase = createAdminClient()

    // Start transaction-like updates
    const updates: any[] = []

    // 1. Update the request status
    const { error: requestUpdateError } = await adminSupabase
      .from('premium_feature_requests')
      .update({
        status: 'approved',
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || 'Approved',
      })
      .eq('id', id)

    if (requestUpdateError) {
      console.error('[Admin] Failed to update request:', requestUpdateError)
      return NextResponse.json(
        { error: 'Failed to update request status' },
        { status: 500 }
      )
    }

    // 2. Grant the feature access to the workspace
    const featureColumn = {
      pixel: 'has_pixel_access',
      whitelabel: 'has_whitelabel_access',
      extra_data: 'has_extra_data_access',
      outbound: 'has_outbound_access',
    }[featureRequest.feature_type as string]

    if (featureColumn) {
      const { error: workspaceUpdateError } = await adminSupabase
        .from('workspaces')
        .update({
          [featureColumn]: true,
          premium_features_updated_at: new Date().toISOString(),
        })
        .eq('id', featureRequest.workspace_id)

      if (workspaceUpdateError) {
        console.error('[Admin] Failed to grant feature access:', workspaceUpdateError)
        return NextResponse.json(
          { error: 'Failed to grant feature access' },
          { status: 500 }
        )
      }
    }

    // 3. Create audit log
    await adminSupabase.from('admin_audit_log').insert({
      admin_email: admin.email,
      action: 'premium_feature.approved',
      resource_type: 'premium_feature',
      resource_id: id,
      details: {
        feature_type: featureRequest.feature_type,
        workspace_id: featureRequest.workspace_id,
        notes,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Feature access granted for ${featureRequest.feature_type}`,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
