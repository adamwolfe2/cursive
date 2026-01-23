'use client'

/**
 * Notification Center Component
 * OpenInfo Platform
 *
 * Real-time notifications with toast integration.
 */

import * as React from 'react'
import { cn } from '@/lib/design-system'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useNotificationUpdates } from '@/lib/realtime'
import { formatDistanceToNow } from 'date-fns'

// ============================================
// TYPES
// ============================================

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  created_at: string
}

export type NotificationType =
  | 'query_completed'
  | 'query_failed'
  | 'leads_ready'
  | 'export_ready'
  | 'credit_low'
  | 'subscription_updated'
  | 'system'

// ============================================
// NOTIFICATION ICON
// ============================================

function NotificationIcon({ type }: { type: NotificationType }) {
  const iconClasses = 'h-5 w-5'

  switch (type) {
    case 'query_completed':
      return (
        <svg className={cn(iconClasses, 'text-success')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'query_failed':
      return (
        <svg className={cn(iconClasses, 'text-destructive')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'leads_ready':
      return (
        <svg className={cn(iconClasses, 'text-info')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    case 'export_ready':
      return (
        <svg className={cn(iconClasses, 'text-primary')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )
    case 'credit_low':
      return (
        <svg className={cn(iconClasses, 'text-warning')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    case 'subscription_updated':
      return (
        <svg className={cn(iconClasses, 'text-success')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    default:
      return (
        <svg className={cn(iconClasses, 'text-muted-foreground')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
  }
}

// ============================================
// NOTIFICATION ITEM
// ============================================

interface NotificationItemProps {
  notification: Notification
  onRead: (id: string) => void
  onClick?: (notification: Notification) => void
}

function NotificationItem({ notification, onRead, onClick }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read) {
      onRead(notification.id)
    }
    onClick?.(notification)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 text-left rounded-lg transition-colors',
        notification.read
          ? 'bg-transparent hover:bg-muted/50'
          : 'bg-primary/5 hover:bg-primary/10'
      )}
    >
      <NotificationIcon type={notification.type} />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            notification.read ? 'text-foreground' : 'text-foreground'
          )}
        >
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
      {!notification.read && (
        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
      )}
    </button>
  )
}

// ============================================
// NOTIFICATION CENTER
// ============================================

interface NotificationCenterProps {
  userId: string
  notifications: Notification[]
  isLoading?: boolean
  onRead: (id: string) => void
  onReadAll: () => void
  onClick?: (notification: Notification) => void
  className?: string
}

export function NotificationCenter({
  userId,
  notifications,
  isLoading,
  onRead,
  onReadAll,
  onClick,
  className,
}: NotificationCenterProps) {
  const { addToast } = useToast()

  // Subscribe to new notifications
  useNotificationUpdates(
    userId,
    (payload) => {
      if (payload.eventType === 'INSERT') {
        const newNotification = payload.new as Notification
        addToast({
          title: newNotification.title,
          description: newNotification.message,
          variant: newNotification.type === 'query_failed' ? 'error' : 'default',
        })
      }
    },
    !!userId
  )

  const unreadCount = notifications.filter((n) => !n.read).length

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Spinner size="md" />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="default" size="sm">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReadAll}>
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto max-h-96">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg
              className="h-12 w-12 text-muted-foreground/30 mb-3"
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
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={onRead}
                onClick={onClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// NOTIFICATION BELL
// ============================================

interface NotificationBellProps {
  count: number
  onClick: () => void
  className?: string
}

export function NotificationBell({ count, onClick, className }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
        className
      )}
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}

// ============================================
// NOTIFICATION DROPDOWN
// ============================================

interface NotificationDropdownProps {
  userId: string
  notifications: Notification[]
  isLoading?: boolean
  onRead: (id: string) => void
  onReadAll: () => void
  onClick?: (notification: Notification) => void
}

export function NotificationDropdown({
  userId,
  notifications,
  isLoading,
  onRead,
  onReadAll,
  onClick,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const unreadCount = notifications.filter((n) => !n.read).length

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

  return (
    <div className="relative" ref={dropdownRef}>
      <NotificationBell count={unreadCount} onClick={() => setIsOpen(!isOpen)} />

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 z-dropdown shadow-enterprise-lg">
          <NotificationCenter
            userId={userId}
            notifications={notifications}
            isLoading={isLoading}
            onRead={onRead}
            onReadAll={onReadAll}
            onClick={(n) => {
              onClick?.(n)
              setIsOpen(false)
            }}
          />
        </Card>
      )}
    </div>
  )
}
