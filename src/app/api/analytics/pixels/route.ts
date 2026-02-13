/**
 * Pixel Performance Analytics API
 * Tracking metrics and identity resolution rates
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-messages'

/**
 * GET /api/analytics/pixels
 * Get performance metrics for all pixels
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Call RPC function for pixel performance
    const { data: performance, error } = await supabase
      .rpc('get_pixel_performance', {
        p_workspace_id: user.workspace_id,
      })

    if (error) {
      safeError('[Pixel Performance] RPC error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pixel performance' },
        { status: 500 }
      )
  }

    return NextResponse.json({ performance })
  } catch (error) {
    safeError('[Pixel Performance] Error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
