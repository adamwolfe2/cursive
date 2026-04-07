/**
 * GET  /api/outbound/chat/threads — list user's chat threads (newest first)
 *
 * Optional ?agent_id filter to restrict to one workflow.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { OutboundChatRepository } from '@/lib/repositories/outbound-chat.repository'

const querySchema = z.object({
  agent_id: z.string().uuid().nullable().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

const chatRepo = new OutboundChatRepository()

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const { searchParams } = new URL(request.url)
    const { agent_id, limit } = querySchema.parse({
      agent_id: searchParams.get('agent_id') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    })

    const threads = await chatRepo.listThreads(user.id, user.workspace_id, agent_id ?? null, limit)
    return NextResponse.json({ data: threads })
  } catch (error) {
    return handleApiError(error)
  }
}
