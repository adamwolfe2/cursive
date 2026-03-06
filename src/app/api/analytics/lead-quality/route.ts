/**
 * Lead Quality Analytics API
 * Data completeness and quality metrics
 */


import { NextRequest, NextResponse } from 'next/server'
import { fastAuth } from '@/lib/auth/fast-auth'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-messages'

/**
 * GET /api/analytics/lead-quality
 * Get lead quality and completeness report
 */
export async function GET(request: NextRequest) {
  try {
    const user = await fastAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Call RPC function for lead quality report
    const { data: report, error } = await supabase
      .rpc('get_lead_quality_report', {
        p_workspace_id: user.workspaceId,
      })

    if (error) {
      safeError('[Lead Quality] RPC error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch lead quality report' },
        { status: 500 }
      )
    }

    return NextResponse.json({ report })
  } catch (error) {
    safeError('[Lead Quality] Error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
