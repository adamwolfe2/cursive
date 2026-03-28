'use client'

/**
 * A/B Testing Panel
 * Manage A/B experiments for an email sequence
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FlaskConical, Trophy, AlertCircle, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { safeError } from '@/lib/utils/log-sanitizer'

// ─── Types ──────────────────────────────────────────────────────────────────

type TestType = 'subject' | 'body' | 'full_template' | 'send_time'
type SuccessMetric = 'open_rate' | 'click_rate' | 'reply_rate' | 'conversion_rate'
type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled'

interface VariantResult {
  variantId: string
  name: string
  isControl: boolean
  emailsSent: number
  emailsDelivered: number
  emailsOpened: number
  emailsClicked: number
  emailsReplied: number
  openRate: number
  clickRate: number
  replyRate: number
  sampleSize: number
}

interface Experiment {
  id: string
  campaign_id: string
  name: string
  description?: string
  test_type: TestType
  success_metric: SuccessMetric
  minimum_sample_size: number
  confidence_level: number
  status: ExperimentStatus
  winner_variant_id?: string
  statistical_significance?: number
  started_at?: string
  ended_at?: string
  winner_variant?: { id: string; name: string } | null
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const TEST_TYPE_LABELS: Record<TestType, string> = {
  subject: 'Subject Line',
  body: 'Email Body',
  full_template: 'Full Template',
  send_time: 'Send Time',
}

const METRIC_LABELS: Record<SuccessMetric, string> = {
  open_rate: 'Open Rate',
  click_rate: 'Click Rate',
  reply_rate: 'Reply Rate',
  conversion_rate: 'Conversion Rate',
}

const STATUS_COLORS: Record<ExperimentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  running: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
}

function metricValue(variant: VariantResult, metric: SuccessMetric): number {
  switch (metric) {
    case 'open_rate':
      return variant.openRate
    case 'click_rate':
      return variant.clickRate
    case 'reply_rate':
    case 'conversion_rate':
      return variant.replyRate
  }
}

// ─── Create Experiment Form ──────────────────────────────────────────────────

interface CreateExperimentFormProps {
  sequenceId: string
  onSuccess: () => void
  onClose: () => void
}

function CreateExperimentForm({ sequenceId, onSuccess, onClose }: CreateExperimentFormProps) {
  const [testType, setTestType] = useState<TestType>('subject')
  const [successMetric, setSuccessMetric] = useState<SuccessMetric>('open_rate')
  const [minSample, setMinSample] = useState(50)
  const [confidenceLevel, setConfidenceLevel] = useState(95)
  const [name, setName] = useState('')
  const [variantALabel, setVariantALabel] = useState('Control')
  const [variantBLabel, setVariantBLabel] = useState('Challenger')

  // Resolve campaign ID from sequence before creating
  const { data: campaignsData } = useQuery({
    queryKey: ['sequence-campaigns', sequenceId],
    queryFn: async () => {
      const res = await fetch(`/api/email-sequences/${sequenceId}`)
      if (!res.ok) throw new Error('Failed to fetch sequence')
      return res.json()
    },
  })

  const campaignId: string | undefined = campaignsData?.sequence?.campaign_id

  const mutation = useMutation({
    mutationFn: async () => {
      if (!campaignId) throw new Error('No campaign linked to this sequence')
      const res = await fetch('/api/ab-testing/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          name: name.trim(),
          testType,
          successMetric,
          minimumSampleSize: minSample,
          confidenceLevel,
          variantALabel,
          variantBLabel,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Failed to create experiment')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Experiment created')
      onSuccess()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const isValid = name.trim().length > 0

  return (
    <div className="space-y-5">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="exp-name">Experiment Name</Label>
        <Input
          id="exp-name"
          placeholder="e.g. Subject line test — Week 1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Test type */}
      <div className="space-y-2">
        <Label>Test Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(TEST_TYPE_LABELS) as TestType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTestType(t)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium text-left transition-colors ${
                testType === t
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-background hover:bg-muted/50'
              }`}
            >
              {TEST_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Success metric */}
      <div className="space-y-2">
        <Label>Success Metric</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(METRIC_LABELS) as SuccessMetric[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSuccessMetric(m)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium text-left transition-colors ${
                successMetric === m
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-background hover:bg-muted/50'
              }`}
            >
              {METRIC_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Sample size + confidence */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="min-sample">Min Sends Per Variant</Label>
          <Input
            id="min-sample"
            type="number"
            min={10}
            max={10000}
            value={minSample}
            onChange={(e) => setMinSample(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Confidence Level</Label>
          <div className="flex gap-2">
            {[80, 90, 95, 99].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setConfidenceLevel(c)}
                className={`flex-1 rounded-md border py-1.5 text-sm font-medium transition-colors ${
                  confidenceLevel === c
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                {c}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Variant labels */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="variant-a">Variant A (Control)</Label>
          <Input
            id="variant-a"
            value={variantALabel}
            onChange={(e) => setVariantALabel(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="variant-b">Variant B (Challenger)</Label>
          <Input
            id="variant-b"
            value={variantBLabel}
            onChange={(e) => setVariantBLabel(e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!isValid || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Creating…' : 'Create Experiment'}
        </Button>
      </div>
    </div>
  )
}

// ─── Variant Stats Row ───────────────────────────────────────────────────────

function VariantRow({
  variant,
  metric,
  isWinner,
}: {
  variant: VariantResult
  metric: SuccessMetric
  isWinner: boolean
}) {
  const rate = metricValue(variant, metric)
  return (
    <tr className={`border-b last:border-0 ${isWinner ? 'bg-green-50' : ''}`}>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">{variant.name}</span>
          {variant.isControl && (
            <Badge variant="secondary" className="text-xs">
              Control
            </Badge>
          )}
          {isWinner && (
            <Badge className="bg-green-100 text-green-800 text-xs gap-1">
              <Trophy className="h-3 w-3" />
              Winner
            </Badge>
          )}
        </div>
      </td>
      <td className="py-3 px-4 text-right text-sm">{variant.emailsSent.toLocaleString()}</td>
      <td className="py-3 px-4 text-right text-sm">{variant.emailsOpened.toLocaleString()}</td>
      <td className="py-3 px-4 text-right text-sm">{variant.emailsClicked.toLocaleString()}</td>
      <td className="py-3 px-4 text-right text-sm">{variant.emailsReplied.toLocaleString()}</td>
      <td className="py-3 px-4 text-right">
        <span className={`font-semibold ${isWinner ? 'text-green-700' : ''}`}>
          {rate.toFixed(1)}%
        </span>
      </td>
    </tr>
  )
}

// ─── Experiment Card ─────────────────────────────────────────────────────────

interface ExperimentCardProps {
  experiment: Experiment
  sequenceId: string
}

function ExperimentCard({ experiment, sequenceId }: ExperimentCardProps) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(true)

  // Fetch live results when expanded and experiment is running
  const { data: resultsData } = useQuery({
    queryKey: ['ab-experiment-results', experiment.id],
    queryFn: async () => {
      const res = await fetch(`/api/ab-testing/experiments/${experiment.id}/results`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: expanded && (experiment.status === 'running' || experiment.status === 'paused'),
    refetchInterval: experiment.status === 'running' ? 30_000 : false,
  })

  const results = resultsData?.results
  const variants: VariantResult[] = results?.variants ?? []

  const totalSends = variants.reduce((s, v) => s + v.sampleSize, 0)
  const progressToMinSample =
    experiment.minimum_sample_size > 0
      ? Math.min((totalSends / (experiment.minimum_sample_size * variants.length)) * 100, 100)
      : 0

  const isSignificant = results?.status === 'winner_found'
  const winnerVariantId = results?.winnerVariantId ?? experiment.winner_variant_id

  const applyWinnerMutation = useMutation({
    mutationFn: async () => {
      if (!winnerVariantId) throw new Error('No winner to apply')
      const res = await fetch(`/api/ab-testing/experiments/${experiment.id}/apply-winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerVariantId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Failed to apply winner')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Winner applied — variant promoted to 100% traffic')
      queryClient.invalidateQueries({ queryKey: ['ab-experiments', sequenceId] })
      queryClient.invalidateQueries({ queryKey: ['ab-experiment-results', experiment.id] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const endExperimentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/ab-testing/experiments/${experiment.id}/apply-winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerVariantId: winnerVariantId ?? '' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Failed to end experiment')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Experiment ended')
      queryClient.invalidateQueries({ queryKey: ['ab-experiments', sequenceId] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const isActive = experiment.status === 'running' || experiment.status === 'paused'

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{experiment.name}</CardTitle>
              <Badge className={STATUS_COLORS[experiment.status] ?? 'bg-gray-100 text-gray-700'}>
                {experiment.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {TEST_TYPE_LABELS[experiment.test_type] ?? experiment.test_type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {METRIC_LABELS[experiment.success_metric] ?? experiment.success_metric}
              </Badge>
            </div>
            <CardDescription className="mt-1 text-xs">
              Min {experiment.minimum_sample_size} sends/variant &middot; {experiment.confidence_level}% confidence
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Progress to minimum sample */}
          {isActive && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Sample progress</span>
                <span>
                  {totalSends.toLocaleString()} /{' '}
                  {(experiment.minimum_sample_size * Math.max(variants.length, 2)).toLocaleString()}{' '}
                  sends
                </span>
              </div>
              <Progress
                value={progressToMinSample}
                variant={progressToMinSample >= 100 ? 'success' : 'default'}
                size="sm"
              />
              {progressToMinSample < 100 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Need {experiment.minimum_sample_size} sends per variant for statistical
                  significance
                </p>
              )}
            </div>
          )}

          {/* Winner callout */}
          {results?.status === 'winner_found' && results.winnerName && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm">
              <Trophy className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-green-800">
                <span className="font-medium">{results.winnerName}</span> wins with{' '}
                {results.liftPercent?.toFixed(1)}% lift at {results.confidenceLevel}% confidence.
              </span>
            </div>
          )}

          {/* Variants table */}
          {variants.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="py-2 px-4 text-left font-medium text-muted-foreground">
                      Variant
                    </th>
                    <th className="py-2 px-4 text-right font-medium text-muted-foreground">
                      Sends
                    </th>
                    <th className="py-2 px-4 text-right font-medium text-muted-foreground">
                      Opens
                    </th>
                    <th className="py-2 px-4 text-right font-medium text-muted-foreground">
                      Clicks
                    </th>
                    <th className="py-2 px-4 text-right font-medium text-muted-foreground">
                      Replies
                    </th>
                    <th className="py-2 px-4 text-right font-medium text-muted-foreground">
                      {METRIC_LABELS[experiment.success_metric]}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <VariantRow
                      key={v.variantId}
                      variant={v}
                      metric={experiment.success_metric}
                      isWinner={v.variantId === winnerVariantId}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : isActive ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No send data yet — results will appear once emails are delivered.
            </p>
          ) : null}

          {/* Actions */}
          {isActive && (
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => endExperimentMutation.mutate()}
                disabled={endExperimentMutation.isPending || applyWinnerMutation.isPending}
              >
                End Experiment
              </Button>
              <Button
                size="sm"
                disabled={
                  !isSignificant ||
                  !winnerVariantId ||
                  applyWinnerMutation.isPending ||
                  endExperimentMutation.isPending
                }
                onClick={() => applyWinnerMutation.mutate()}
                title={
                  !isSignificant
                    ? 'Collect more data before applying a winner'
                    : 'Promote the winning variant to 100% traffic'
                }
              >
                <Trophy className="mr-1.5 h-3.5 w-3.5" />
                {applyWinnerMutation.isPending ? 'Applying…' : 'Apply Winner'}
              </Button>
            </div>
          )}

          {/* Completed result */}
          {experiment.status === 'completed' && experiment.winner_variant && (
            <p className="text-sm text-muted-foreground">
              Winner:{' '}
              <span className="font-medium text-foreground">{experiment.winner_variant.name}</span>
              {experiment.statistical_significance != null && (
                <> at {experiment.statistical_significance}% confidence</>
              )}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

interface ABTestingPanelProps {
  sequenceId: string
}

export function ABTestingPanel({ sequenceId }: ABTestingPanelProps) {
  const [showCreate, setShowCreate] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['ab-experiments', sequenceId],
    queryFn: async () => {
      const res = await fetch(`/api/ab-testing/experiments?sequenceId=${sequenceId}`)
      if (!res.ok) throw new Error('Failed to load experiments')
      return res.json() as Promise<{ experiments: Experiment[] }>
    },
  })

  if (isError) {
    safeError('ABTestingPanel error:', error)
  }

  const experiments = data?.experiments ?? []
  const active = experiments.filter(
    (e) => e.status === 'running' || e.status === 'paused' || e.status === 'draft'
  )
  const past = experiments.filter(
    (e) => e.status === 'completed' || e.status === 'cancelled'
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">A/B Experiments</h2>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Experiment
        </Button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Create Experiment</CardTitle>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <CreateExperimentForm
              sequenceId={sequenceId}
              onSuccess={() => {
                setShowCreate(false)
                queryClient.invalidateQueries({ queryKey: ['ab-experiments', sequenceId] })
              }}
              onClose={() => setShowCreate(false)}
            />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active Experiments
            {active.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-xs font-medium">
                {active.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="past">Past Experiments</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {isLoading ? (
            <div className="space-y-3 mt-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-lg border border-border bg-muted/30 animate-pulse"
                />
              ))}
            </div>
          ) : active.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FlaskConical className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">No active experiments</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Create an experiment to start split-testing your subject lines, email body, or send
                times.
              </p>
              <Button size="sm" className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New Experiment
              </Button>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {active.map((exp) => (
                <ExperimentCard key={exp.id} experiment={exp} sequenceId={sequenceId} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {isLoading ? (
            <div className="space-y-3 mt-4">
              <div className="h-24 rounded-lg border border-border bg-muted/30 animate-pulse" />
            </div>
          ) : past.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-foreground">No past experiments</p>
              <p className="text-xs text-muted-foreground mt-1">
                Completed and cancelled experiments will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {past.map((exp) => (
                <ExperimentCard key={exp.id} experiment={exp} sequenceId={sequenceId} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
