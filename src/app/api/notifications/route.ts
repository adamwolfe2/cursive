/**
 * Notifications API
 * List and manage user notifications
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import {
  getNotifications,
  markAllNotificationsRead,
  getUnreadCount,
  type NotificationFilters,
} from '@/lib/services/notification.service'

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  type: z.string().optional(),
  category: z.enum(['info', 'success', 'warning', 'error', 'action_required']).optional(),
  is_read: z.coerce.boolean().optional(),
})

const actionSchema = z.object({
  action: z.enum(['mark_all_read', 'get_count']),
})

/**
 * GET /api/notifications
 * List notifications for current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const params = listQuerySchema.parse(searchParams)

    // Build filters
    const filters: NotificationFilters = {}
    if (params.type) {
      const types = params.type.split(',').filter(Boolean)
      filters.type = types.length === 1 ? (types[0] as any) : (types as any)
    }
    if (params.category) filters.category = params.category
    if (params.is_read !== undefined) filters.isRead = params.is_read

    const { notifications, total, unreadCount } = await getNotifications(
      user.workspace_id,
      user.id,
      filters,
      { page: params.page, limit: params.limit }
    )

    const limit = params.limit || 20
    const page = params.page || 1

    return success({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        category: n.category,
        title: n.title,
        message: n.message,
        related_type: n.relatedType,
        related_id: n.relatedId,
        action_url: n.actionUrl,
        action_label: n.actionLabel,
        is_read: n.isRead,
        read_at: n.readAt,
        priority: n.priority,
        metadata: n.metadata,
        created_at: n.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_more: page * limit < total,
      },
      unread_count: unreadCount,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/notifications
 * Perform actions on notifications
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = actionSchema.parse(body)

    switch (validated.action) {
      case 'mark_all_read': {
        const result = await markAllNotificationsRead(user.workspace_id, user.id)
        return success({
          message: 'All notifications marked as read',
          marked_count: result.markedCount,
        })
      }

      case 'get_count': {
        const count = await getUnreadCount(user.workspace_id, user.id)
        return success({ unread_count: count })
      }

      default:
        return badRequest('Invalid action')
    }
  } catch (error) {
    return handleApiError(error)
  }
}
