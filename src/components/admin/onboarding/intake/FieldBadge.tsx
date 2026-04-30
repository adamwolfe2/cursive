'use client'

import type { FieldStatus } from '@/types/onboarding-templates'

interface FieldBadgeProps {
  status: FieldStatus
}

const BADGE_STYLES: Record<FieldStatus, { label: string; className: string }> = {
  ai_filled: {
    label: 'AI',
    className: 'bg-blue-100 text-blue-700',
  },
  inferred: {
    label: 'Inferred',
    className: 'bg-amber-100 text-amber-700',
  },
  needs_input: {
    label: 'Needs input',
    className: 'bg-orange-100 text-orange-700',
  },
  manual: {
    label: '',
    className: '',
  },
}

export default function FieldBadge({ status }: FieldBadgeProps) {
  if (status === 'manual') return null

  const { label, className } = BADGE_STYLES[status]

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${className}`}
    >
      {label}
    </span>
  )
}
