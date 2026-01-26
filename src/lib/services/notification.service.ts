/**
 * Notification Service
 * Handles in-app notifications and alerts
 */

import { createClient } from '@/lib/supabase/server'

export type NotificationType =
  | 'reply_received'
  | 'campaign_completed'
  | 'campaign_started'
  | 'limit_reached'
  | 'bounce_detected'
  | 'experiment_winner'
  | 'lead_imported'
  | 'error_occurred'
  | 'approval_needed'
  | 'daily_summary'
  | 'system'

export type NotificationCategory = 'info' | 'success' | 'warning' | 'error' | 'action_required'

export interface Notification {
  id: string
  workspaceId: string
  userId: string | null
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  relatedType: string | null
  relatedId: string | null
  actionUrl: string | null
  actionLabel: string | null
  isRead: boolean
  readAt: string | null
  isDismissed: boolean
  dismissedAt: string | null
  priority: number
  expiresAt: string | null
  metadata: Record<string, any>
  createdAt: string
}

export interface NotificationPreferences {
  inAppEnabled: boolean
  emailEnabled: boolean
  emailFrequency: 'instant' | 'hourly' | 'daily' | 'weekly' | 'never'
  typePreferences: Record<string, { in_app: boolean; email: boolean }>
  quietHoursEnabled: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
  quietHoursTimezone: string
}

export interface CreateNotificationParams {
  workspaceId: string
  type: NotificationType
  title: string
  message: string
  userId?: string | null
  category?: NotificationCategory
  relatedType?: string
  relatedId?: string
  actionUrl?: string
  actionLabel?: string
  priority?: number
  expiresAt?: Date
  metadata?: Record<string, any>
}

export interface NotificationFilters {
  type?: NotificationType | NotificationType[]
  category?: NotificationCategory
  isRead?: boolean
  isDismissed?: boolean
}

// ============ Notification CRUD ============

/**
 * Create a notification
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  const supabase = await createClient()

  // Try database function first
  const { data, error } = await supabase.rpc('create_notification', {
    p_workspace_id: params.workspaceId,
    p_type: params.type,
    p_title: params.title,
    p_message: params.message,
    p_user_id: params.userId || null,
    p_category: params.category || 'info',
    p_related_type: params.relatedType || null,
    p_related_id: params.relatedId || null,
    p_action_url: params.actionUrl || null,
    p_action_label: params.actionLabel || null,
    p_priority: params.priority || 0,
    p_metadata: params.metadata || {},
  })

  if (error) {
    // Fallback to direct insert
    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        workspace_id: params.workspaceId,
        user_id: params.userId,
        type: params.type,
        category: params.category || 'info',
        title: params.title,
        message: params.message,
        related_type: params.relatedType,
        related_id: params.relatedId,
        action_url: params.actionUrl,
        action_label: params.actionLabel,
        priority: params.priority || 0,
        expires_at: params.expiresAt?.toISOString(),
        metadata: params.metadata || {},
      })
      .select('id')
      .single()

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    return { success: true, notificationId: notification.id }
  }

  return { success: true, notificationId: data }
}

/**
 * Get notifications for a user
 */
