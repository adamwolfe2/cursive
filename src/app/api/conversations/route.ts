/**
 * Conversations API
 * List and manage email conversation threads
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import {
  getConversations,
  getConversationStats,
  type ConversationFilters,
} from '@/lib/services/campaign/conversation.service'

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort_by: z.enum(['last_message_at', 'created_at', 'unread_count']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  status: z.string().optional(), // Comma-separated
  campaign_id: z.string().uuid().optional(),
  lead_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  has_unread: z.coerce.boolean().optional(),
  sentiment: z.string().optional(),
  intent: z.string().optional(),
  search: z.string().optional(),
})

/**
 * GET /api/conversations
 * List conversations with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const params = listQuerySchema.parse(searchParams)

    // Build filters
    const filters: ConversationFilters = {}
    if (params.status) {
      const statuses = params.status.split(',').filter(Boolean)
      filters.status = statuses.length === 1 ? (statuses[0] as any) : (statuses as any)
    }
    if (params.campaign_id) filters.campaignId = params.campaign_id
    if (params.lead_id) filters.leadId = params.lead_id
    if (params.priority) filters.priority = params.priority
    if (params.has_unread) filters.hasUnread = params.has_unread
    if (params.sentiment) filters.sentiment = params.sentiment
    if (params.intent) filters.intent = params.intent
    if (params.search) filters.search = params.search

    const { conversations, total } = await getConversations(user.workspace_id, filters, {
      page: params.page,
      limit: params.limit,
      sortBy: params.sort_by,
      sortOrder: params.sort_order,
    })

    const limit = params.limit || 20
    const page = params.page || 1

    return success({
      conversations: conversations.map((c) => ({
        id: c.id,
        status: c.status,
        priority: c.priority,
        subject: c.subjectNormalized,
        message_count: c.messageCount,
        unread_count: c.unreadCount,
        last_message_at: c.lastMessageAt,
        last_message_direction: c.lastMessageDirection,
        sentiment: c.sentiment,
        intent: c.intent,
        tags: c.tags,
        lead: c.lead
          ? {
              id: c.lead.id,
              email: c.lead.email,
              name: c.lead.fullName || `${c.lead.firstName || ''} ${c.lead.lastName || ''}`.trim(),
              company: c.lead.companyName,
              title: c.lead.title,
            }
          : null,
        campaign: c.campaign,
        latest_message: c.latestMessage,
        created_at: c.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_more: page * limit < total,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/conversations
 * Get conversation statistics
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()

    if (body.action === 'stats') {
      const stats = await getConversationStats(user.workspace_id)
      return success({
        stats: {
          total: stats.total,
          unread: stats.unread,
          by_status: stats.byStatus,
          by_priority: stats.byPriority,
          avg_response_time_hours: stats.avgResponseTime,
        },
      })
    }

    return badRequest('Invalid action')
  } catch (error) {
    return handleApiError(error)
  }
}
