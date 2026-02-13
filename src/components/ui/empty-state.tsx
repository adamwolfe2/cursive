'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import Link from 'next/link'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
    variant?: 'default' | 'outline' | 'secondary'
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 rounded-full bg-muted p-4">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {action && (
            action.href ? (
              <Button variant={action.variant || 'default'} asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button variant={action.variant || 'default'} onClick={action.onClick}>
                {action.label}
              </Button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Button variant="outline" asChild>
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            ) : (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Compact empty state variant - smaller, less padding
 */
export function EmptyStateCompact({
  icon,
  title,
  description,
  action,
  className,
}: Omit<EmptyStateProps, 'secondaryAction'>) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-8 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-3 rounded-full bg-muted p-3">
          {icon}
        </div>
      )}

      <h4 className="mb-1 text-sm font-semibold text-foreground">{title}</h4>
      {description && (
        <p className="mb-4 max-w-sm text-xs text-muted-foreground">{description}</p>
      )}

      {action && (
        action.href ? (
          <Button size="sm" variant={action.variant || 'default'} asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button size="sm" variant={action.variant || 'default'} onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
    </div>
  )
}

/**
 * Inline empty state - for tables, lists, etc.
 */
export function EmptyStateInline({
  icon,
  title,
  description,
  className,
}: Omit<EmptyStateProps, 'action' | 'secondaryAction'>) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-dashed p-6 text-left',
        className
      )}
    >
      {icon && (
        <div className="flex-shrink-0 rounded-full bg-muted p-2">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <h4 className="mb-0.5 text-sm font-semibold text-foreground">{title}</h4>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Card-style empty state - with border
 */
export function EmptyStateCard({
  icon,
  title,
  description,
  action,
  className,
}: Omit<EmptyStateProps, 'secondaryAction'>) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 py-12 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 rounded-full bg-background p-4 shadow-sm">
          {icon}
        </div>
      )}

      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mb-6 max-w-md text-sm text-muted-foreground">{description}</p>
      )}

      {action && (
        action.href ? (
          <Button variant={action.variant || 'default'} asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button variant={action.variant || 'default'} onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
    </div>
  )
}