export async function getNotifications(
  workspaceId: string,
  userId: string,
  filters: NotificationFilters = {},
  pagination: { page?: number; limit?: number } = {}
): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
  const supabase = await createClient()

  const page = pagination.page || 1
  const limit = Math.min(pagination.limit || 20, 100)
  const offset = (page - 1) * limit

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters.type) {
    if (Array.isArray(filters.type)) {
      query = query.in('type', filters.type)
    } else {
      query = query.eq('type', filters.type)
    }
  }

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  if (filters.isRead !== undefined) {
    query = query.eq('is_read', filters.isRead)
  }

  if (filters.isDismissed !== undefined) {
    query = query.eq('is_dismissed', filters.isDismissed)
  } else {
    // By default, don't show dismissed
    query = query.eq('is_dismissed', false)
  }

  // Filter out expired
  query = query.or('expires_at.is.null,expires_at.gt.now()')

  // Paginate
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`)
  }

  // Get unread count
  const { data: unreadData } = await supabase.rpc('get_unread_notification_count', {
    p_workspace_id: workspaceId,
    p_user_id: userId,
  })

  return {
    notifications: (data || []).map(mapNotification),
    total: count || 0,
    unreadCount: unreadData || 0,
  }
}

/**
 * Mark notifications as read
 */
export async function markNotificationsRead(
  notificationIds: string[],
  userId: string
): Promise<{ success: boolean; markedCount: number }> {
  const supabase = await createClient()

  // Try database function
  const { data, error } = await supabase.rpc('mark_notifications_read', {
    p_notification_ids: notificationIds,
    p_user_id: userId,
  })

  if (error) {
    // Fallback to direct update
    const { data: updated } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', notificationIds)
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .select('id')

    return { success: true, markedCount: updated?.length || 0 }
  }

  return { success: true, markedCount: data || 0 }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(
  workspaceId: string,
  userId: string
): Promise<{ success: boolean; markedCount: number }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('mark_all_notifications_read', {
    p_workspace_id: workspaceId,
    p_user_id: userId,
  })

  if (error) {
    return { success: false, markedCount: 0 }
  }

  return { success: true, markedCount: data || 0 }
}

/**
 * Dismiss a notification
 */
export async function dismissNotification(
  notificationId: string,
  userId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
    .eq('id', notificationId)
    .or(`user_id.is.null,user_id.eq.${userId}`)

  return { success: !error }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(workspaceId: string, userId: string): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_unread_notification_count', {
    p_workspace_id: workspaceId,
    p_user_id: userId,
  })

  if (error) {
    // Fallback to direct count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .eq('is_read', false)
      .eq('is_dismissed', false)
      .or('expires_at.is.null,expires_at.gt.now()')

    return count || 0
  }

  return data || 0
}

// ============ Notification Preferences ============

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferences(
  userId: string,
  workspaceId: string
): Promise<NotificationPreferences> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .single()

  if (error || !data) {
    // Return defaults
    return {
      inAppEnabled: true,
      emailEnabled: true,
      emailFrequency: 'instant',
      typePreferences: {
        reply_received: { in_app: true, email: true },
        campaign_completed: { in_app: true, email: true },
        limit_reached: { in_app: true, email: true },
        bounce_detected: { in_app: true, email: false },
        experiment_winner: { in_app: true, email: true },
        lead_imported: { in_app: true, email: false },
        error_occurred: { in_app: true, email: true },
      },
      quietHoursEnabled: false,
      quietHoursStart: null,
      quietHoursEnd: null,
      quietHoursTimezone: 'America/New_York',
    }
  }

  return {
    inAppEnabled: data.in_app_enabled,
    emailEnabled: data.email_enabled,
    emailFrequency: data.email_frequency,
    typePreferences: data.type_preferences || {},
    quietHoursEnabled: data.quiet_hours_enabled,
    quietHoursStart: data.quiet_hours_start,
    quietHoursEnd: data.quiet_hours_end,
    quietHoursTimezone: data.quiet_hours_timezone,
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  workspaceId: string,
  preferences: Partial<NotificationPreferences>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() }

  if (preferences.inAppEnabled !== undefined) {
    updateData.in_app_enabled = preferences.inAppEnabled
  }
  if (preferences.emailEnabled !== undefined) {
    updateData.email_enabled = preferences.emailEnabled
  }
  if (preferences.emailFrequency) {
    updateData.email_frequency = preferences.emailFrequency
  }
  if (preferences.typePreferences) {
    updateData.type_preferences = preferences.typePreferences
  }
  if (preferences.quietHoursEnabled !== undefined) {
    updateData.quiet_hours_enabled = preferences.quietHoursEnabled
  }
  if (preferences.quietHoursStart !== undefined) {
    updateData.quiet_hours_start = preferences.quietHoursStart
  }
  if (preferences.quietHoursEnd !== undefined) {
    updateData.quiet_hours_end = preferences.quietHoursEnd
  }
  if (preferences.quietHoursTimezone) {
    updateData.quiet_hours_timezone = preferences.quietHoursTimezone
  }

  // Upsert preferences
  const { error } = await supabase.from('notification_preferences').upsert(
    {
      user_id: userId,
      workspace_id: workspaceId,
      ...updateData,
    },
    {
      onConflict: 'user_id,workspace_id',
    }
  )

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ============ Notification Helpers ============

/**
 * Create notification for reply received
 */
export async function notifyReplyReceived(
  workspaceId: string,
  leadName: string,
  conversationId: string,
  snippet: string
): Promise<void> {
  await createNotification({
    workspaceId,
    type: 'reply_received',
    category: 'action_required',
    title: `New reply from ${leadName}`,
    message: snippet.slice(0, 200) + (snippet.length > 200 ? '...' : ''),
    relatedType: 'conversation',
    relatedId: conversationId,
    actionUrl: `/conversations/${conversationId}`,
    actionLabel: 'View Conversation',
    priority: 10,
  })
}

/**
 * Create notification for campaign completed
 */
export async function notifyCampaignCompleted(
  workspaceId: string,
  campaignId: string,
  campaignName: string,
  stats: { sent: number; opened: number; replied: number }
): Promise<void> {
  await createNotification({
    workspaceId,
    type: 'campaign_completed',
    category: 'success',
    title: `Campaign "${campaignName}" completed`,
    message: `Sent ${stats.sent} emails, ${stats.opened} opened, ${stats.replied} replies`,
    relatedType: 'campaign',
    relatedId: campaignId,
    actionUrl: `/campaigns/${campaignId}`,
    actionLabel: 'View Results',
    priority: 5,
    metadata: stats,
  })
}

/**
 * Create notification for send limit reached
 */
export async function notifyLimitReached(
  workspaceId: string,
  limitType: 'campaign' | 'workspace',
  limit: number,
  campaignId?: string
): Promise<void> {
  await createNotification({
    workspaceId,
    type: 'limit_reached',
    category: 'warning',
    title: `${limitType === 'campaign' ? 'Campaign' : 'Daily'} send limit reached`,
    message: `You've reached your ${limitType} send limit of ${limit} emails. Remaining emails will be sent tomorrow.`,
    relatedType: campaignId ? 'campaign' : undefined,
    relatedId: campaignId,
    actionUrl: campaignId ? `/campaigns/${campaignId}/settings` : '/settings/limits',
    actionLabel: 'Manage Limits',
    priority: 8,
  })
}

