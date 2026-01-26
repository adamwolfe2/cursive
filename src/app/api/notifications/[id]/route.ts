/**
 * Single Notification API
 * Mark read, dismiss individual notifications
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import {
  markNotificationsRead,
  dismissNotification,
} from '@/lib/services/notification.service'

interface RouteContext {
  params: Promise<{ id: string }>
}

const updateSchema = z.object({
  is_read: z.boolean().optional(),
  is_dismissed: z.boolean().optional(),
})

/**
 * PATCH /api/notifications/[id]
 * Update notification (mark read, dismiss)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: notificationId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = updateSchema.parse(body)

    const updates: string[] = []

    if (validated.is_read === true) {
      const result = await markNotificationsRead([notificationId], user.id)
      if (result.markedCount > 0) {
        updates.push('marked as read')
      }
    }

    if (validated.is_dismissed === true) {
      const result = await dismissNotification(notificationId, user.id)
      if (result.success) {
        updates.push('dismissed')
      }
    }

    if (updates.length === 0) {
      return badRequest('No valid updates provided')
    }

    return success({
      message: `Notification ${updates.join(' and ')}`,
      notification_id: notificationId,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/notifications/[id]
 * Dismiss a notification
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: notificationId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const result = await dismissNotification(notificationId, user.id)

    if (!result.success) {
      return badRequest('Failed to dismiss notification')
    }

    return success({
      message: 'Notification dismissed',
      notification_id: notificationId,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
