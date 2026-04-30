import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type {
  AutoresearchProgram,
  AutoresearchExperiment,
  WinningPattern,
  ProgramStatus,
} from '@/types/autoresearch'
import { FlaskConical, Clock, TrendingUp, Trophy } from 'lucide-react'
import ExperimentTimeline from '@/components/admin/autoresearch/ExperimentTimeline'
import WinningPatternsLibrary from '@/components/admin/autoresearch/WinningPatternsLibrary'
import ProgramDetailHeader from './ProgramDetailHeader'

const STATUS_BADGE: Record<ProgramStatus, { variant: 'success' | 'warning' | 'muted' | 'default'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  paused: { variant: 'warning', label: 'Paused' },
  draft: { variant: 'muted', label: 'Draft' },
  completed: { variant: 'default', label: 'Completed' },
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

function getTimeRemainingPercent(experiment: AutoresearchExperiment): number {
  if (!experiment.started_at || !experiment.evaluation_at) return 0
  const start = new Date(experiment.started_at).getTime()
  const end = new Date(experiment.evaluation_at).getTime()
  const now = Date.now()
  if (now >= end) return 100
  if (now <= start) return 0
  return Math.round(((now - start) / (end - start)) * 100)
}

function getTimeRemainingLabel(experiment: AutoresearchExperiment): string {
  if (!experiment.evaluation_at) return 'Unknown'
  const end = new Date(experiment.evaluation_at).getTime()
  const diff = end - Date.now()
  if (diff <= 0) return 'Evaluating soon'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'Less than 1h'
  if (hours < 24) return `${hours}h remaining`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h remaining`
}

interface PageProps {
  params: Promise<{ programId: string }>
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { programId } = await params
  const supabase = createAdminClient()

  const [programResult, experimentsResult, patternsResult] = await Promise.all([
    supabase
      .from('autoresearch_programs')
      .select('*')
      .eq('id', programId)
      .single(),
    supabase
      .from('autoresearch_experiments')
      .select('*')
      .eq('program_id', programId)
      .order('experiment_number', { ascending: false }),
    supabase
      .from('winning_patterns')
      .select('*')
      .eq('program_id', programId)
      .order('created_at', { ascending: false }),
  ])

  if (programResult.error || !programResult.data) {
    notFound()
  }

  const program = programResult.data as AutoresearchProgram
  const experiments = (experimentsResult.data ?? []) as AutoresearchExperiment[]
  const patterns = (patternsResult.data ?? []) as WinningPattern[]
  const badge = STATUS_BADGE[program.status]

  const activeExperiment = experiments.find(
    (e) => e.status === 'active' || e.status === 'generating' || e.status === 'waiting'
  )
  const pastExperiments = experiments.filter(
    (e) => e.status === 'completed' || e.status === 'failed' || e.status === 'cancelled'
  )

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <ProgramDetailHeader program={program} badge={badge} />

      {/* Baseline card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Current Baseline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Subject Line</p>
              <p className="text-sm font-medium text-foreground">
                {program.baseline_subject ?? 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Body Preview</p>
              <p className="text-sm text-foreground line-clamp-3">
                {program.baseline_body ?? 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Positive Reply Rate</p>
              <p className="text-2xl font-bold text-foreground">
                {formatRate(program.baseline_positive_reply_rate)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {program.total_sends.toLocaleString()} total sends
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active experiment */}
      {activeExperiment ? (
        <Card className="mb-6 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="h-4 w-4 text-blue-600" />
              Active Experiment #{activeExperiment.experiment_number}
              <Badge variant="info" size="sm">
                {activeExperiment.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Hypothesis</p>
                <p className="text-sm text-foreground">{activeExperiment.hypothesis}</p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Element Tested</p>
                  <Badge variant="outline" size="sm">
                    {activeExperiment.element_tested.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Variants</p>
                  <p className="text-sm font-medium">
                    {activeExperiment.challenger_variant_ids.length + 1}
                  </p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {getTimeRemainingLabel(activeExperiment)}
                  </div>
                  <span className="text-xs font-medium">
                    {getTimeRemainingPercent(activeExperiment)}%
                  </span>
                </div>
                <Progress
                  value={getTimeRemainingPercent(activeExperiment)}
                  size="sm"
                  variant="default"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent>
            <div className="text-center py-8">
              <FlaskConical className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active experiment</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experiment timeline */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Experiment History
        </h2>
        <ExperimentTimeline experiments={pastExperiments} />
      </div>

      {/* Winning patterns */}
      {patterns.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Winning Patterns
          </h2>
          <WinningPatternsLibrary patterns={patterns} />
        </div>
      )}
    </div>
  )
}