/**
 * Create notification for A/B test winner
 */
export async function notifyExperimentWinner(
  workspaceId: string,
  campaignId: string,
  experimentName: string,
  winnerName: string,
  liftPercent: number
): Promise<void> {
  await createNotification({
    workspaceId,
    type: 'experiment_winner',
    category: 'success',
    title: `A/B Test Winner: ${winnerName}`,
    message: `"${experimentName}" has a winner with ${liftPercent.toFixed(1)}% improvement`,
    relatedType: 'campaign',
    relatedId: campaignId,
    actionUrl: `/campaigns/${campaignId}/experiments`,
    actionLabel: 'View Results',
    priority: 7,
  })
}

/**
 * Create notification for error
 */
export async function notifyError(
  workspaceId: string,
  errorType: string,
  errorMessage: string,
  relatedType?: string,
  relatedId?: string
): Promise<void> {
  await createNotification({
    workspaceId,
    type: 'error_occurred',
    category: 'error',
    title: `Error: ${errorType}`,
    message: errorMessage.slice(0, 500),
    relatedType,
    relatedId,
    priority: 15,
  })
}

// ============ Helper Functions ============

function mapNotification(row: any): Notification {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    type: row.type,
    category: row.category,
    title: row.title,
    message: row.message,
    relatedType: row.related_type,
    relatedId: row.related_id,
    actionUrl: row.action_url,
    actionLabel: row.action_label,
    isRead: row.is_read,
    readAt: row.read_at,
    isDismissed: row.is_dismissed,
    dismissedAt: row.dismissed_at,
    priority: row.priority,
    expiresAt: row.expires_at,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  }
}
