// Status Badge Component
// Displays status with appropriate colors

import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

type StatusVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'pending'

interface StatusBadgeProps {
  status: string
  variant?: StatusVariant
  icon?: LucideIcon
  size?: 'sm' | 'md'
  dot?: boolean
}

const variantStyles: Record<StatusVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success-muted text-success',
  warning: 'bg-warning-muted text-warning',
  error: 'bg-destructive-muted text-destructive',
  info: 'bg-info-muted text-info',
  pending: 'bg-muted text-muted-foreground',
}

const dotStyles: Record<StatusVariant, string> = {
  default: 'bg-muted-foreground',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-destructive',
  info: 'bg-info',
  pending: 'bg-muted-foreground',
}

export function StatusBadge({
  status,
  variant = 'default',
  icon: Icon,
  size = 'md',
  dot = false,
}: StatusBadgeProps) {
  const sizeStyles = {
    sm: 'h-5 px-2 text-[11px]',
    md: 'h-6 px-2.5 text-[12px]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        variantStyles[variant],
        sizeStyles[size]
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            dotStyles[variant]
          )}
        />
      )}
      {Icon && <Icon className="h-3 w-3" />}
      {status}
    </span>
  )
}

/**
 * Infer status variant from common status values
 */
export function inferStatusVariant(status: string): StatusVariant {
  const lowercaseStatus = status.toLowerCase()

  if (
    lowercaseStatus.includes('success') ||
    lowercaseStatus.includes('active') ||
    lowercaseStatus.includes('completed') ||
    lowercaseStatus.includes('approved') ||
    lowercaseStatus.includes('delivered')
  ) {
    return 'success'
  }

  if (
    lowercaseStatus.includes('pending') ||
    lowercaseStatus.includes('draft') ||
    lowercaseStatus.includes('scheduled')
  ) {
    return 'pending'
  }

  if (
    lowercaseStatus.includes('warning') ||
    lowercaseStatus.includes('attention') ||
    lowercaseStatus.includes('review')
  ) {
    return 'warning'
  }

  if (
    lowercaseStatus.includes('error') ||
    lowercaseStatus.includes('failed') ||
    lowercaseStatus.includes('rejected') ||
    lowercaseStatus.includes('cancelled')
  ) {
    return 'error'
  }

  if (
    lowercaseStatus.includes('info') ||
    lowercaseStatus.includes('processing')
  ) {
    return 'info'
  }

  return 'default'
}

/**
 * Smart status badge that infers variant
 */
export function SmartStatusBadge({
  status,
  ...props
}: Omit<StatusBadgeProps, 'variant'> & { variant?: StatusVariant }) {
  const variant = props.variant || inferStatusVariant(status)
  return <StatusBadge status={status} variant={variant} {...props} />
}
