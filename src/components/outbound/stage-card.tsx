'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/design-system'

export interface StageCardProps {
  label: string
  count: number
  subtitle: string
  icon: ReactNode
  active?: boolean
  warning?: string | null
  toggle?: { state: 'auto' | 'stopped'; onChange?: (next: 'auto' | 'stopped') => void }
}

/**
 * One stage in the 6-stage pipeline. Mirrors the Rox card visual:
 *   icon (top-right blue) + label (top-left) + big number + subtitle.
 *
 * White card; primary-blue accent on the active stage's left border.
 */
export function StageCard({ label, count, subtitle, icon, active, warning, toggle }: StageCardProps) {
  return (
    <Card
      variant="elevated"
      className={cn(
        'p-5 transition-all',
        active && 'border-l-4 border-l-primary',
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
            {count}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          {toggle && (
            <Badge variant={toggle.state === 'auto' ? 'success' : 'muted'} className="text-xs">
              {toggle.state === 'auto' ? 'Auto' : 'Stopped'}
            </Badge>
          )}
        </div>
      </div>

      {warning && (
        <div className="mt-3 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
          {warning}
        </div>
      )}
    </Card>
  )
}
