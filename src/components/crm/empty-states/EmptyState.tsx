'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { animationVariants } from '@/lib/animations/variants'
import { useAnimationProps } from '@/hooks/use-reduced-motion'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  primaryAction?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * Professional empty state component
 * Inspired by Twenty CRM's empty states
 */
export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const bounceAnimation = useAnimationProps(animationVariants.emptyStateBounce)

  return (
    <motion.div
      className={cn(
        'flex h-full flex-col items-center justify-center py-12',
        className
      )}
      {...bounceAnimation}
    >
      {/* Icon */}
      <div className="mb-4 text-gray-400">{icon}</div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>

      {/* Description */}
      <p className="mb-6 max-w-sm text-center text-sm text-gray-500">
        {description}
      </p>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3">
          {primaryAction && (
            <Button onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  )
}
