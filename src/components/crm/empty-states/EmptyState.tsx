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
        'flex h-full flex-col items-center justify-center py-12 px-6',
        className
      )}
      {...bounceAnimation}
    >
      {/* Icon with gradient background */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 text-zinc-400 shadow-sm ring-1 ring-zinc-200/50">
        {icon}
      </div>

      {/* Title */}
      <h3 className="mb-2 text-xl font-bold text-zinc-900 tracking-tight">{title}</h3>

      {/* Description */}
      <p className="mb-8 max-w-sm text-center text-sm text-zinc-500 leading-relaxed">
        {description}
      </p>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3">
          {primaryAction && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={primaryAction.onClick} className="shadow-sm">
                {primaryAction.label}
              </Button>
            </motion.div>
          )}
          {secondaryAction && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" onClick={secondaryAction.onClick} className="shadow-sm">
                {secondaryAction.label}
              </Button>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  )
}
