/**
 * Campaign Status API Route
 * GET /api/ai-studio/campaigns/[id]
 * Fetch campaign details and status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.id
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
      .single()

    if (error) {
      console.error('[Campaign GET] Error:', error)
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({ campaign })

  } catch (error: any) {
    console.error('[Campaign GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}
