'use client'

/**
 * Run Now button — POSTs /api/outbound/workflows/[id]/run, then invalidates
 * the stats query so the new run shows up immediately.
 */

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'

export interface RunNowButtonProps {
  agentId: string
}

export function RunNowButton({ agentId }: RunNowButtonProps) {
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const { success, error } = useToast()

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
        `Cursive is prospecting up to ${j.data?.target_count ?? '?'} leads. Drafts will appear in ~30s.`,
        { title: 'Run started' }
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

  return (
    <Button onClick={handleClick} loading={loading} disabled={loading}>
      <Play className="h-4 w-4 mr-1.5" />
      Run Now
    </Button>
  )
}
