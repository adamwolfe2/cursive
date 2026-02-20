'use client'

/**
 * Real-time Marketplace Purchases Hook
 * Subscribe to purchase events via Supabase Realtime
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { safeError } from '@/lib/utils/log-sanitizer'

interface UseRealtimePurchasesOptions {
  workspaceId: string
  enabled?: boolean
  onPurchaseCompleted?: (purchase: any) => void
  showToasts?: boolean
}

/**
 * Subscribe to real-time marketplace purchase changes
 * Useful for seller notifications when leads are purchased
 */
export function useRealtimePurchases({
  workspaceId,
  enabled = true,
  onPurchaseCompleted,
  showToasts = true,
}: UseRealtimePurchasesOptions) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled || !workspaceId) return

    const supabase = createClient()

    // Subscribe to marketplace purchases where user is the seller
    const channel = supabase
      .channel(`purchases:workspace:${workspaceId}`)
      .on('system', { event: '*' }, (payload) => {
        // Monitor connection status
        if (payload.type === 'CLOSED' || payload.type === 'ERROR') {
          safeError('[Realtime] Connection closed or error:', payload)
          if (showToasts) {
            toast.error('Real-time connection lost', {
              description: 'Refreshing data...',
            })
          }
          // Invalidate queries to refetch stale data
          queryClient.invalidateQueries({ queryKey: ['purchases'] })
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'marketplace_purchases',
          filter: `seller_workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const purchase = payload.new

          // Only show notification when purchase is completed
          if (purchase.status === 'completed' && payload.old.status !== 'completed') {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['purchases'] })
            queryClient.invalidateQueries({ queryKey: ['analytics', 'workspace-stats'] })
            queryClient.invalidateQueries({ queryKey: ['earnings'] })

            // Show toast notification
            if (showToasts) {
              toast.success('Lead purchased!', {
                description: `Your lead was purchased for $${purchase.total_price.toFixed(2)}`,
                duration: 5000,
              })
            }

            // Custom callback
            onPurchaseCompleted?.(purchase)
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
    // NOTE: queryClient is stable and doesn't need to be in deps
    // Callbacks (onPurchaseCompleted) are intentionally omitted to prevent
    // subscription recreation on every render. They capture the latest values via closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, enabled])
}
