/**
 * Campaign Builder API - Approve Campaign
 * Mark campaign as approved and ready for export
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CampaignBuilderRepository } from '@/lib/repositories/campaign-builder.repository'

/**
 * POST /api/campaign-builder/[id]/approve
 * Approve campaign (ready for export)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace
    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Get draft
    const repo = new CampaignBuilderRepository()
    const draft = await repo.getById(id, userData.workspace_id)

    if (!draft) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Validate campaign has generated emails
    if (!draft.generated_emails || draft.generated_emails.length === 0) {
      return NextResponse.json(
        { error: 'Campaign must have generated emails before approval' },
        { status: 400 }
      )
    }

    // Approve campaign
    const updatedDraft = await repo.approve(id, userData.workspace_id)

    return NextResponse.json({
      success: true,
      draft: updatedDraft,
    })
  } catch (error) {
    console.error('[Campaign Builder] Approve error:', error)
    return NextResponse.json(
      { error: 'Failed to approve campaign' },
      { status: 500 }
    )
  }
}
