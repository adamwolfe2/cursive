// Campaign Leads API Routes
// Manage leads within a campaign

import { type NextRequest } from 'next/server'
import { CampaignRepository } from '@/lib/repositories/campaign.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, notFound, badRequest, success, created } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Schema for adding leads to campaign
const addLeadsSchema = z.object({
  lead_ids: z.array(z.string().uuid()).min(1, 'At least one lead ID is required'),
})

// Schema for removing a lead
const removeLeadSchema = z.object({
  lead_id: z.string().uuid(),
})

/**
 * GET - Get all leads in this campaign
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

    const leads = await repo.getCampaignLeads(id)

    return success(leads)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * POST - Add leads to this campaign
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validatedData = addLeadsSchema.parse(body)

    const repo = new CampaignRepository()

    // Verify campaign exists
    const campaign = await repo.findById(id, user.workspace_id)
    if (!campaign) return notFound('Campaign not found')

    // Only allow adding leads to draft campaigns
    if (campaign.status !== 'draft') {
      return badRequest('Can only add leads to draft campaigns')
    }

    const campaignLeads = await repo.addLeadsToCampaign(id, validatedData.lead_ids)

    return created(campaignLeads)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * DELETE - Remove a lead from this campaign
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validatedData = removeLeadSchema.parse(body)

    const repo = new CampaignRepository()

    // Verify campaign exists
    const campaign = await repo.findById(id, user.workspace_id)
    if (!campaign) return notFound('Campaign not found')

    // Only allow removing leads from draft campaigns
    if (campaign.status !== 'draft') {
      return badRequest('Can only remove leads from draft campaigns')
    }

    await repo.removeLeadFromCampaign(id, validatedData.lead_id)

    return success({ message: 'Lead removed from campaign' })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
