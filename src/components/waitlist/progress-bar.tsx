/**
 * Progress Bar Component
 * Shows step progress in the waitlist flow
 */

'use client'

import { motion } from 'framer-motion'

interface ProgressBarProps {
  current: number
  total: number
  label?: string
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const progress = current / total

  return (
    <div className="w-full mb-8">
      {label && (
        <div className="text-sm text-muted-foreground mb-2 font-medium">
          {label}
        </div>
      )}
      <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ transformOrigin: 'left' }}
        />
      </div>
    </div>
  )
}
