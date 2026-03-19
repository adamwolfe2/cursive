/**
 * Campaign Builder API - Approve Campaign
 * Mark campaign as approved and ready for export
 */

import { NextRequest, NextResponse } from 'next/server'
import { CampaignBuilderRepository } from '@/lib/repositories/campaign-builder.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

/**
 * POST /api/campaign-builder/[id]/approve
 * Approve campaign (ready for export)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const repo = new CampaignBuilderRepository()
    const draft = await repo.getById(id, user.workspace_id)

    if (!draft) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (!draft.generated_emails || draft.generated_emails.length === 0) {
      return NextResponse.json(
        { error: 'Campaign must have generated emails before approval' },
        { status: 400 }
      )
    }

    const updatedDraft = await repo.approve(id, user.workspace_id)

    return NextResponse.json({ success: true, draft: updatedDraft })
  } catch (error) {
    return handleApiError(error)
  }
}
