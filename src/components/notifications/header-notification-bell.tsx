'use client'

/**
 * Header Notification Bell
 *
 * Client-side wrapper that fetches notifications from the API
 * and renders the NotificationDropdown in the header.
 * Uses React Query for polling consistency with the rest of the app.
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { NotificationBell } from './notification-center'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/design-system'
import { formatDistanceToNow } from 'date-fns'
import { queryDefaults } from '@/lib/hooks/query-defaults'

interface ApiNotification {
  id: string
  type: string
  category: string
  title: string
  message: string
  action_url: string | null
  action_label: string | null
  is_read: boolean
  created_at: string
}

async function fetchNotificationCount(): Promise<number> {
  const res = await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'get_count' }),
  })
  if (!res.ok) return 0
  const { data } = await res.json()
  return data?.unread_count ?? 0
}

async function fetchNotifications(): Promise<{
  notifications: ApiNotification[]
  unread_count: number
}> {
  const res = await fetch('/api/notifications?limit=20')
  if (!res.ok) return { notifications: [], unread_count: 0 }
  const { data } = await res.json()
  return {
    notifications: data?.notifications ?? [],
    unread_count: data?.unread_count ?? 0,
  }
}

export function HeaderNotificationBell() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Poll unread count every 60s (same interval as the old setInterval)
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: fetchNotificationCount,
    refetchInterval: 60_000,
    ...queryDefaults.realtime,
  })

  // Fetch full notifications only when dropdown is open
  const {
    data: notificationsData,
    isLoading,
  } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: fetchNotifications,
    enabled: isOpen,
    ...queryDefaults.realtime,
  })

  const notifications = notificationsData?.notifications ?? []
  // When the dropdown is open and we have fresh data, prefer its unread_count
  const displayCount = isOpen && notificationsData
    ? notificationsData.unread_count
    : unreadCount

  const handleToggle = () => {
    const opening = !isOpen
    setIsOpen(opening)
    if (opening) {
      // Refetch notifications list when opening
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
    }
  }

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      })
      if (res.ok) {
        // Optimistically update the list cache
        queryClient.setQueryData<{ notifications: ApiNotification[]; unread_count: number }>(
          ['notifications', 'list'],
          (old) => {
            if (!old) return old
            return {
              notifications: old.notifications.map((n) =>
                n.id === id ? { ...n, is_read: true } : n
              ),
              unread_count: Math.max(0, old.unread_count - 1),
            }
          }
        )
        // Update the count cache too
        queryClient.setQueryData<number>(
          ['notifications', 'count'],
          (old) => Math.max(0, (old ?? 1) - 1)
        )
      }
    } catch {
      // Silent fail — non-critical
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      })
      if (res.ok) {
        queryClient.setQueryData<{ notifications: ApiNotification[]; unread_count: number }>(
          ['notifications', 'list'],
          (old) => {
            if (!old) return old
            return {
              notifications: old.notifications.map((n) => ({ ...n, is_read: true })),
              unread_count: 0,
            }
          }
        )
        queryClient.setQueryData<number>(['notifications', 'count'], 0)
      }
    } catch {
      // Silent fail — non-critical
    }
  }

  const handleNotificationClick = (notification: ApiNotification) => {
    if (!notification.is_read) {
      handleMarkRead(notification.id)
    }
    if (notification.action_url) {
      router.push(notification.action_url)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <NotificationBell count={displayCount} onClick={handleToggle} />

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 z-50 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground text-sm">Notifications</span>
              {displayCount > 0 && (
                <Badge variant="default" size="sm">
                  {displayCount}
                </Badge>
              )}
            </div>
            {displayCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                Mark all read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <svg
                  className="h-10 w-10 text-muted-foreground/30 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p className="text-sm text-muted-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  You&apos;ll see lead alerts, campaign updates, and more here.
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 text-left rounded-lg transition-colors',
                      notification.is_read
                        ? 'hover:bg-muted/50'
                        : 'bg-primary/5 hover:bg-primary/10'
                    )}
                  >
                    <NotificationIcon category={notification.category} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  router.push('/settings/notifications')
                  setIsOpen(false)
                }}
              >
                Notification Settings
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

function NotificationIcon({ category }: { category: string }) {
  const base = 'h-4 w-4 mt-0.5 flex-shrink-0'
  switch (category) {
    case 'success':
      return (
        <svg className={cn(base, 'text-emerald-500')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'warning':
      return (
        <svg className={cn(base, 'text-amber-500')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    case 'error':
      return (
        <svg className={cn(base, 'text-red-500')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'action_required':
      return (
        <svg className={cn(base, 'text-indigo-500')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    default:
      return (
        <svg className={cn(base, 'text-blue-500')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
  }
}
