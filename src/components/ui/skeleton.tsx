'use client'

import * as React from 'react'
import { cn } from '@/lib/design-system'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted',
        variant === 'default' && 'rounded-md',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-none',
        className
      )}
      style={{
        width: width,
        height: height,
        ...style,
      }}
      {...props}
    />
  )
}

function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && 'w-4/5'
          )}
        />
      ))}
    </div>
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-6 space-y-4',
        className
      )}
    >
      <Skeleton className="h-5 w-1/3" />
      <SkeletonText lines={2} />
    </div>
  )
}

function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={cn('rounded-lg border border-border overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-muted/50 border-b border-border p-4 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Body */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonAvatar({
  size = 'default',
  className,
}: {
  size?: 'sm' | 'default' | 'lg'
  className?: string
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  return (
    <Skeleton
      variant="circular"
      className={cn(sizeClasses[size], className)}
    />
  )
}

function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-5',
        className
      )}
    >
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-8 w-1/3" />
      <div className="flex items-center gap-2 mt-3">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonAvatar,
  SkeletonStatCard,
}
