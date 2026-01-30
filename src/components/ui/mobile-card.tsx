'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MobileCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  selected?: boolean
}

/**
 * Mobile-optimized card for table row data
 * Replaces horizontal scroll tables on mobile
 */
export function MobileCard({ children, className, onClick, selected }: MobileCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-blue-100/50 p-4 space-y-3 transition-all',
        onClick && 'cursor-pointer hover:shadow-md active:scale-[0.98]',
        selected && 'ring-2 ring-primary border-primary',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

/**
 * Card header with title and badge/status
 */
interface MobileCardHeaderProps {
  title: string
  subtitle?: string
  badge?: ReactNode
  avatar?: ReactNode
}

export function MobileCardHeader({ title, subtitle, badge, avatar }: MobileCardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {avatar && <div className="flex-shrink-0">{avatar}</div>}
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground truncate">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {badge && <div className="flex-shrink-0">{badge}</div>}
    </div>
  )
}

/**
 * Card content with key-value pairs
 */
interface MobileCardFieldProps {
  label: string
  value: ReactNode
  icon?: ReactNode
}

export function MobileCardField({ label, value, icon }: MobileCardFieldProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="text-sm text-foreground font-medium text-right">{value}</div>
    </div>
  )
}

/**
 * Card section divider
 */
export function MobileCardDivider() {
  return <div className="border-t border-blue-100/50" />
}

/**
 * Card footer with actions
 */
interface MobileCardFooterProps {
  children: ReactNode
  className?: string
}

export function MobileCardFooter({ children, className }: MobileCardFooterProps) {
  return (
    <div className={cn('flex items-center gap-2 pt-2', className)}>
      {children}
    </div>
  )
}

/**
 * Card meta info (small text at bottom)
 */
interface MobileCardMetaProps {
  children: ReactNode
}

export function MobileCardMeta({ children }: MobileCardMetaProps) {
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      {children}
    </div>
  )
}

/**
 * Example usage:
 *
 * <MobileCard>
 *   <MobileCardHeader
 *     title="John Doe"
 *     subtitle="Senior Developer"
 *     badge={<Badge>Active</Badge>}
 *   />
 *   <MobileCardField label="Email" value="john@example.com" />
 *   <MobileCardField label="Phone" value="+1 (555) 123-4567" />
 *   <MobileCardDivider />
 *   <MobileCardFooter>
 *     <Button size="sm" variant="outline">View</Button>
 *     <Button size="sm">Contact</Button>
 *   </MobileCardFooter>
 * </MobileCard>
 */
