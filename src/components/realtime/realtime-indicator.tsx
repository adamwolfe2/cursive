'use client'

/**
 * Real-time Connection Indicator
 * Shows live connection status to Supabase Realtime
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff } from 'lucide-react'

interface RealtimeIndicatorProps {
  workspaceId: string
}

export function RealtimeIndicator({ workspaceId }: RealtimeIndicatorProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [eventCount, setEventCount] = useState(0)

  useEffect(() => {
    if (!workspaceId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`status:workspace:${workspaceId}`)
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true)
      })
      .on('broadcast', { event: 'ping' }, () => {
        setEventCount((prev) => prev + 1)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId])

  return (
    <Badge
      variant={isConnected ? 'default' : 'secondary'}
      className="gap-1.5 text-xs"
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>Live</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      )}
    </Badge>
  )
}
