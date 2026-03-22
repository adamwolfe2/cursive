'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { retryAutomationStep } from '@/app/admin/onboarding/actions'
import type { OnboardingClient, AutomationLogEntry } from '@/types/onboarding'
import {
  CheckCircle,
  XCircle,
  SkipForward,
  RefreshCw,
  Zap,
  Database,
  FileText,
  Mail,
  Bot,
} from 'lucide-react'

const STEP_LABELS: Record<string, string> = {
  'enrichment': 'ICP Enrichment via Claude',
  'copy_generation': 'Email Sequence Generation',
  'checklist': 'Fulfillment Checklist Creation',
  'slack': 'Slack Team Notification',
  'email': 'Client Confirmation Email',
  'crm_sync': 'CRM Record Sync',
  'copy_approve': 'Copy Approved',
  'copy_needs_edits': 'Copy Needs Edits',
  'slack_retry': 'Slack Retry',
  'email_retry': 'Email Retry',
  'crm_sync_retry': 'CRM Sync Retry',
}

function getRelativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
  return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) === 1 ? '' : 's'} ago`
}

function getFullTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

interface AutomationLogProps {
  client: OnboardingClient
}

const STATUS_ICON = {
  complete: <CheckCircle className="h-4 w-4 text-green-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
  skipped: <SkipForward className="h-4 w-4 text-slate-400" />,
}

const STATUS_BADGE_VARIANT = {
  complete: 'success' as const,
  failed: 'destructive' as const,
  skipped: 'muted' as const,
}

export default function AutomationLog({ client }: AutomationLogProps) {
  const [retrying, setRetrying] = useState<string | null>(null)

  const logEntries = client.automation_log ?? []

  const systemStatuses = [
    {
      label: 'Enrichment',
      status: client.enrichment_status,
      icon: <Bot className="h-4 w-4" />,
    },
    {
      label: 'Copy Generation',
      status: client.copy_generation_status,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      label: 'Copy Approval',
      status: client.copy_approval_status,
      icon: <Mail className="h-4 w-4" />,
    },
    {
      label: 'CRM Sync',
      status: client.crm_sync_status,
      icon: <Database className="h-4 w-4" />,
    },
  ]

  function getStatusVariant(status: string) {
    switch (status) {
      case 'complete':
      case 'synced':
      case 'approved':
        return 'success' as const
      case 'failed':
      case 'needs_edits':
        return 'destructive' as const
      case 'processing':
      case 'regenerating':
        return 'info' as const
      case 'pending':
        return 'warning' as const
      default:
        return 'muted' as const
    }
  }

  async function handleRetry(step: string) {
    setRetrying(step)
    try {
      await retryAutomationStep(client.id, step)
    } finally {
      setRetrying(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* System Status Indicators */}
      <Card padding="default">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" /> System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {systemStatuses.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-muted-foreground">{item.icon}</span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{item.label}</p>
                  <Badge variant={getStatusVariant(item.status)} size="sm" dot>
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-3 border-t border-border/40">
            <StatusIndicator
              label="Slack Notification"
              sent={client.slack_notification_sent}
            />
            <StatusIndicator
              label="Confirmation Email"
              sent={client.confirmation_email_sent}
            />
            <StatusIndicator
              label="Onboarding Complete"
              sent={client.onboarding_complete}
            />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">CRM Record</p>
              <p className="text-xs font-medium">{client.crm_record_id ?? 'Not created'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card padding="default">
        <CardHeader>
          <CardTitle className="text-base">Automation Timeline</CardTitle>
        </CardHeader>
        <CardContent className="mt-3">
          {logEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No automation steps have been logged yet.
            </p>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />

              <div className="space-y-4">
                {logEntries.map((entry, idx) => (
                  <TimelineEntry
                    key={`${entry.step}-${idx}`}
                    entry={entry}
                    onRetry={() => handleRetry(entry.step)}
                    isRetrying={retrying === entry.step}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TimelineEntry({
  entry,
  onRetry,
  isRetrying,
}: {
  entry: AutomationLogEntry
  onRetry: () => void
  isRetrying: boolean
}) {
  const [showFullError, setShowFullError] = useState(false)
  const humanLabel = STEP_LABELS[entry.step] ?? entry.step
  const errorTruncated = entry.error && entry.error.length > 200 && !showFullError
  const displayError = errorTruncated ? entry.error.slice(0, 200) + '...' : entry.error

  return (
    <div className="relative pl-8">
      {/* Dot */}
      <div className="absolute left-0 top-1 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-card border border-border">
        {STATUS_ICON[entry.status]}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{humanLabel}</span>
            <Badge variant={STATUS_BADGE_VARIANT[entry.status]} size="sm">
              {entry.status}
            </Badge>
          </div>
          <p
            className="text-[10px] text-muted-foreground mt-0.5"
            title={getFullTimestamp(entry.timestamp)}
          >
            {getRelativeTime(entry.timestamp)}
          </p>
          {entry.error && (
            <div className="text-xs text-destructive mt-1 bg-destructive/5 rounded px-2 py-1">
              <p>{displayError}</p>
              {entry.error.length > 200 && (
                <button
                  type="button"
                  className="mt-1 text-[10px] font-medium underline text-destructive/80 hover:text-destructive"
                  onClick={() => setShowFullError((prev) => !prev)}
                >
                  {showFullError ? 'Show less' : 'Show full error'}
                </button>
              )}
            </div>
          )}
        </div>

        {entry.status === 'failed' && (
          <Button
            variant="outline"
            size="sm"
            loading={isRetrying}
            onClick={onRetry}
            leftIcon={<RefreshCw className="h-3 w-3" />}
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}

function StatusIndicator({ label, sent }: { label: string; sent: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <span className="flex items-center gap-1 text-xs font-medium">
        {sent ? (
          <>
            <CheckCircle className="h-3 w-3 text-green-500" /> Sent
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3 text-slate-400" /> Not sent
          </>
        )}
      </span>
    </div>
  )
}
