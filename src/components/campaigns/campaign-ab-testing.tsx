'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Play, Pause, StopCircle, Trophy, RefreshCw, AlertCircle, FlaskConical } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix'
import { useToast } from '@/lib/hooks/use-toast'

// ---- Types ----------------------------------------------------------------

type ExperimentStatus = 'draft' | 'running' | 'completed' | 'paused'
type TestType = 'subject' | 'body' | 'full_template' | 'send_time'
type SuccessMetric = 'open_rate' | 'click_rate' | 'reply_rate' | 'conversion_rate'

interface VariantSummary {
  name: string
  is_control: boolean
  sample_size: number
  open_rate: number | null
  click_rate: number | null
  reply_rate: number | null
}

interface ExperimentResults {
  status: string
  winner_variant_id: string | null
  winner_name: string | null
  confidence_level: number | null
  lift_percent: number | null
  recommendation: string | null
  variant_summary: VariantSummary[]
}

interface Experiment {
  id: string
  name: string
  description: string | null
  hypothesis: string | null
  test_type: TestType | null
  success_metric: SuccessMetric | null
  minimum_sample_size: number
  confidence_level: number | null
  status: ExperimentStatus
  winner_variant_id: string | null
  statistical_significance: number | null
  started_at: string | null
  ended_at: string | null
  created_at: string
  results: ExperimentResults | null
}

interface ExperimentsResponse {
  campaign_id: string
  campaign_name: string
  experiments: Experiment[]
  total: number
}

interface CampaignAbTestingProps {
  campaignId: string
}

// ---- Constants ------------------------------------------------------------

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  running: { label: 'Running', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700 border-green-200' },
  paused: { label: 'Paused', className: 'bg-amber-100 text-amber-700 border-amber-200' },
}

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

// ---- Helper ---------------------------------------------------------------

function formatRate(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return `${(value * 100).toFixed(1)}%`
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

// ---- Create Experiment Modal ----------------------------------------------

interface CreateExperimentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  onCreated: () => void
}

interface CreateFormState {
  name: string
  test_type: TestType | ''
  success_metric: SuccessMetric | ''
  minimum_sample_size: string
}

