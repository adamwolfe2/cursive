'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  regenerateCopy,
  restartIntakePipeline,
} from '@/app/admin/onboarding/actions'
import type { OnboardingClient } from '@/types/onboarding'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
  Zap,
} from 'lucide-react'

const STUCK_THRESHOLD_MS = 10 * 60 * 1000 // 10 minutes

interface PipelineStatusBannerProps {
  client: OnboardingClient
}

type StageStatus = 'pending' | 'processing' | 'complete' | 'failed' | 'skipped' | 'not_applicable'

interface Stage {
  key: string
  label: string
  status: StageStatus
}

function getRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

function statusIcon(status: StageStatus) {
  switch (status) {
    case 'complete':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'processing':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
    case 'pending':
      return <Clock className="h-4 w-4 text-amber-500" />
    case 'not_applicable':
    case 'skipped':
      return <CheckCircle2 className="h-4 w-4 text-slate-300" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

function statusBadge(status: StageStatus) {
  switch (status) {
    case 'complete':
      return <Badge variant="success" size="sm">Complete</Badge>
    case 'failed':
      return <Badge variant="destructive" size="sm">Failed</Badge>
    case 'processing':
      return <Badge variant="info" size="sm">Processing</Badge>
    case 'pending':
      return <Badge variant="warning" size="sm">Pending</Badge>
    case 'not_applicable':
      return <Badge variant="muted" size="sm">N/A</Badge>
    case 'skipped':
      return <Badge variant="muted" size="sm">Skipped</Badge>
    default:
      return <Badge variant="muted" size="sm">{status}</Badge>
  }
}

export default function PipelineStatusBanner({ client }: PipelineStatusBannerProps) {
  const [restarting, setRestarting] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const stages: Stage[] = [
    { key: 'enrichment', label: 'ICP Enrichment', status: client.enrichment_status as StageStatus },
    { key: 'copy_generation', label: 'Copy Generation', status: client.copy_generation_status as StageStatus },
    { key: 'copy_approval', label: 'Copy Approval', status: client.copy_approval_status as StageStatus },
    { key: 'crm_sync', label: 'CRM Sync', status: client.crm_sync_status as StageStatus },
  ]

  const isProcessing = stages.some((s) => s.status === 'processing')
  const hasFailed = stages.some((s) => s.status === 'failed')

  // Stuck detection: any stage in 'processing' AND last update > threshold ago
  const lastUpdated = new Date(client.updated_at).getTime()
  const ageMs = Date.now() - lastUpdated
  const isStuck = isProcessing && ageMs > STUCK_THRESHOLD_MS

  const lastLogEntry = client.automation_log?.[client.automation_log.length - 1] ?? null

  async function handleRegenerate() {
    setRegenerating(true)
    try {
      await regenerateCopy(client.id)
    } finally {
      setRegenerating(false)
    }
  }

  async function handleRestart() {
    if (!confirm('Re-fire the full intake pipeline (enrichment + copy generation)? This is safe to run multiple times.')) {
      return
    }
    setRestarting(true)
    try {
      await restartIntakePipeline(client.id)
    } finally {
      setRestarting(false)
    }
  }

  // Banner color based on state
  const bannerVariant = isStuck || hasFailed
    ? 'border-red-200 bg-red-50/40'
    : isProcessing
      ? 'border-blue-200 bg-blue-50/40'
      : 'border-border bg-card'

  return (
    <Card padding="default" className={`mb-6 ${bannerVariant}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Automation Pipeline</h3>
          {isStuck && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              Stuck — last update {getRelative(client.updated_at)}
            </span>
          )}
          {!isStuck && isProcessing && (
            <span className="text-xs text-blue-600">Running…</span>
          )}
          {!isProcessing && hasFailed && (
            <span className="text-xs text-red-600">One or more steps failed</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={regenerating}
            disabled={restarting}
            onClick={handleRegenerate}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Re-run Copy Only
          </Button>
          <Button
            variant={isStuck || hasFailed ? 'default' : 'outline'}
            size="sm"
            loading={restarting}
            disabled={regenerating}
            onClick={handleRestart}
            leftIcon={<Zap className="h-3.5 w-3.5" />}
          >
            Restart Full Pipeline
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {stages.map((stage) => (
          <div
            key={stage.key}
            className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2"
          >
            {statusIcon(stage.status)}
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold leading-tight">
                {stage.label}
              </p>
              <div className="mt-0.5">{statusBadge(stage.status)}</div>
            </div>
          </div>
        ))}
      </div>

      {lastLogEntry && (
        <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
          <span>
            Last event: <span className="font-medium text-foreground">{lastLogEntry.step}</span>{' '}
            <Badge
              variant={
                lastLogEntry.status === 'complete'
                  ? 'success'
                  : lastLogEntry.status === 'failed'
                    ? 'destructive'
                    : 'muted'
              }
              size="sm"
              className="ml-1"
            >
              {lastLogEntry.status}
            </Badge>
            <span className="ml-2">{getRelative(lastLogEntry.timestamp)}</span>
          </span>
          {lastLogEntry.error && (
            <span className="text-red-600 max-w-md truncate" title={lastLogEntry.error}>
              {lastLogEntry.error}
            </span>
          )}
        </div>
      )}
    </Card>
  )
}
