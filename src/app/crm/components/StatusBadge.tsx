// Status Badge Component
// Displays lead status with colored dot indicator, matching Twenty's design

import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { LeadStatus } from '@/types/crm.types'

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-1 h-6 text-xs font-medium rounded-full whitespace-nowrap transition-all duration-200 shadow-sm ring-1 ring-inset',
  {
    variants: {
      status: {
        new: 'bg-blue-50/80 text-blue-700 ring-blue-200/50 dark:bg-blue-950 dark:text-blue-300',
        contacted:
          'bg-yellow-50/80 text-yellow-700 ring-yellow-200/50 dark:bg-yellow-950 dark:text-yellow-300',
        qualified:
          'bg-emerald-50/80 text-emerald-700 ring-emerald-200/50 dark:bg-emerald-950 dark:text-emerald-300',
        won: 'bg-green-50/80 text-green-700 ring-green-200/50 dark:bg-green-950 dark:text-green-300',
        lost: 'bg-zinc-50/80 text-zinc-600 ring-zinc-200/50 dark:bg-zinc-800 dark:text-zinc-300',
      },
      variant: {
        solid: '',
        outline: 'bg-transparent border',
      },
    },
    compoundVariants: [
      {
        status: 'new',
        variant: 'outline',
        className: 'border-blue-200 text-blue-700 dark:border-blue-800',
      },
      {
        status: 'contacted',
        variant: 'outline',
        className: 'border-yellow-200 text-yellow-700 dark:border-yellow-800',
      },
      {
        status: 'qualified',
        variant: 'outline',
        className: 'border-blue-200 text-blue-700 dark:border-blue-800',
      },
      {
        status: 'won',
        variant: 'outline',
        className: 'border-green-200 text-green-700 dark:border-green-800',
      },
      {
        status: 'lost',
        variant: 'outline',
        className: 'border-gray-200 text-gray-700 dark:border-gray-700',
      },
    ],
    defaultVariants: {
      status: 'new',
      variant: 'solid',
    },
  }
)

const statusDotVariants = cva('h-1.5 w-1.5 rounded-full shadow-sm', {
  variants: {
    status: {
      new: 'bg-blue-500 shadow-blue-500/50',
      contacted: 'bg-yellow-500 shadow-yellow-500/50',
      qualified: 'bg-emerald-500 shadow-emerald-500/50',
      won: 'bg-green-500 shadow-green-500/50',
      lost: 'bg-zinc-400 shadow-zinc-400/30',
    },
  },
  defaultVariants: {
    status: 'new',
  },
})

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
}

export interface StatusBadgeProps
  extends VariantProps<typeof statusBadgeVariants> {
  status: LeadStatus
  className?: string
  showDot?: boolean
}

export function StatusBadge({
  status,
  variant = 'solid',
  className,
  showDot = true,
}: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ status, variant }), className)}>
      {showDot && (
        <span
          className={statusDotVariants({ status })}
          role="presentation"
          aria-hidden="true"
        />
      )}
      <span>{STATUS_LABELS[status]}</span>
    </div>
  )
}
