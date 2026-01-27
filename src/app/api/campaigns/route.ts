// Campaigns API Routes
// List all campaigns and create new campaigns

import { type NextRequest, NextResponse } from 'next/server'
import { CampaignRepository } from '@/lib/repositories/campaign.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, created } from '@/lib/utils/api-error-handler'
import {
  requireFeature,
  requireWithinLimit,
  isWorkspaceWithinLimit,
  FeatureNotAvailableError,
  LimitExceededError,
} from '@/lib/tier/server'
import { z } from 'zod'

// Validation schema for creating a campaign
const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  agent_id: z.string().uuid().optional(),
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
  scheduled_start_at: z.string().datetime().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const includeUsage = searchParams.get('includeUsage') === 'true'

    const repo = new CampaignRepository()

    let campaigns
    if (status) {
      campaigns = await repo.findByStatus(user.workspace_id, status)
    } else {
      campaigns = await repo.findByWorkspace(user.workspace_id)
    }

    // Include tier usage information if requested
    let usage = null
    if (includeUsage) {
      const { withinLimit, used, limit } = await isWorkspaceWithinLimit(user.workspace_id, 'campaigns')
      usage = { used, limit, withinLimit }
    }

    return NextResponse.json({
      data: campaigns,
      usage,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    // Check if workspace has campaigns feature enabled
    await requireFeature(
      user.workspace_id,
      'campaigns',
      'Campaigns require a paid plan. Upgrade to create email campaigns.'
    )

    // Check if workspace is within campaign limit
    await requireWithinLimit(
      user.workspace_id,
      'campaigns',
      'You have reached your maximum number of campaigns. Upgrade to create more.'
    )

    const body = await request.json()
    const validatedData = createCampaignSchema.parse(body)

    const repo = new CampaignRepository()
    const campaign = await repo.create({
      workspace_id: user.workspace_id,
      name: validatedData.name,
      description: validatedData.description,
      agent_id: validatedData.agent_id,
      status: 'draft',
      target_industries: validatedData.target_industries,
      target_company_sizes: validatedData.target_company_sizes,
      target_seniorities: validatedData.target_seniorities,
      target_regions: validatedData.target_regions,
      value_propositions: validatedData.value_propositions || [],
      trust_signals: validatedData.trust_signals || [],
      selected_template_ids: validatedData.selected_template_ids,
      matching_mode: validatedData.matching_mode || 'intelligent',
      sequence_steps: validatedData.sequence_steps || 3,
      days_between_steps: validatedData.days_between_steps || [3, 5],
      scheduled_start_at: validatedData.scheduled_start_at,
    })

    return created(campaign)
  } catch (error: unknown) {
    // Handle tier-specific errors
    if (error instanceof FeatureNotAvailableError) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'FEATURE_NOT_AVAILABLE',
          feature: error.feature,
          currentTier: error.currentTier,
        },
        { status: 403 }
      )
    }

    if (error instanceof LimitExceededError) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'LIMIT_EXCEEDED',
          resource: error.resource,
          used: error.used,
          limit: error.limit,
        },
        { status: 403 }
      )
    }

    return handleApiError(error)
  }
}
