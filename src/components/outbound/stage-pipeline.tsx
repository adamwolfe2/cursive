'use client'

/**
 * StagePipeline — the 6 stage cards on the workflow detail page.
 *
 * Polls /api/outbound/workflows/[id]/stats every 5 seconds via TanStack Query.
 * Pauses polling when the tab is hidden (refetchIntervalInBackground: false).
 * Hydrates from `initialData` (passed from the server component) so the
 * first paint is instant.
 *
 * Visible feedback: a "live" badge at the top of the pipeline pulses on every
 * successful poll so users SEE that the pipeline is actively updating, and
 * the active stage card pulses its count number when a run is in flight.
 */

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Search, Sparkles, FileText, Send, MessageSquare, CalendarCheck } from 'lucide-react'
import { StageCard } from './stage-card'
import type { WorkflowStatsResponse } from '@/types/outbound'

export interface StagePipelineProps {
  agentId: string
  initialStats?: WorkflowStatsResponse | null
}

export function StagePipeline({ agentId, initialStats }: StagePipelineProps) {
  const { data, isError, dataUpdatedAt } = useQuery<WorkflowStatsResponse>({
    queryKey: ['outbound', 'stats', agentId],
    queryFn: async () => {
      const res = await fetch(`/api/outbound/workflows/${agentId}/stats`)
      if (!res.ok) throw new Error('Failed to load stats')
      const j = await res.json()
      return j.data as WorkflowStatsResponse
    },
    initialData: initialStats ?? undefined,
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
    staleTime: 2_000,
  })

  // Compute "x seconds ago" for the live badge so users SEE the polling.
  // Re-renders every second on its own so the timestamp ticks even when
  // no new data arrives.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(interval)
  }, [])
  const secondsSinceUpdate = dataUpdatedAt ? Math.max(0, Math.floor((now - dataUpdatedAt) / 1_000)) : null

  const stages = data?.stages ?? {
    prospecting: 0,
    enriching: 0,
    drafting: 0,
    engaging: 0,
    replying: 0,
    booked: 0,
  }
  const latestRun = data?.latest_run
  const isRunning = latestRun?.status === 'running'

  // Pick which stage card gets the primary accent (most "active" stage).
  type ActiveStage =
    | 'prospecting'
    | 'enriching'
    | 'drafting'
    | 'engaging'
    | 'replying'
    | 'booked'
    | null
  const activeStage = (stages.enriching > 0
    ? 'enriching'
    : stages.drafting > 0
    ? 'drafting'
    : stages.engaging > 0
    ? 'engaging'
    : stages.replying > 0
    ? 'replying'
    : isRunning
    ? 'prospecting'
    : null) as ActiveStage

  return (
    <div className="space-y-4">
      {/* Live activity badge — visible proof that the pipeline is polling.
          Pulses while running, dims when idle. The "x seconds ago" timestamp
          ticks every second so users see motion even when no run is active. */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span
            className={[
              'h-2 w-2 rounded-full',
              isRunning ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30',
            ].join(' ')}
            aria-hidden
          />
          <span className="text-xs font-medium text-muted-foreground">
            {isRunning ? 'Live — updating in real time' : 'Idle'}
          </span>
        </div>
        {secondsSinceUpdate !== null && (
          <span className="text-[11px] text-muted-foreground/70">
            {secondsSinceUpdate < 5
              ? 'Updated just now'
              : `Updated ${secondsSinceUpdate}s ago`}
          </span>
        )}
      </div>

      <StageCard
        label="Prospecting"
        count={stages.prospecting}
        subtitle="Total prospects found"
        icon={<Search className="h-5 w-5" />}
        active={activeStage === 'prospecting'}
      />
      <StageCard
        label="Enriching"
        count={stages.enriching}
        subtitle="Prospects enriched"
        icon={<Sparkles className="h-5 w-5" />}
        active={activeStage === 'enriching'}
      />
      <StageCard
        label="Drafting"
        count={stages.drafting}
        subtitle="Prospects with emails drafted — awaiting your approval"
        icon={<FileText className="h-5 w-5" />}
        active={activeStage === 'drafting'}
      />
      <StageCard
        label="Engaging"
        count={stages.engaging}
        subtitle="Prospects in a sequence"
        icon={<Send className="h-5 w-5" />}
        active={activeStage === 'engaging'}
      />
      <StageCard
        label="Replying"
        count={stages.replying}
        subtitle="Prospects engaged"
        icon={<MessageSquare className="h-5 w-5" />}
        active={activeStage === 'replying'}
      />
      <StageCard
        label="Meeting Booked"
        count={stages.booked}
        subtitle="Prospects booked"
        icon={<CalendarCheck className="h-5 w-5" />}
        active={activeStage === 'booked'}
      />

      {isError && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Failed to refresh stats. Will retry shortly.
        </div>
      )}
    </div>
  )
}
