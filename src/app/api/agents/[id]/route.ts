// Agent Detail API Routes
// Get, update, and delete a specific agent

import { NextResponse, type NextRequest } from 'next/server'
import { AgentRepository } from '@/lib/repositories/agent.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, notFound, success } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Validation schema for updating an agent
const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  ai_provider: z.enum(['openai', 'openrouter']).optional(),
  ai_model: z.string().optional(),
  tone: z.enum(['casual', 'professional', 'friendly', 'formal']).optional(),
  emailbison_api_key: z.string().nullable().optional(),
  openai_api_key: z.string().nullable().optional(),
})

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const repo = new AgentRepository()
    const result = await repo.findByIdWithDetails(id, user.workspace_id)

    if (!result) return notFound('Agent not found')

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
    const validatedData = updateAgentSchema.parse(body)

    const repo = new AgentRepository()
    const agent = await repo.update(id, user.workspace_id, validatedData)

    return success(agent)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const repo = new AgentRepository()
    await repo.delete(id, user.workspace_id)

    return success({ message: 'Agent deleted successfully' })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
