'use client'

import { Badge } from '@/components/ui/badge'
import type { OutboundRunStatus } from '@/types/outbound'

export interface RunStatusBadgeProps {
  status: OutboundRunStatus | 'idle'
}

export function RunStatusBadge({ status }: RunStatusBadgeProps) {
  switch (status) {
    case 'running':
      return (
        <Badge variant="info" dot>
          Running
        </Badge>
      )
    case 'completed':
      return <Badge variant="success">Completed</Badge>
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>
    case 'cancelled':
      return <Badge variant="muted">Cancelled</Badge>
    case 'idle':
    default:
      return <Badge variant="muted">Idle</Badge>
  }
}
