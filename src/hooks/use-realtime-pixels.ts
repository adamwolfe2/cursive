'use client'

/**
 * Real-time Pixel Events Hook
 * Subscribe to pixel tracking events via Supabase Realtime
 */

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface UseRealtimePixelsOptions {
  workspaceId: string
  enabled?: boolean
  onNewEvent?: (event: any) => void
}

interface PixelStats {
  eventsToday: number
  identifiedToday: number
  lastEventAt: Date | null
}

/**
 * Subscribe to real-time pixel tracking events
 * Shows live visitor activity and identity resolution
 */
export function useRealtimePixels({
  workspaceId,
  enabled = true,
  onNewEvent,
}: UseRealtimePixelsOptions) {
  const queryClient = useQueryClient()
  const [stats, setStats] = useState<PixelStats>({
    eventsToday: 0,
    identifiedToday: 0,
    lastEventAt: null,
  })

  useEffect(() => {
    if (!enabled || !workspaceId) return

    const supabase = createClient()

    // Subscribe to pixel events for this workspace
    const channel = supabase
      .channel(`pixel-events:workspace:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audiencelab_events',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const newEvent = payload.new

          // Update local stats
          setStats((prev) => ({
            eventsToday: prev.eventsToday + 1,
            identifiedToday: prev.identifiedToday + (newEvent.email ? 1 : 0),
            lastEventAt: new Date(),
          }))

          // Invalidate analytics queries
          queryClient.invalidateQueries({ queryKey: ['analytics', 'pixels'] })

          // Custom callback
          onNewEvent?.(newEvent)
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, enabled, queryClient, onNewEvent])

  return stats
}
