/**
 * Inbox Conversations API
 * List conversations for the current workspace with filtering
 */

import { type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, badRequest } from '@/lib/utils/api-error-handler'
import {
  getConversations,
  type ConversationFilters,
  type PaginationParams,
} from '@/lib/services/campaign/conversation.service'
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

    const pagination: PaginationParams = {
      page: Math.max(1, Number(searchParams.get('page')) || 1),
      limit: Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 30)),
      sortBy: 'last_message_at',
      sortOrder: 'desc',
    }

    const result = await getConversations(user.workspace_id, filters, pagination)

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
        conversationStage: c.sentiment || 'new',
        lastMessageAt: c.lastMessageAt,
        lastMessageDirection: c.lastMessageDirection,
        lastMessageSnippet: c.latestMessage?.snippet ?? null,
        messageCount: c.messageCount,
        unreadCount: c.unreadCount,
        sentiment: c.sentiment,
        priority: c.priority,
        aiTurnCount: 0,
        hasPendingDraft: false,
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
