/**
 * Inbox Conversations API
 * List conversations for the current workspace with filtering
 */

import { type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success } from '@/lib/utils/api-error-handler'
import {
  getConversations,
  type ConversationFilters,
  type PaginationParams,
} from '@/lib/services/campaign/conversation.service'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)

    const filters: ConversationFilters = {}
    const statusValues = searchParams.getAll('status')
    if (statusValues.length === 1) {
      filters.status = statusValues[0] as ConversationFilters['status']
    } else if (statusValues.length > 1) {
      filters.status = statusValues as any
    }

    const campaignId = searchParams.get('campaign_id')
    if (campaignId) filters.campaignId = campaignId

    const search = searchParams.get('search')
    if (search) filters.search = search

    const hasUnread = searchParams.get('has_unread')
    if (hasUnread === 'true') filters.hasUnread = true

    const sentiment = searchParams.get('sentiment')
    if (sentiment) filters.sentiment = sentiment

    const stageValues = searchParams.getAll('stage')
    if (stageValues.length === 1) {
      filters.stage = stageValues[0]
    } else if (stageValues.length > 1) {
      filters.stage = stageValues
    }

    const pagination: PaginationParams = {
      page: Math.max(1, Number(searchParams.get('page')) || 1),
      limit: Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 30)),
      sortBy: 'last_message_at',
      sortOrder: 'desc',
    }

    const result = await getConversations(user.workspace_id, filters, pagination)

    const conversationIds = result.conversations.map((c) => c.id)
    let pendingDraftIds = new Set<string>()
    if (conversationIds.length > 0) {
      const supabase = await createClient()
      const { data: drafts } = await supabase
        .from('email_replies')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .eq('draft_status', 'needs_approval')
      if (drafts) {
        pendingDraftIds = new Set(drafts.map((d) => d.conversation_id))
      }
    }

    return success({
      conversations: result.conversations.map((c) => ({
        id: c.id,
        workspaceId: c.workspaceId,
        campaignId: c.campaignId,
        campaignName: c.campaign?.name ?? null,
        leadId: c.leadId,
        lead: c.lead
          ? {
              firstName: c.lead.firstName,
              lastName: c.lead.lastName,
              companyName: c.lead.companyName,
              jobTitle: c.lead.title,
              email: c.lead.email,
            }
          : null,
        status: c.status,
        lastMessageAt: c.lastMessageAt,
        lastMessageDirection: c.lastMessageDirection,
        lastMessageSnippet: c.latestMessage?.snippet ?? null,
        messageCount: c.messageCount,
        unreadCount: c.unreadCount,
        sentiment: c.sentiment || 'new',
        priority: c.priority,
        aiTurnCount: 0,
        hasPendingDraft: pendingDraftIds.has(c.id),
        tags: c.tags,
      })),
      total: result.total,
      page: pagination.page,
      limit: pagination.limit,
    })
  } catch (error) {
    safeError('[Inbox Conversations GET]', error)
    return handleApiError(error)
  }
}
