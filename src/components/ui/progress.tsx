'use client'

import * as React from 'react'
import { cn } from '@/lib/design-system'

interface ProgressProps {
  value: number
  max?: number
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'destructive'
  showLabel?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-1',
  default: 'h-2',
  lg: 'h-3',
}

const variantClasses = {
  default: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
}

export function Progress({
  value,
  max = 100,
  size = 'default',
  variant = 'default',
  showLabel = false,
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={cn('w-full overflow-hidden rounded-full bg-muted', sizeClasses[size])}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            variantClasses[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

interface ProgressCircularProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  variant?: 'default' | 'success' | 'warning' | 'destructive'
  showLabel?: boolean
  className?: string
}

export function ProgressCircular({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  variant = 'default',
  showLabel = false,
  className,
}: ProgressCircularProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  const strokeColors = {
    default: 'stroke-primary',
    success: 'stroke-success',
    warning: 'stroke-warning',
    destructive: 'stroke-destructive',
  }

  return (
    <div className={cn('relative inline-flex', className)}>
      <svg
        width={size}
        height={size}
        className="-rotate-90 transform"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={cn(strokeColors[variant], 'transition-all duration-300')}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  )
}
