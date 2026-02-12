// Queries API Route - List and Create

import { NextResponse, type NextRequest } from 'next/server'
import { QueryRepository } from '@/lib/repositories/query.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, forbidden, success, created } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

// Validation schema for query creation
const createQuerySchema = z.object({
  topic_id: z.string().uuid(),
  name: z.string().optional(),
  filters: z.object({
    location: z
      .object({
        country: z.string().optional(),
        state: z.string().optional(),
        city: z.string().optional(),
      })
      .optional()
      .nullable(),
    company_size: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional()
      .nullable(),
    industry: z.array(z.string()).optional().nullable(),
    revenue_range: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional()
      .nullable(),
    employee_range: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional()
      .nullable(),
    technologies: z.array(z.string()).optional().nullable(),
    exclude_companies: z.array(z.string()).optional(),
  }),
})

/**
 * GET /api/queries - List all queries for workspace
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Use repository with workspace filtering
    const queryRepo = new QueryRepository()
    const queries = await queryRepo.findByWorkspace(user.workspace_id)

    // 3. Return response
    return success(queries)
  } catch (error: any) {
    return handleApiError(error)
  }
}

/**
 * POST /api/queries - Create a new query
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Validate input with Zod
    const body = await request.json()
    const validatedData = createQuerySchema.parse(body)

    // 3. Check query limit based on plan
    const queryRepo = new QueryRepository()
    const activeCount = await queryRepo.countActiveByWorkspace(user.workspace_id)

    const limit = user.plan === 'pro' ? 5 : 1
    if (activeCount >= limit) {
      return forbidden(
        `Query limit reached. ${user.plan === 'free' ? 'Upgrade to Pro to create up to 5 queries.' : 'You have reached the maximum of 5 queries.'}`
      )
    }

    // 4. Create query with workspace isolation
    const query = await queryRepo.create({
      workspace_id: user.workspace_id,
      topic_id: validatedData.topic_id,
      name: validatedData.name,
      filters: validatedData.filters as any,
      status: 'active',
    })

    // 5. Return response
    return created(query)
  } catch (error: any) {
    return handleApiError(error)
  }
}
