/**
 * Campaign Status API Route
 * GET /api/ai-studio/campaigns/[id]
 * Fetch campaign details and status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: campaignId } = await params
    const supabase = await createClient()

    // Fetch campaign with workspace ownership check
    const { data: campaign, error } = await supabase
      .from('ad_campaigns')
      .select(`
        *,
        brand_workspaces!inner(
          id,
          name,
          workspace_id
        )
      `)
      .eq('id', campaignId)
      .eq('brand_workspaces.workspace_id', user.workspace_id)
      .maybeSingle()

    if (error) {
      safeError('[Campaign GET] Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch campaign' },
        { status: 500 }
      )
    }

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({ campaign })

  } catch (error: unknown) {
    safeError('[Campaign GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}
