'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { useSafeAnimation } from '@/hooks/use-reduced-motion'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/**
 * Empty state component with gentle bounce-in animation
 * Use this when displaying "no results" or "no data" states
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  const safeAnimation = useSafeAnimation()

  const content = (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {icon && (
        <div className="mb-4 text-muted-foreground opacity-50">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  )

  if (!safeAnimation) {
    return content
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
        duration: 0.5,
      }}
    >
      {content}
    </motion.div>
  )
}
