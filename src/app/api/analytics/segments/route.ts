/**
 * Segment Performance Analytics API
 * Metrics for saved segments
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-messages'

/**
 * GET /api/analytics/segments
 * Get performance metrics for all saved segments
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Call RPC function for segment performance
    const { data: performance, error } = await supabase
      .rpc('get_segment_performance', {
        p_workspace_id: user.workspace_id,
      })

    if (error) {
      safeError('[Segment Performance] RPC error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch segment performance' },
        { status: 500 }
      )
    }

    return NextResponse.json({ performance })
  } catch (error) {
    safeError('[Segment Performance] Error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
