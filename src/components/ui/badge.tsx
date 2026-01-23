'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/design-system'

const badgeVariants = cva(
  'inline-flex items-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary text-secondary-foreground',
        success: 'bg-success-muted text-success',
        warning: 'bg-warning-muted text-warning',
        destructive: 'bg-destructive-muted text-destructive',
        info: 'bg-info-muted text-info',
        outline: 'text-foreground border border-border',
        muted: 'bg-muted text-muted-foreground',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-[10px]',
        default: 'px-2 py-0.5 text-xs',
        lg: 'px-2.5 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-success',
            variant === 'warning' && 'bg-warning',
            variant === 'destructive' && 'bg-destructive',
            variant === 'info' && 'bg-info',
            variant === 'default' && 'bg-primary',
            variant === 'secondary' && 'bg-secondary-foreground',
            variant === 'muted' && 'bg-muted-foreground'
          )}
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
