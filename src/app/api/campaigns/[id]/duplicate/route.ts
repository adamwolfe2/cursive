import { type NextRequest } from 'next/server'
import { CampaignRepository } from '@/lib/repositories/campaign.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, notFound, success } from '@/lib/utils/api-error-handler'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const repo = new CampaignRepository()

    const original = await repo.findById(id, user.workspace_id)
    if (!original) return notFound('Campaign not found')

    // Create a draft copy, stripping server-managed and status fields
    const {
      id: _id,
      created_at: _created,
      updated_at: _updated,
      submitted_for_review_at: _submitted,
      reviewed_by: _reviewer,
      reviewed_at: _reviewedAt,
      review_notes: _reviewNotes,
      ...copyFields
    } = original as Record<string, unknown>

    const newCampaign = await repo.create({
      ...copyFields,
      workspace_id: user.workspace_id,
      name: `${original.name} (Copy)`,
      status: 'draft',
      scheduled_start_at: null,
    } as Parameters<typeof repo.create>[0])

    return success({ id: newCampaign.id, name: newCampaign.name })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
