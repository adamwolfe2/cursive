/**
 * Notification Preferences API
 * Get and update notification settings
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/services/notification.service'

const updateSchema = z.object({
  in_app_enabled: z.boolean().optional(),
  email_enabled: z.boolean().optional(),
  email_frequency: z.enum(['instant', 'hourly', 'daily', 'weekly', 'never']).optional(),
  type_preferences: z.record(z.object({
    in_app: z.boolean(),
    email: z.boolean(),
  })).optional(),
  quiet_hours_enabled: z.boolean().optional(),
  quiet_hours_start: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  quiet_hours_end: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  quiet_hours_timezone: z.string().optional(),
})

/**
 * GET /api/notifications/preferences
 * Get notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const preferences = await getNotificationPreferences(user.id, user.workspace_id)

    return success({
      preferences: {
        in_app_enabled: preferences.inAppEnabled,
        email_enabled: preferences.emailEnabled,
        email_frequency: preferences.emailFrequency,
        type_preferences: preferences.typePreferences,
        quiet_hours: {
          enabled: preferences.quietHoursEnabled,
          start: preferences.quietHoursStart,
          end: preferences.quietHoursEnd,
          timezone: preferences.quietHoursTimezone,
        },
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = updateSchema.parse(body)

    const result = await updateNotificationPreferences(user.id, user.workspace_id, {
      inAppEnabled: validated.in_app_enabled,
      emailEnabled: validated.email_enabled,
      emailFrequency: validated.email_frequency,
      typePreferences: validated.type_preferences,
      quietHoursEnabled: validated.quiet_hours_enabled,
      quietHoursStart: validated.quiet_hours_start,
      quietHoursEnd: validated.quiet_hours_end,
      quietHoursTimezone: validated.quiet_hours_timezone,
    })

    if (!result.success) {
      return badRequest(result.error || 'Failed to update preferences')
    }

    return success({
      message: 'Notification preferences updated',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
