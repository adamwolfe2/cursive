// Status Badge Component
// Displays lead status with colored dot indicator, matching Twenty's design

import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { LeadStatus } from '@/types/crm.types'

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1 px-2 h-5 text-sm font-medium rounded whitespace-nowrap',
  {
    variants: {
      status: {
        new: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
        contacted:
          'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
        qualified:
          'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
        won: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
        lost: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
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
        className: 'border-purple-200 text-purple-700 dark:border-purple-800',
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

const statusDotVariants = cva('h-1 w-1 rounded-full', {
  variants: {
    status: {
      new: 'bg-blue-500',
      contacted: 'bg-yellow-500',
      qualified: 'bg-purple-500',
      won: 'bg-green-500',
      lost: 'bg-gray-400',
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
