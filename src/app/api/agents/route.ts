// Agents API Routes
// List all agents and create new agents

import { NextResponse, type NextRequest } from 'next/server'
import { AgentRepository } from '@/lib/repositories/agent.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, created } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

// Validation schema for creating an agent
const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  ai_provider: z.enum(['openai', 'openrouter']).optional().default('openai'),
  ai_model: z.string().optional().default('gpt-4o-mini'),
  tone: z.enum(['casual', 'professional', 'friendly', 'formal']).optional().default('professional'),
  emailbison_api_key: z.string().optional(),
  openai_api_key: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const repo = new AgentRepository()
    const agents = await repo.findByWorkspace(user.workspace_id)

    return success(agents)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validatedData = createAgentSchema.parse(body)

    const repo = new AgentRepository()
    const agent = await repo.create({
      workspace_id: user.workspace_id,
      ...validatedData,
    })

    return created(agent)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
