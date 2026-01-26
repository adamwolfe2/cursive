// Campaigns API Routes
// List all campaigns and create new campaigns

import { type NextRequest } from 'next/server'
import { CampaignRepository } from '@/lib/repositories/campaign.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, created } from '@/lib/utils/api-error-handler'
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

    const repo = new CampaignRepository()

    let campaigns
    if (status) {
      campaigns = await repo.findByStatus(user.workspace_id, status)
    } else {
      campaigns = await repo.findByWorkspace(user.workspace_id)
    }

    return success(campaigns)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

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
    return handleApiError(error)
  }
}
