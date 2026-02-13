/**
 * Workspace Statistics API
 * Comprehensive workspace metrics for dashboard
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-messages'

/**
 * GET /api/analytics/workspace-stats
 * Get comprehensive workspace statistics
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Call RPC function for workspace stats
    const { data: stats, error } = await supabase
      .rpc('get_workspace_stats', {
        p_workspace_id: user.workspace_id,
      })

    if (error) {
      safeError('[Workspace Stats] RPC error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch workspace statistics' },
        { status: 500 }
      )
    }

    return NextResponse.json({ stats })
  } catch (error) {
    safeError('[Workspace Stats] Error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
