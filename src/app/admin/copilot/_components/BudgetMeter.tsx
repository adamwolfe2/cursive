'use client'

import { useEffect, useState } from 'react'
import { DollarSign } from 'lucide-react'
import { cn } from '@/lib/design-system'

interface Budget {
  allowed: boolean
  spent_today: number
  cap: number
}

interface BudgetMeterProps {
  /** Bump to force a refresh (e.g. after a turn completes) */
  refreshKey?: number
}

export function BudgetMeter({ refreshKey = 0 }: BudgetMeterProps) {
  const [budget, setBudget] = useState<Budget | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/admin/copilot/budget')
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => {
        if (alive) setBudget(b)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [refreshKey])

  if (!budget) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <DollarSign className="h-3 w-3" />
        <span>—</span>
      </div>
    )
  }

  const pct = Math.min(100, (budget.spent_today / budget.cap) * 100)
  const tone = pct > 80 ? 'warning' : pct > 95 ? 'destructive' : 'normal'

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        <span className="tabular-nums font-medium text-foreground">
          ${budget.spent_today.toFixed(2)}
        </span>
        <span className="text-muted-foreground/60">/</span>
        <span className="tabular-nums">${budget.cap.toFixed(0)}</span>
        <span className="text-[10px] uppercase tracking-wide">today</span>
      </div>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            tone === 'normal' && 'bg-success',
            tone === 'warning' && 'bg-warning',
            tone === 'destructive' && 'bg-destructive'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
