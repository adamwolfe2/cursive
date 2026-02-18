
/**
 * Workspace Features API
 * Returns which premium features the workspace has access to
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return unauthorized()
    }

    // Get user's workspace
    const { data: userProfile } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get workspace premium features
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select('has_pixel_access, has_whitelabel_access, has_extra_data_access, has_outbound_access, premium_features_updated_at')
      .eq('id', userProfile.workspace_id)
      .single()

    if (error) {
      console.error('[Workspace Features] Failed to fetch:', error)
      return NextResponse.json(
        { error: 'Failed to fetch workspace features' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      has_pixel_access: workspace?.has_pixel_access ?? false,
      has_whitelabel_access: workspace?.has_whitelabel_access ?? false,
      has_extra_data_access: workspace?.has_extra_data_access ?? false,
      has_outbound_access: workspace?.has_outbound_access ?? false,
      premium_features_updated_at: workspace?.premium_features_updated_at,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
