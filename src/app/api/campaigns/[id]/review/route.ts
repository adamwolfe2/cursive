// Campaign Review API Routes
// Submit campaign for review and complete reviews

import { type NextRequest } from 'next/server'
import { CampaignRepository } from '@/lib/repositories/campaign.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, notFound, badRequest, success, created } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Schema for submitting for review
const submitForReviewSchema = z.object({
  sample_emails: z.array(z.object({
    lead_id: z.string().uuid(),
    subject: z.string(),
    body: z.string(),
    value_prop_used: z.string().optional(),
  })).optional(),
})

// Schema for completing a review
const completeReviewSchema = z.object({
  review_id: z.string().uuid(),
  status: z.enum(['approved', 'approved_with_changes', 'rejected', 'changes_requested']),
  notes: z.string().optional(),
  requested_changes: z.array(z.object({
    field: z.string(),
    current_value: z.string().optional(),
    suggested_value: z.string().optional(),
    reason: z.string(),
  })).optional(),
})

/**
 * POST - Submit campaign for review
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validatedData = submitForReviewSchema.parse(body)

    const repo = new CampaignRepository()

    // Check campaign exists and is in draft status
    const campaign = await repo.findById(id, user.workspace_id)
    if (!campaign) return notFound('Campaign not found')

    if (campaign.status !== 'draft') {
      return badRequest('Campaign must be in draft status to submit for review')
    }

    // Submit for review
    const review = await repo.submitForReview(
      id,
      user.workspace_id,
      validatedData.sample_emails || []
    )

    return created(review)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * PATCH - Complete a review (approve/reject/request changes)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validatedData = completeReviewSchema.parse(body)

    const repo = new CampaignRepository()

    // Verify campaign exists
    const campaign = await repo.findById(id, user.workspace_id)
    if (!campaign) return notFound('Campaign not found')

    if (campaign.status !== 'pending_review') {
      return badRequest('Campaign is not pending review')
    }

    // Complete the review
    const review = await repo.completeReview(
      validatedData.review_id,
      user.id,
      validatedData.status,
      user.workspace_id,
      validatedData.notes,
      validatedData.requested_changes
    )

    return success(review)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * GET - Get reviews for this campaign
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const repo = new CampaignRepository()

    // Verify campaign exists
    const campaign = await repo.findById(id, user.workspace_id)
    if (!campaign) return notFound('Campaign not found')

    const reviews = await repo.getCampaignReviews(id, user.workspace_id)

    return success(reviews)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
