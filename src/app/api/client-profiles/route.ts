// Client Profiles API Routes
// List all client profiles and create new profiles

import { type NextRequest } from 'next/server'
import { ClientProfileRepository } from '@/lib/repositories/client-profile.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, created } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

// Validation schema for creating a client profile
const createClientProfileSchema = z.object({
  // Required
  company_name: z.string().min(1, 'Company name is required').max(200),

  // Company information (optional)
  company_description: z.string().optional(),
  website_url: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  company_size: z.string().optional(),

  // Offerings (optional)
  primary_offering: z.string().optional(),
  secondary_offerings: z.array(z.string()).optional(),

  // Value propositions (optional)
  value_propositions: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    supporting_proof: z.string().optional(),
    target_segments: z.array(z.string()).optional(),
  })).optional(),

  // Trust signals (optional)
  trust_signals: z.array(z.object({
    id: z.string(),
    type: z.enum(['case_study', 'metric', 'logo', 'testimonial']),
    title: z.string().optional(),
    content: z.string(),
    logo_url: z.string().optional(),
  })).optional(),

  // Pain points (optional)
  pain_points: z.array(z.string()).optional(),

  // Competitive positioning (optional)
  competitors: z.array(z.string()).optional(),
  differentiators: z.array(z.string()).optional(),

  // ICP - Ideal Customer Profile (optional)
  target_industries: z.array(z.string()).optional(),
  target_company_sizes: z.array(z.string()).optional(),
  target_seniorities: z.array(z.string()).optional(),
  target_regions: z.array(z.string()).optional(),
  target_titles: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('include_inactive') === 'true'

    const repo = new ClientProfileRepository()
    const profiles = await repo.findByWorkspace(user.workspace_id, !includeInactive)

    return success(profiles)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validatedData = createClientProfileSchema.parse(body)

    const repo = new ClientProfileRepository()
    const profile = await repo.create({
      workspace_id: user.workspace_id,
      company_name: validatedData.company_name,
      company_description: validatedData.company_description,
      website_url: validatedData.website_url || null,
      industry: validatedData.industry,
      company_size: validatedData.company_size,
      primary_offering: validatedData.primary_offering,
      secondary_offerings: validatedData.secondary_offerings,
      value_propositions: validatedData.value_propositions || [],
      trust_signals: validatedData.trust_signals || [],
      pain_points: validatedData.pain_points,
      competitors: validatedData.competitors,
      differentiators: validatedData.differentiators,
      target_industries: validatedData.target_industries,
      target_company_sizes: validatedData.target_company_sizes,
      target_seniorities: validatedData.target_seniorities,
      target_regions: validatedData.target_regions,
      target_titles: validatedData.target_titles,
      is_active: true,
    })

    return created(profile)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
