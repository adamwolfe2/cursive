'use client'

/**
 * Run Now button — POSTs /api/outbound/workflows/[id]/run, then invalidates
 * the stats query so the new run shows up immediately.
 *
 * Disabled when no sending email account is connected (Phase 0 safety lock).
 * Reads gate state from the shared `['outbound','stats',agentId]` cache.
 */

import { useState } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Play, Lock } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import type { WorkflowStatsResponse } from '@/types/outbound'

export interface RunNowButtonProps {
  agentId: string
}

export function RunNowButton({ agentId }: RunNowButtonProps) {
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  // Subscribe to the shared stats cache for the gate state.
  // gateReady defaults to FALSE before the first stats poll lands. The
  // previous behavior defaulted to true (optimistic) which let users with
  // no Gmail connected click "Run Now" for ~5s after page load and hit a
  // confusing 412 error. The detail page SSRs initialStats into the
  // StagePipeline cache so this race window is brief — but treating
  // unknown state as locked is safer.
  const { data: stats } = useQuery<WorkflowStatsResponse>({
    queryKey: ['outbound', 'stats', agentId],
    enabled: false,
  })
  const gateState = stats?.sending_account
  const gateReady = gateState?.ready === true
  const needsReconnect = gateState?.needs_reconnect === true
  const gateUnknown = gateState === undefined

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/outbound/workflows/${agentId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const j = await res.json().catch(() => ({}))

      if (!res.ok) {
        error(j.error || 'Could not start the workflow.', { title: 'Run failed' })
        return
      }

      success(
        `Cursive is prospecting up to ${j.data?.target_count ?? '?'} leads. Drafts typically arrive in 1–3 minutes — you'll see the stage pipeline update live.`,
        { title: 'Run started', duration: 8000 }
      )

      // Force a stats refetch immediately
      await queryClient.invalidateQueries({ queryKey: ['outbound', 'stats', agentId] })
      await queryClient.invalidateQueries({ queryKey: ['outbound', 'prospects', agentId] })
    } catch (err) {
      error(err instanceof Error ? err.message : 'Network error', { title: 'Run failed' })
    } finally {
      setLoading(false)
    }
  }

  if (!gateReady) {
    const lockTitle = needsReconnect
      ? 'Reconnect Gmail before running this workflow'
      : gateUnknown
        ? 'Checking sending account...'
        : 'Connect a sending email account to enable Run Now'
    return (
      <Button variant="outline" disabled title={lockTitle}>
        <Lock className="h-4 w-4 mr-1.5" />
        Run Now
      </Button>
    )
  }

  return (
    <Button onClick={handleClick} loading={loading} disabled={loading}>
      <Play className="h-4 w-4 mr-1.5" />
      Run Now
    </Button>
  )
}
