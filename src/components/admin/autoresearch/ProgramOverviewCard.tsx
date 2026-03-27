'use client'

import Link from 'next/link'
import type { AutoresearchProgram, ProgramStatus } from '@/types/autoresearch'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FlaskConical, Play, Pause, Eye } from 'lucide-react'

interface Props {
  program: AutoresearchProgram
  onStart?: (programId: string) => void
  onPause?: (programId: string) => void
}

const STATUS_BADGE: Record<ProgramStatus, { variant: 'success' | 'warning' | 'muted' | 'default'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  paused: { variant: 'warning', label: 'Paused' },
  draft: { variant: 'muted', label: 'Draft' },
  completed: { variant: 'default', label: 'Completed' },
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

export default function ProgramOverviewCard({ program, onStart, onPause }: Props) {
  const badge = STATUS_BADGE[program.status]
  const winRate = program.total_experiments_run > 0
    ? Math.round((program.total_wins / program.total_experiments_run) * 100)
    : 0

  return (
    <Card variant="interactive" padding="sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <h3 className="text-sm font-semibold text-foreground truncate">
              {program.name}
            </h3>
            <Badge variant={badge.variant} size="sm" dot>
              {badge.label}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Experiments</p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {program.total_experiments_run}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Win Rate
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {winRate}%
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">PRR</p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {formatRate(program.baseline_positive_reply_rate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <Link href={`/admin/autoresearch/${program.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full" leftIcon={<Eye className="h-3.5 w-3.5" />}>
            View
          </Button>
        </Link>
        {program.status === 'active' && onPause && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPause(program.id)}
            leftIcon={<Pause className="h-3.5 w-3.5" />}
          >
            Pause
          </Button>
        )}
        {(program.status === 'draft' || program.status === 'paused') && onStart && (
          <Button
            variant="success"
            size="sm"
            onClick={() => onStart(program.id)}
            leftIcon={<Play className="h-3.5 w-3.5" />}
          >
            Start
          </Button>
        )}
      </div>
    </Card>
  )
}
