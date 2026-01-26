// Client Profile Detail API Routes
// Get, update, and delete a specific client profile

import { type NextRequest } from 'next/server'
import { ClientProfileRepository } from '@/lib/repositories/client-profile.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, notFound, success } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Validation schema for updating a client profile
const updateClientProfileSchema = z.object({
  // Company information
  company_name: z.string().min(1).max(200).optional(),
  company_description: z.string().nullable().optional(),
  website_url: z.string().url().nullable().optional().or(z.literal('')),
  industry: z.string().nullable().optional(),
  company_size: z.string().nullable().optional(),

  // Offerings
  primary_offering: z.string().nullable().optional(),
  secondary_offerings: z.array(z.string()).nullable().optional(),

  // Value propositions
  value_propositions: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    supporting_proof: z.string().optional(),
    target_segments: z.array(z.string()).optional(),
  })).optional(),

  // Trust signals
  trust_signals: z.array(z.object({
    id: z.string(),
    type: z.enum(['case_study', 'metric', 'logo', 'testimonial']),
    title: z.string().optional(),
    content: z.string(),
    logo_url: z.string().optional(),
  })).optional(),

  // Pain points
  pain_points: z.array(z.string()).nullable().optional(),

  // Competitive positioning
  competitors: z.array(z.string()).nullable().optional(),
  differentiators: z.array(z.string()).nullable().optional(),

  // ICP - Ideal Customer Profile
  target_industries: z.array(z.string()).nullable().optional(),
  target_company_sizes: z.array(z.string()).nullable().optional(),
  target_seniorities: z.array(z.string()).nullable().optional(),
  target_regions: z.array(z.string()).nullable().optional(),
  target_titles: z.array(z.string()).nullable().optional(),

  // Active status
  is_active: z.boolean().optional(),
})

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const repo = new ClientProfileRepository()
    const profile = await repo.findById(id, user.workspace_id)

    if (!profile) return notFound('Client profile not found')

    return success(profile)
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
    const validatedData = updateClientProfileSchema.parse(body)

    const repo = new ClientProfileRepository()

    // Check profile exists
    const existing = await repo.findById(id, user.workspace_id)
    if (!existing) return notFound('Client profile not found')

    // Handle empty string for website_url
    const updateData = {
      ...validatedData,
      website_url: validatedData.website_url === '' ? null : validatedData.website_url,
    }

    const profile = await repo.update(id, user.workspace_id, updateData)

    return success(profile)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const repo = new ClientProfileRepository()

    // Check profile exists
    const existing = await repo.findById(id, user.workspace_id)
    if (!existing) return notFound('Client profile not found')

    // Soft delete
    await repo.delete(id, user.workspace_id)

    return success({ message: 'Client profile deleted successfully' })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
