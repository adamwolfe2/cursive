'use client'

import { cn } from '@/lib/utils'

interface IntentBadgeProps {
  score: 'hot' | 'warm' | 'cold'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function IntentBadge({
  score,
  size = 'md',
  showLabel = true,
  className,
}: IntentBadgeProps) {
  const config = {
    hot: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      ring: 'ring-red-600/20',
      dot: 'bg-red-600',
      label: 'Hot',
    },
    warm: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      ring: 'ring-amber-600/20',
      dot: 'bg-amber-600',
      label: 'Warm',
    },
    cold: {
      bg: 'bg-zinc-50',
      text: 'text-zinc-700',
      ring: 'ring-zinc-600/20',
      dot: 'bg-zinc-600',
      label: 'Cold',
    },
  }

  const sizeConfig = {
    sm: {
      badge: 'px-2 py-0.5 text-xs',
      dot: 'h-1.5 w-1.5',
    },
    md: {
      badge: 'px-2.5 py-1 text-[13px]',
      dot: 'h-2 w-2',
    },
    lg: {
      badge: 'px-3 py-1.5 text-sm',
      dot: 'h-2.5 w-2.5',
    },
  }

  const { bg, text, ring, dot, label } = config[score]
  const { badge, dot: dotSize } = sizeConfig[size]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset',
        bg,
        text,
        ring,
        badge,
        className
      )}
    >
      <span className={cn('rounded-full', dot, dotSize)} />
      {showLabel && label}
    </span>
  )
}
