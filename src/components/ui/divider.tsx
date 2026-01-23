'use client'

import * as React from 'react'
import { cn } from '@/lib/design-system'

interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  label?: string
  className?: string
}

export function Divider({
  orientation = 'horizontal',
  label,
  className,
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        className={cn('h-full w-px bg-border', className)}
        role="separator"
        aria-orientation="vertical"
      />
    )
  }

  if (label) {
    return (
      <div
        className={cn('flex items-center gap-4', className)}
        role="separator"
        aria-orientation="horizontal"
      >
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
    )
  }

  return (
    <div
      className={cn('h-px w-full bg-border', className)}
      role="separator"
      aria-orientation="horizontal"
    />
  )
}
