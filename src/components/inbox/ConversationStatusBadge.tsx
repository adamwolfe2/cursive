'use client'

import type { ConversationStage } from '@/types/sdr'

const STAGE_STYLES: Record<ConversationStage, string> = {
  new: 'bg-gray-100 text-gray-600',
  engaged: 'bg-blue-100 text-blue-700',
  qualifying: 'bg-yellow-100 text-yellow-700',
  scheduling: 'bg-orange-100 text-orange-700',
  booked: 'bg-green-100 text-green-700',
  closed: 'bg-green-200 text-green-800',
  lost: 'bg-red-100 text-red-700',
}

interface ConversationStatusBadgeProps {
  readonly stage: ConversationStage
}

export function ConversationStatusBadge({ stage }: ConversationStatusBadgeProps) {
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STAGE_STYLES[stage] || 'bg-gray-100 text-gray-600'}`}
    >
      {stage}
    </span>
  )
}
