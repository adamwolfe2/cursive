'use client'

/**
 * Real-time Lead Updates Hook
 * Subscribe to leads table changes via Supabase Realtime
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface UseRealtimeLeadsOptions {
  workspaceId: string
  enabled?: boolean
  onInsert?: (lead: any) => void
  onUpdate?: (lead: any) => void
  onDelete?: (leadId: string) => void
  showToasts?: boolean
}

/**
 * Subscribe to real-time lead changes
 * Automatically invalidates React Query cache on changes
 */
export function useRealtimeLeads({
  workspaceId,
  enabled = true,
  onInsert,
  onUpdate,
  onDelete,
  showToasts = true,
}: UseRealtimeLeadsOptions) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled || !workspaceId) return

    const supabase = createClient()

    // Subscribe to leads table changes for this workspace
    const channel = supabase
      .channel(`leads:workspace:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const newLead = payload.new

          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['leads'] })
          queryClient.invalidateQueries({ queryKey: ['analytics', 'workspace-stats'] })

          // Show toast notification
          if (showToasts) {
            toast.success('New lead added', {
              description: `${newLead.first_name || 'New'} ${newLead.last_name || 'lead'} from ${newLead.source}`,
            })
          }

          // Custom callback
          onInsert?.(newLead)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const updatedLead = payload.new

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['leads'] })
          queryClient.invalidateQueries({ queryKey: ['lead', updatedLead.id] })

          // Custom callback
          onUpdate?.(updatedLead)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'leads',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const deletedLeadId = payload.old.id

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['leads'] })
          queryClient.invalidateQueries({ queryKey: ['analytics', 'workspace-stats'] })

          // Custom callback
          onDelete?.(deletedLeadId)
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, enabled, queryClient, onInsert, onUpdate, onDelete, showToasts])
}
