'use client'

/**
 * Real-time Pixel Events Hook
 * Subscribe to pixel tracking events via Supabase Realtime
 */

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { safeError } from '@/lib/utils/log-sanitizer'

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
      .on('system', { event: '*' }, (payload) => {
        // Monitor connection status - don't show toast for pixels (less critical)
        if (payload.type === 'CLOSED' || payload.type === 'ERROR') {
          safeError('[Realtime] Pixel connection closed or error:', payload)
          // Invalidate queries to refetch stale data
          queryClient.invalidateQueries({ queryKey: ['analytics', 'pixels'] })
        }
      })
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
    // NOTE: queryClient is stable and doesn't need to be in deps
    // Callbacks (onNewEvent) are intentionally omitted to prevent
    // subscription recreation on every render. They capture the latest values via closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, enabled])

  return stats
}
