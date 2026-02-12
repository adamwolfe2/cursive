'use client'

/**
 * My Leads Realtime Wrapper
 *
 * Client component that coordinates realtime updates between
 * MyLeadsStats and MyLeadsTable. When the table receives a
 * realtime event, it bumps refreshKey to trigger a stats refetch.
 */

import { useState, useCallback } from 'react'
import { MyLeadsStats } from './my-leads-stats'
import { MyLeadsTable } from './my-leads-table'

interface MyLeadsRealtimeProps {
  userId: string
  workspaceId: string
}

export function MyLeadsRealtime({ userId, workspaceId }: MyLeadsRealtimeProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleLeadChange = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <>
      <MyLeadsStats
        userId={userId}
        workspaceId={workspaceId}
        refreshKey={refreshKey}
      />
      <MyLeadsTable
        userId={userId}
        workspaceId={workspaceId}
        onLeadChange={handleLeadChange}
      />
    </>
  )
}
