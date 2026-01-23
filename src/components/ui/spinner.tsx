'use client'

import * as React from 'react'
import { cn } from '@/lib/design-system'

interface SpinnerProps extends React.SVGAttributes<SVGElement> {
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl'
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  default: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
}

export function Spinner({ size = 'default', className, ...props }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin', sizeClasses[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export function LoadingOverlay({
  message = 'Loading...',
  className,
}: {
  message?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50',
        className
      )}
    >
      <Spinner size="lg" className="text-primary" />
      {message && (
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  )
}

export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <Spinner size="xl" className="text-primary" />
      {message && (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  )
}
