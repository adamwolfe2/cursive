'use client'

import Image from 'next/image'
import { cn } from '@/lib/design-system'

interface CursiveOrbProps {
  size?: number
  pulsing?: boolean
  className?: string
}

/**
 * Branded Cursive mark. Used as:
 *   - Empty-state logo (static, larger)
 *   - Pulsing "thinking" indicator (animated, smaller)
 */
export function CursiveOrb({ size = 48, pulsing = false, className }: CursiveOrbProps) {
  return (
    <div
      className={cn(
        'relative shrink-0',
        pulsing && 'animate-pulse',
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/cursive-logo.png"
        alt="Cursive"
        fill
        className="object-contain"
        priority={!pulsing}
      />
    </div>
  )
}
