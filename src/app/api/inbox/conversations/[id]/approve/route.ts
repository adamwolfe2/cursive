/**
 * Approve / Reject AI Draft API
 * POST: Approve and send (or reject) the AI-generated reply draft
 */

import { type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import {
  handleApiError,
  unauthorized,
  notFound,
  success,
  badRequest,
} from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'

interface RouteContext {
  params: Promise<{ id: string }>
}

const approveSchema = z.object({
  reply_id: z.string().uuid(),
  edited_body: z.string().max(50_000).optional(),
  action: z.enum(['approve', 'reject']).optional().default('approve'),
})

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { id: conversationId } = await context.params
    const rawBody = await request.json()
    const validated = approveSchema.parse(rawBody)

    const supabase = await createClient()

    // Verify the reply belongs to this conversation and workspace
    const { data: reply, error: fetchError } = await supabase
      .from('email_replies')
      .select('id, draft_status, workspace_id, conversation_id, suggested_response')
      .eq('id', validated.reply_id)
      .eq('conversation_id', conversationId)
      .maybeSingle()

    if (fetchError || !reply) {
      return notFound('Draft reply not found')
    }

    if (reply.workspace_id !== user.workspace_id) {
      return unauthorized('Not authorized to modify this draft')
    }

    if (reply.draft_status !== 'needs_approval') {
      return badRequest(`Draft is already ${reply.draft_status}`)
    }

    if (validated.action === 'reject') {
      await supabase
        .from('email_replies')
        .update({
          draft_status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', validated.reply_id)

      return success({ message: 'Draft rejected' })
    }

    // Approve flow
    const finalBody = validated.edited_body || reply.suggested_response

    await supabase
      .from('email_replies')
      .update({
        draft_status: 'approved',
        suggested_response: finalBody,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', validated.reply_id)

    // Update conversation status
    await supabase
      .from('email_conversations')
      .update({
        status: 'replied',
        last_message_at: new Date().toISOString(),
        last_message_direction: 'outbound',
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .eq('workspace_id', user.workspace_id)

    return success({
      message: 'Draft approved and queued for sending',
      replyId: validated.reply_id,
    })
  } catch (error) {
    safeError('[Approve Draft POST]', error)
    return handleApiError(error)
  }
}
