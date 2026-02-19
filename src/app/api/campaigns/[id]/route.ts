// Campaign Detail API Routes
// Get, update, and delete a specific campaign


import { type NextRequest } from 'next/server'
import { CampaignRepository } from '@/lib/repositories/campaign.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, notFound, success } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import {
  transitionCampaignStatus,
  isValidTransition,
  type CampaignStatus,
} from '@/lib/services/campaign/campaign-state-machine'
import { safeLog } from '@/lib/utils/log-sanitizer'
import { inngest } from '@/inngest/client'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Validation schema for updating a campaign
const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  agent_id: z.string().uuid().nullable().optional(),
  status: z.enum(['draft', 'pending_review', 'approved', 'scheduled', 'active', 'paused', 'completed', 'rejected']).optional(),
  // Targeting
  target_industries: z.array(z.string()).optional(),
  target_company_sizes: z.array(z.string()).optional(),
  target_seniorities: z.array(z.string()).optional(),
  target_regions: z.array(z.string()).optional(),
  // Value props and trust signals
  value_propositions: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    target_segments: z.array(z.string()).optional(),
  })).optional(),
  trust_signals: z.array(z.object({
    id: z.string(),
    type: z.string(),
    content: z.string(),
  })).optional(),
  // Template selection
  selected_template_ids: z.array(z.string().uuid()).optional(),
  matching_mode: z.enum(['intelligent', 'random']).optional(),
  // Sequence settings
  sequence_steps: z.number().int().min(1).max(10).optional(),
  days_between_steps: z.array(z.number().int().min(1)).optional(),
  // Scheduling
  scheduled_start_at: z.string().datetime().nullable().optional(),
})

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const repo = new CampaignRepository()
    const result = await repo.findByIdWithDetails(id, user.workspace_id)

    if (!result) return notFound('Campaign not found')

    return success(result)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validatedData = updateCampaignSchema.parse(body)

    const repo = new CampaignRepository()

    // Check campaign exists
    const existing = await repo.findById(id, user.workspace_id)
    if (!existing) return notFound('Campaign not found')

    // Handle status changes through state machine
    if (validatedData.status && validatedData.status !== existing.status) {
      const currentStatus = existing.status as CampaignStatus
      const newStatus = validatedData.status as CampaignStatus

      // Validate transition
      if (!isValidTransition(currentStatus, newStatus)) {
        return handleApiError(
          new Error(`Invalid status transition from "${currentStatus}" to "${newStatus}"`)
        )
      }

      // Perform transition with state machine
      const transitionResult = await transitionCampaignStatus(
        {
          campaignId: id,
          workspaceId: user.workspace_id,
          userId: user.id,
          scheduledStartAt: validatedData.scheduled_start_at
            ? new Date(validatedData.scheduled_start_at)
            : undefined,
        },
        newStatus
      )

      if (!transitionResult.success) {
        return handleApiError(new Error(transitionResult.error))
      }

      await inngest.send({
        name: 'campaign/status-changed' as const,
        data: {
          campaign_id: id,
          workspace_id: user.workspace_id,
          old_status: currentStatus,
          new_status: newStatus,
          triggered_by: user.id,
        },
      })
      safeLog(`[Campaign] Status changed ${currentStatus} → ${newStatus} for campaign ${id}`)

      // Remove status from validatedData to avoid double update
      delete validatedData.status
    }

    // Update other fields if any remain
    const { status: _status, ...otherUpdates } = validatedData
    if (Object.keys(otherUpdates).length > 0) {
      await repo.update(id, user.workspace_id, otherUpdates)
    }

    // Fetch updated campaign
    const campaign = await repo.findByIdWithDetails(id, user.workspace_id)

    return success(campaign)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const repo = new CampaignRepository()

    // Check campaign exists
    const existing = await repo.findById(id, user.workspace_id)
    if (!existing) return notFound('Campaign not found')

    // Only allow deleting draft or rejected campaigns
    if (!['draft', 'rejected'].includes(existing.status)) {
      return handleApiError(new Error('Can only delete draft or rejected campaigns'))
    }

    await repo.delete(id, user.workspace_id)

    return success({ message: 'Campaign deleted successfully' })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
