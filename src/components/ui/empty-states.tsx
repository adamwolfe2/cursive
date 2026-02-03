/**
 * Standardized Empty States
 * Consistent empty state UX with clear CTAs
 */

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/design-system'
import { Button } from './button'
import { GradientCard } from './gradient-card'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <GradientCard variant="subtle" className={cn('text-center py-12', className)}>
      {Icon && (
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex gap-3 justify-center">
          {action && (
            <Button onClick={action.onClick} size="lg">
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline" size="lg">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </GradientCard>
  )
}
