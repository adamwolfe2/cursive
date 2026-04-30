/**
 * Manual Reply API
 * POST: Send a manual reply in a conversation
 */

import { type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import {
  handleApiError,
  unauthorized,
  success,
  badRequest,
} from '@/lib/utils/api-error-handler'
import { addReplyToConversation } from '@/lib/services/campaign/conversation.service'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'

interface RouteContext {
  params: Promise<{ id: string }>
}

const replySchema = z.object({
  body: z.string().min(1, 'Reply body is required').max(50_000),
  subject: z.string().max(500).optional(),
})

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { id } = await context.params
    const rawBody = await request.json()
    const validated = replySchema.parse(rawBody)

    const result = await addReplyToConversation(id, user.workspace_id, {
      bodyHtml: `<p>${validated.body.replace(/\n/g, '<br>')}</p>`,
      bodyText: validated.body,
      subject: validated.subject,
    })

    if (!result.success) {
      return badRequest(result.error || 'Failed to send reply')
    }

    return success({
      message: 'Reply queued for sending',
      emailSendId: result.emailSendId,
    })
  } catch (error) {
    safeError('[Conversation Reply POST]', error)
    return handleApiError(error)
  }
}
