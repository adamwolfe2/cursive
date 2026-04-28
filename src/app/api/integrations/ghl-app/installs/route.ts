/**
 * GHL marketplace — list installs for the current workspace.
 * Powers the Settings UI grid.
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('app_installs')
      .select('id, external_id, external_name, pixel_id, pixel_deployment_status, sync_visitors_enabled, last_visitor_sync_at, visitor_sync_count, status, installed_at')
      .eq('source', 'ghl')
      .eq('workspace_id', user.workspace_id)
      .order('installed_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ installs: data ?? [] })
  } catch (err) {
    return handleApiError(err)
  }
}
