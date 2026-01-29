// Avatar Group Component
// Displays stacked avatars with overflow indicator

'use client'

import { LeadAvatar } from './LeadAvatar'
import { cn } from '@/lib/utils'

export interface AvatarGroupUser {
  id: string
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  imageUrl?: string | null
}

export interface AvatarGroupProps {
  users: AvatarGroupUser[]
  max?: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

export function AvatarGroup({
  users,
  max = 3,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const displayedUsers = users.slice(0, max)
  const remainingCount = Math.max(0, users.length - max)

  if (users.length === 0) {
    return null
  }

  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {displayedUsers.map((user, index) => (
        <div
          key={user.id}
          className="ring-2 ring-background rounded-full"
          style={{ zIndex: displayedUsers.length - index }}
        >
          <LeadAvatar
            firstName={user.firstName}
            lastName={user.lastName}
            email={user.email}
            imageUrl={user.imageUrl}
            size={size}
          />
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold ring-2 ring-background',
            {
              'h-4 w-4 text-[8px]': size === 'xs',
              'h-6 w-6 text-[10px]': size === 'sm',
              'h-8 w-8 text-xs': size === 'md',
              'h-10 w-10 text-sm': size === 'lg',
            }
          )}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
