// Query Detail API Route - Get, Update, Delete

import { NextResponse, type NextRequest } from 'next/server'
import { QueryRepository } from '@/lib/repositories/query.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
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

    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query
    const queryRepo = new QueryRepository()
    const query = await queryRepo.findById(id, user.workspace_id)

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 })
    }

    return NextResponse.json({ data: query })
  } catch (error: any) {
    console.error('Get query error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
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

    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateQuerySchema.parse(body)

    // Update query
    const queryRepo = new QueryRepository()
    const query = await queryRepo.update(
      id,
      user.workspace_id,
      validatedData
    )

    return NextResponse.json({ data: query })
  } catch (error: any) {
    console.error('Update query error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
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

    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete query
    const queryRepo = new QueryRepository()
    await queryRepo.delete(id, user.workspace_id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete query error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
