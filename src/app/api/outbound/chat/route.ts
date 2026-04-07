/**
 * POST /api/outbound/chat
 *
 * Streams an AI chat response over Server-Sent Events (SSE).
 * Body: { agent_id, thread_id, message, context_refs?, saved_prompt_id? }
 * Response: text/event-stream with `data: {"delta": "..."}` lines.
 *
 * Persists user + assistant messages to outbound_chat_messages.
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { streamChatResponse } from '@/lib/services/outbound/chat.service'

const bodySchema = z.object({
  agent_id: z.string().uuid().nullable().optional(),
  thread_id: z.string().uuid(),
  message: z.string().min(1).max(8000),
  context_refs: z
    .array(
      z.object({
        type: z.enum(['lead', 'company', 'workflow']),
        id: z.string(),
        label: z.string().optional(),
      })
    )
    .optional(),
  saved_prompt_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !user.workspace_id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof z.ZodError ? err.errors : 'Invalid body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const generator = streamChatResponse({
          workspaceId: user.workspace_id!,
          userId: user.id,
          agentId: body.agent_id ?? null,
          threadId: body.thread_id,
          message: body.message,
          contextRefs: body.context_refs,
          savedPromptId: body.saved_prompt_id,
        })

        for await (const chunk of generator) {
          const payload = JSON.stringify(chunk)
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
