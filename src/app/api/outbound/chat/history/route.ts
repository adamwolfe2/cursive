/**
 * GET /api/outbound/chat/history?thread_id=…
 *
 * Returns the messages for a chat thread, oldest first.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { OutboundChatRepository } from '@/lib/repositories/outbound-chat.repository'

const querySchema = z.object({
  thread_id: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

const chatRepo = new OutboundChatRepository()

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const { searchParams } = new URL(request.url)
    const { thread_id, limit } = querySchema.parse({
      thread_id: searchParams.get('thread_id') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    })

    const messages = await chatRepo.getThreadHistory(thread_id, user.workspace_id, limit)
    return NextResponse.json({ data: messages })
  } catch (error) {
    return handleApiError(error)
  }
}
