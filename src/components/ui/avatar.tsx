'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn, getInitials } from '@/lib/design-system'

const avatarVariants = cva(
  'inline-flex items-center justify-center rounded-full font-medium overflow-hidden',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-[10px]',
        sm: 'h-8 w-8 text-xs',
        default: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
        '2xl': 'h-20 w-20 text-xl',
      },
      variant: {
        default: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary text-secondary-foreground',
        muted: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null
  alt?: string
  name?: string
  fallback?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, variant, src, alt, name, fallback, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false)

    const initials = React.useMemo(() => {
      if (fallback) return fallback
      if (name) return getInitials(name)
      return '?'
    }, [name, fallback])

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, variant, className }))}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    )
  }
)
Avatar.displayName = 'Avatar'

export { Avatar, avatarVariants }
