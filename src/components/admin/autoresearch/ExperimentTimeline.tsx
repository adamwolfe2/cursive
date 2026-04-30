'use client'

import type { AutoresearchExperiment, ResultStatus } from '@/types/autoresearch'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { TrendingUp, Minus, AlertTriangle } from 'lucide-react'

interface Props {
  experiments: AutoresearchExperiment[]
}

const RESULT_CONFIG: Record<ResultStatus, {
  variant: 'success' | 'muted' | 'warning' | 'default'
  label: string
  Icon: typeof TrendingUp
}> = {
  winner_found: { variant: 'success', label: 'Winner', Icon: TrendingUp },
  no_winner: { variant: 'muted', label: 'No Winner', Icon: Minus },
  insufficient_data: { variant: 'warning', label: 'Insufficient Data', Icon: AlertTriangle },
  extended: { variant: 'default', label: 'Extended', Icon: Minus },
  baseline_kept: { variant: 'muted', label: 'Baseline Kept', Icon: Minus },
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ExperimentTimeline({ experiments }: Props) {
  if (experiments.length === 0) {
    return (
      <Card padding="lg">
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No completed experiments yet.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-4">
        {experiments.map((experiment) => {
          const result = experiment.result_status
            ? RESULT_CONFIG[experiment.result_status]
            : null
          const ResultIcon = result?.Icon ?? Minus

          return (
            <div key={experiment.id} className="relative pl-12">
              {/* Timeline dot */}
              <div
                className={`absolute left-3.5 top-4 h-3 w-3 rounded-full border-2 border-background ${
                  experiment.result_status === 'winner_found'
                    ? 'bg-green-500'
                    : experiment.result_status === 'insufficient_data'
                      ? 'bg-yellow-500'
                      : 'bg-muted-foreground/40'
                }`}
              />

              <Card padding="sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">
                        #{experiment.experiment_number}
                      </span>
                      <Badge variant="outline" size="sm">
                        {experiment.element_tested.replace(/_/g, ' ')}
                      </Badge>
                      {result && (
                        <Badge variant={result.variant} size="sm" dot>
                          <ResultIcon className="h-3 w-3 mr-1" />
                          {result.label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {experiment.hypothesis}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {experiment.lift_percent !== null && experiment.result_status === 'winner_found' && (
                      <p className="text-sm font-bold text-green-600">
                        +{experiment.lift_percent.toFixed(1)}% lift
                      </p>
                    )}
                    {experiment.confidence_level !== null && (
                      <p className="text-xs text-muted-foreground">
                        {(experiment.confidence_level * 100).toFixed(0)}% confidence
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(experiment.completed_at)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