function CreateExperimentModal({ open, onOpenChange, campaignId, onCreated }: CreateExperimentModalProps) {
  const toast = useToast()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<CreateFormState>({
    name: '',
    test_type: '',
    success_metric: '',
    minimum_sample_size: '100',
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
      }
      if (form.test_type) payload.test_type = form.test_type
      if (form.success_metric) payload.success_metric = form.success_metric
      const sampleSize = parseInt(form.minimum_sample_size, 10)
      if (!isNaN(sampleSize)) payload.minimum_sample_size = sampleSize

      const res = await fetch(`/api/campaigns/${campaignId}/experiments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create experiment')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId, 'experiments'] })
      toast.success('Experiment created')
      setForm({ name: '', test_type: '', success_metric: '', minimum_sample_size: '100' })
      onOpenChange(false)
      onCreated()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('Experiment name is required')
      return
    }
    createMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create A/B Experiment</DialogTitle>
          <DialogDescription>
            Set up a new experiment to test different variations of your campaign emails.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="exp-name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="exp-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Subject line test - Q1"
              disabled={createMutation.isPending}
            />
          </div>

          {/* Test Type */}
          <div className="space-y-2">
            <Label htmlFor="exp-test-type">Test Type</Label>
            <Select
              value={form.test_type}
              onValueChange={(v) => setForm((f) => ({ ...f, test_type: v as TestType }))}
              disabled={createMutation.isPending}
            >
              <SelectTrigger id="exp-test-type">
                <SelectValue placeholder="Select what to test" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="subject">Subject Line</SelectItem>
                <SelectItem value="body">Email Body</SelectItem>
                <SelectItem value="full_template">Full Template</SelectItem>
                <SelectItem value="send_time">Send Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Success Metric */}
          <div className="space-y-2">
            <Label htmlFor="exp-metric">Success Metric</Label>
            <Select
              value={form.success_metric}
              onValueChange={(v) => setForm((f) => ({ ...f, success_metric: v as SuccessMetric }))}
              disabled={createMutation.isPending}
            >
              <SelectTrigger id="exp-metric">
                <SelectValue placeholder="Select metric to optimize" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open_rate">Open Rate</SelectItem>
                <SelectItem value="click_rate">Click Rate</SelectItem>
                <SelectItem value="reply_rate">Reply Rate</SelectItem>
                <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Min Sample Size */}
          <div className="space-y-2">
            <Label htmlFor="exp-sample">Min Sample Size</Label>
            <Input
              id="exp-sample"
              type="number"
              min={10}
              max={10000}
              value={form.minimum_sample_size}
              onChange={(e) => setForm((f) => ({ ...f, minimum_sample_size: e.target.value }))}
              placeholder="100"
              disabled={createMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Minimum recipients per variant before results are considered valid (10–10,000).
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Experiment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---- Variant Comparison Table --------------------------------------------

function VariantComparisonTable({
  variants,
  winnerName,
}: {
  variants: VariantSummary[]
  winnerName: string | null
}) {
  if (!variants || variants.length === 0) return null

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 pr-4 font-medium text-muted-foreground text-xs">Variant</th>
            <th className="text-right py-2 pr-4 font-medium text-muted-foreground text-xs">Sample</th>
            <th className="text-right py-2 pr-4 font-medium text-muted-foreground text-xs">Open Rate</th>
            <th className="text-right py-2 pr-4 font-medium text-muted-foreground text-xs">Click Rate</th>
            <th className="text-right py-2 font-medium text-muted-foreground text-xs">Reply Rate</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v, idx) => {
            const isWinner = winnerName !== null && v.name === winnerName
            return (
              <tr
                key={idx}
                className={`border-b border-gray-100 last:border-0 ${
                  isWinner
                    ? 'bg-green-50/60'
                    : v.is_control
                    ? 'bg-gray-50/50'
                    : ''
                }`}
              >
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{v.name}</span>
                    {v.is_control && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-gray-500">
                        Control
                      </Badge>
                    )}
                    {isWinner && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-700">
                        <Trophy className="h-3 w-3" />
                        Winner
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-right py-2 pr-4 text-muted-foreground">
                  {v.sample_size.toLocaleString()}
                </td>
                <td className="text-right py-2 pr-4 text-muted-foreground">
                  {formatRate(v.open_rate)}
                </td>
                <td className="text-right py-2 pr-4 text-muted-foreground">
                  {formatRate(v.click_rate)}
                </td>
                <td className="text-right py-2 text-muted-foreground">
                  {formatRate(v.reply_rate)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ---- Experiment Card -------------------------------------------------------

interface ExperimentCardProps {
  experiment: Experiment
  campaignId: string
}

function ExperimentCard({ experiment, campaignId }: ExperimentCardProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const statusConfig = STATUS_CONFIG[experiment.status] || STATUS_CONFIG.draft

  const actionMutation = useMutation({
    mutationFn: async (params: { action: string; winner_variant_id?: string }) => {
      const res = await fetch(
        `/api/campaigns/${campaignId}/experiments?experiment_id=${experiment.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Action failed')
      }
      return res.json()
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId, 'experiments'] })
      const actionLabels: Record<string, string> = {
        start: 'Experiment started',
        pause: 'Experiment paused',
        end: 'Experiment ended',
        apply_winner: 'Winner applied to campaign',
      }
      toast.success(actionLabels[variables.action] || 'Action completed')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleAction = (action: string, winner_variant_id?: string) => {
    actionMutation.mutate({ action, ...(winner_variant_id ? { winner_variant_id } : {}) })
  }

  const hasResults = experiment.results !== null && experiment.results !== undefined
  const winnerName = experiment.results?.winner_name ?? null
  const winnerVariantId = experiment.results?.winner_variant_id ?? null

  return (
    <Card className="p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-foreground truncate">{experiment.name}</h4>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusConfig.className}`}
            >
              {statusConfig.label}
            </span>
            {experiment.status === 'completed' && winnerName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700 border border-green-200">
                <Trophy className="h-3 w-3" />
                Winner: {winnerName}
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
            {experiment.test_type && (
              <span>Type: {TEST_TYPE_LABELS[experiment.test_type]}</span>
            )}
            {experiment.success_metric && (
              <span>Metric: {METRIC_LABELS[experiment.success_metric]}</span>
            )}
            <span>Min sample: {experiment.minimum_sample_size}</span>
            {experiment.started_at && (
              <span>Started: {formatDate(experiment.started_at)}</span>
            )}
            {experiment.ended_at && (
              <span>Ended: {formatDate(experiment.ended_at)}</span>
            )}
          </div>

          {experiment.results?.recommendation && (
            <p className="mt-2 text-xs text-muted-foreground italic">
              {experiment.results.recommendation}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {experiment.status === 'draft' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('start')}
              disabled={actionMutation.isPending}
              className="h-8 text-xs gap-1.5"
            >
              <Play className="h-3 w-3" />
              Start
            </Button>
          )}
          {experiment.status === 'running' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('pause')}
                disabled={actionMutation.isPending}
                className="h-8 text-xs gap-1.5"
              >
                <Pause className="h-3 w-3" />
                Pause
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('end')}
                disabled={actionMutation.isPending}
                className="h-8 text-xs gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50"
              >
                <StopCircle className="h-3 w-3" />
                End
              </Button>
            </>
          )}
          {experiment.status === 'paused' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('end')}
              disabled={actionMutation.isPending}
              className="h-8 text-xs gap-1.5"
            >
              <StopCircle className="h-3 w-3" />
              End
            </Button>
          )}
          {experiment.status === 'completed' && winnerVariantId && (
            <Button
              size="sm"
              onClick={() => handleAction('apply_winner', winnerVariantId)}
              disabled={actionMutation.isPending}
              className="h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
            >
              <Trophy className="h-3 w-3" />
              Apply Winner
            </Button>
          )}
        </div>
      </div>

      {/* Variant comparison table for running/completed experiments */}
      {hasResults && experiment.results!.variant_summary && experiment.results!.variant_summary.length > 0 && (
        <div className="mt-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">Variant Performance</p>
          <VariantComparisonTable
            variants={experiment.results!.variant_summary}
            winnerName={winnerName}
          />
          {experiment.results!.lift_percent !== null && (
            <p className="mt-2 text-xs text-muted-foreground">
              Lift: <span className="font-medium text-foreground">{experiment.results!.lift_percent?.toFixed(1)}%</span>
              {experiment.results!.confidence_level !== null && (
                <> &middot; Confidence: <span className="font-medium text-foreground">{experiment.results!.confidence_level}%</span></>
              )}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

// ---- Main Component -------------------------------------------------------

export function CampaignAbTesting({ campaignId }: CampaignAbTestingProps) {
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading, error, refetch } = useQuery<ExperimentsResponse>({
    queryKey: ['campaigns', campaignId, 'experiments'],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/experiments`)
      if (!res.ok) throw new Error('Failed to fetch experiments')
      const json = await res.json()
      return json.data as ExperimentsResponse
    },
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-5 animate-pulse">
            <div className="h-4 w-1/3 bg-muted rounded mb-3" />
            <div className="h-3 w-1/2 bg-muted rounded mb-2" />
            <div className="h-3 w-1/4 bg-muted rounded" />
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
        <p className="text-sm text-muted-foreground mb-3">Failed to load experiments</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  const experiments = data?.experiments ?? []

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {experiments.length === 0
              ? 'No experiments yet'
              : `${experiments.length} experiment${experiments.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Experiment
        </Button>
      </div>

      {/* Empty state */}
      {experiments.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-sm font-medium text-foreground mb-1">No experiments yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Create an A/B experiment to test different subject lines, email bodies, or send times and find what resonates best with your audience.
            </p>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Experiment
            </Button>
          </div>
        </Card>
      )}

      {/* Experiment list */}
      {experiments.length > 0 && (
        <div className="space-y-3">
          {experiments.map((exp) => (
            <ExperimentCard key={exp.id} experiment={exp} campaignId={campaignId} />
          ))}
        </div>
      )}

      {/* Create modal */}
      <CreateExperimentModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        campaignId={campaignId}
        onCreated={() => {}}
      />
    </div>
  )
}
