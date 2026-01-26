/**
 * Single Conversation API
 * View and manage individual conversation threads
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, notFound, success, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import {
  getConversation,
  markConversationRead,
  updateConversationStatus,
  updateConversationPriority,
  addConversationNote,
  updateConversationTags,
  addReplyToConversation,
} from '@/lib/services/campaign/conversation.service'

interface RouteContext {
  params: Promise<{ id: string }>
}

const updateSchema = z.object({
  status: z.enum(['active', 'waiting_reply', 'replied', 'closed', 'archived']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  mark_read: z.boolean().optional(),
})

const replySchema = z.object({
  action: z.literal('reply'),
  subject: z.string().optional(),
  body_html: z.string().min(1),
  body_text: z.string().optional(),
})

/**
 * GET /api/conversations/[id]
 * Get a conversation with all messages
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: conversationId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const result = await getConversation(conversationId, user.workspace_id)

    if (!result) {
      return notFound('Conversation not found')
    }

    const { conversation, messages } = result

    // Auto mark as read if query param is set
    const markRead = request.nextUrl.searchParams.get('mark_read') === 'true'
    if (markRead && conversation.unreadCount > 0) {
      await markConversationRead(conversationId, user.workspace_id)
    }

    return success({
      conversation: {
        id: conversation.id,
        status: conversation.status,
        priority: conversation.priority,
        subject: conversation.subjectNormalized,
        message_count: conversation.messageCount,
        unread_count: markRead ? 0 : conversation.unreadCount,
        last_message_at: conversation.lastMessageAt,
        last_message_direction: conversation.lastMessageDirection,
        sentiment: conversation.sentiment,
        intent: conversation.intent,
        tags: conversation.tags,
        notes: conversation.notes,
        assigned_to: conversation.assignedTo,
        lead: conversation.lead
          ? {
              id: conversation.lead.id,
              email: conversation.lead.email,
              name:
                conversation.lead.fullName ||
                `${conversation.lead.firstName || ''} ${conversation.lead.lastName || ''}`.trim(),
              company: conversation.lead.companyName,
              title: conversation.lead.title,
            }
          : null,
        campaign: conversation.campaign,
        created_at: conversation.createdAt,
      },
      messages: messages.map((m) => ({
        id: m.id,
        direction: m.direction,
        from: {
          email: m.fromEmail,
          name: m.fromName,
        },
        to: {
          email: m.toEmail,
          name: m.toName,
        },
        subject: m.subject,
        body_text: m.bodyText,
        body_html: m.bodyHtml,
        snippet: m.snippet,
        sent_at: m.sentAt,
        received_at: m.receivedAt,
        opened_at: m.openedAt,
        clicked_at: m.clickedAt,
        is_read: m.isRead,
        classification: m.classification,
        is_auto_reply: m.isAutoReply,
        is_out_of_office: m.isOutOfOffice,
        created_at: m.createdAt,
      })),
      total_messages: messages.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/conversations/[id]
 * Update conversation properties
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: conversationId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = updateSchema.parse(body)

    const updates: string[] = []

    // Mark as read
    if (validated.mark_read) {
      const result = await markConversationRead(conversationId, user.workspace_id)
      if (result.success) {
        updates.push(`marked ${result.messagesMarked} messages as read`)
      }
    }

    // Update status
    if (validated.status) {
      const result = await updateConversationStatus(conversationId, user.workspace_id, validated.status)
      if (result.success) {
        updates.push(`status updated to ${validated.status}`)
      } else if (result.error) {
        return badRequest(result.error)
      }
    }

    // Update priority
    if (validated.priority) {
      const result = await updateConversationPriority(
        conversationId,
        user.workspace_id,
        validated.priority
      )
      if (result.success) {
        updates.push(`priority updated to ${validated.priority}`)
      } else if (result.error) {
        return badRequest(result.error)
      }
    }

    // Update notes
    if (validated.notes !== undefined) {
      const result = await addConversationNote(conversationId, user.workspace_id, validated.notes)
      if (result.success) {
        updates.push('notes updated')
      } else if (result.error) {
        return badRequest(result.error)
      }
    }

    // Update tags
    if (validated.tags) {
      const result = await updateConversationTags(conversationId, user.workspace_id, validated.tags)
      if (result.success) {
        updates.push('tags updated')
      } else if (result.error) {
        return badRequest(result.error)
      }
    }

    if (updates.length === 0) {
      return badRequest('No valid updates provided')
    }

    return success({
      message: 'Conversation updated',
      updates,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/conversations/[id]
 * Add a reply to the conversation
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: conversationId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = replySchema.parse(body)

    const result = await addReplyToConversation(conversationId, user.workspace_id, {
      subject: validated.subject,
      bodyHtml: validated.body_html,
      bodyText: validated.body_text,
    })

    if (!result.success) {
      return badRequest(result.error || 'Failed to create reply')
    }

    return success({
      message: 'Reply created and pending approval',
      email_send_id: result.emailSendId,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
