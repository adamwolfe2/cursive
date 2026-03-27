/**
 * Single Conversation API
 * GET: Fetch conversation with all messages
 * PATCH: Update conversation metadata
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
import {
  getConversation,
  updateConversationStatus,
  addConversationNote,
  updateConversationTags,
  markConversationRead,
} from '@/lib/services/campaign/conversation.service'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { id } = await context.params
    const result = await getConversation(id, user.workspace_id)

    if (!result) return notFound('Conversation not found')

    // Mark as read
    await markConversationRead(id, user.workspace_id)

    // Check for pending AI draft
    const supabase = await createClient()
    const { data: pendingDraft } = await supabase
      .from('email_replies')
      .select('id, suggested_response, confidence_score, knowledge_entries_used')
      .eq('conversation_id', id)
      .eq('draft_status', 'needs_approval')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const conv = result.conversation
    return success({
      conversation: {
        id: conv.id,
        workspaceId: conv.workspaceId,
        campaignId: conv.campaignId,
        campaignName: conv.campaign?.name ?? null,
        leadId: conv.leadId,
        lead: conv.lead
          ? {
              firstName: conv.lead.firstName,
              lastName: conv.lead.lastName,
              companyName: conv.lead.companyName,
              jobTitle: conv.lead.title,
              email: conv.lead.email,
            }
          : null,
        status: conv.status,
        conversationStage: conv.sentiment || 'new',
        lastMessageAt: conv.lastMessageAt,
        lastMessageDirection: conv.lastMessageDirection,
        lastMessageSnippet: null,
        messageCount: conv.messageCount,
        unreadCount: 0,
        sentiment: conv.sentiment,
        priority: conv.priority,
        aiTurnCount: 0,
        hasPendingDraft: !!pendingDraft,
        tags: conv.tags,
      },
      messages: result.messages,
      pendingDraft: pendingDraft
        ? {
            id: pendingDraft.id,
            body: pendingDraft.suggested_response || '',
            confidence: pendingDraft.confidence_score || 0,
            knowledgeEntries: pendingDraft.knowledge_entries_used || [],
          }
        : null,
    })
  } catch (error) {
    safeError('[Conversation GET]', error)
    return handleApiError(error)
  }
}

const patchSchema = z.object({
  status: z.enum(['active', 'waiting_reply', 'replied', 'closed', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
})

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { id } = await context.params
    const body = await request.json()
    const validated = patchSchema.parse(body)

    if (validated.status) {
      const result = await updateConversationStatus(id, user.workspace_id, validated.status)
      if (!result.success) return badRequest(result.error || 'Failed to update status')
    }

    if (validated.tags !== undefined) {
      const result = await updateConversationTags(id, user.workspace_id, validated.tags)
      if (!result.success) return badRequest(result.error || 'Failed to update tags')
    }

    if (validated.notes !== undefined) {
      const result = await addConversationNote(id, user.workspace_id, validated.notes)
      if (!result.success) return badRequest(result.error || 'Failed to update notes')
    }

    if (validated.assigned_to !== undefined) {
      const supabase = await createClient()
      await supabase
        .from('email_conversations')
        .update({ assigned_to: validated.assigned_to, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('workspace_id', user.workspace_id)
    }

    return success({ message: 'Conversation updated' })
  } catch (error) {
    safeError('[Conversation PATCH]', error)
    return handleApiError(error)
  }
}
