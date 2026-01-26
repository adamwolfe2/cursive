// Campaign Reviews Queue API Route
// Get all pending reviews for the workspace (review queue)

import { type NextRequest } from 'next/server'
import { CampaignRepository } from '@/lib/repositories/campaign.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success } from '@/lib/utils/api-error-handler'

/**
 * GET - Get all pending reviews (review queue)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const repo = new CampaignRepository()
    const pendingReviews = await repo.getPendingReviews(user.workspace_id)

    return success(pendingReviews)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
