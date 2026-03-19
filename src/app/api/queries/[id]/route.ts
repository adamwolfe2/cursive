// Query Detail API Route - Get, Update, Delete


import { NextResponse, type NextRequest } from 'next/server'
import { QueryRepository } from '@/lib/repositories/query.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, notFound, success } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Validation schema for query update
const updateQuerySchema = z.object({
  name: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed']).optional(),
  filters: z
    .object({
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
    })
    .optional(),
})

/**
 * GET /api/queries/[id] - Get a single query
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Get query with workspace filtering
    const queryRepo = new QueryRepository()
    const query = await queryRepo.findById(id, user.workspace_id)

    if (!query) {
      return notFound('Query not found')
    }

    // 3. Return response
    return success(query)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/queries/[id] - Update a query
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Validate input with Zod
    const body = await request.json()
    const validatedData = updateQuerySchema.parse(body)

    // 3. Update query with workspace filtering
    const queryRepo = new QueryRepository()
    const query = await queryRepo.update(
      id,
      user.workspace_id,
      validatedData
    )

    // 4. Return response
    return success(query)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/queries/[id] - Delete a query
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Delete query with workspace filtering
    const queryRepo = new QueryRepository()
    await queryRepo.delete(id, user.workspace_id)

    // 3. Return response
    return success({ message: 'Query deleted successfully' })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
