'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { IntegrationLogo } from '@/app/(dashboard)/settings/integrations/IntegrationLogo'

interface CrmConnectionStatus {
  connected: boolean
  status: string
  location_id?: string
  connected_at?: string
  last_sync_at?: string
}

interface GoHighLevelIntegrationProps {
  workspaceId: string
  isPro: boolean
}

export function GoHighLevelIntegration({ workspaceId, isPro }: GoHighLevelIntegrationProps) {
  const queryClient = useQueryClient()
  const [connecting, setConnecting] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  // Fetch GHL connection status from crm_connections table
  const { data: connectionData, isLoading } = useQuery({
    queryKey: ['crm', 'connections', 'gohighlevel'],
    queryFn: async () => {
      const response = await fetch('/api/crm/connections/gohighlevel')
      if (!response.ok) throw new Error('Failed to fetch GoHighLevel connection status')
      return response.json()
    },
    enabled: !!workspaceId,
  })

  const connection: CrmConnectionStatus | null = connectionData?.data ?? null
  const isConnected = connection?.connected === true
  const isExpired = connection?.status === 'token_expired'

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/integrations/ghl/disconnect', {
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to disconnect GoHighLevel')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'connections', 'gohighlevel'] })
      queryClient.invalidateQueries({ queryKey: ['crm', 'connections'] })
      toast.success('GoHighLevel disconnected successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disconnect GoHighLevel')
    },
  })

  const handleConnect = () => {
    if (!isPro) {
      toast.error('GoHighLevel integration requires a Pro plan. Please upgrade to continue.')
      return
    }
    setConnecting(true)
    window.location.href = '/api/integrations/ghl/authorize'
  }

  const handleDisconnect = () => {
    setConfirmDisconnect(true)
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatSyncTime = (dateString: string | undefined | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <IntegrationLogo name="gohighlevel" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-zinc-900">GoHighLevel</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Push leads, contacts, and opportunities directly into your GHL sub-account
          </p>

          {!isPro && (
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-sm text-amber-800">
                Pro plan required.{' '}
                <Link
                  href="/settings/billing"
                  className="font-medium text-amber-900 underline hover:no-underline"
                >
                  Upgrade now
                </Link>
              </p>
            </div>
          )}

          {isConnected && isPro && (
            <div className="mt-4 rounded-lg bg-sky-50 border border-sky-200 p-3">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-sky-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="ml-2 text-sm font-medium text-sky-800">Connected to GoHighLevel</p>
              </div>
              <p className="mt-1 text-sm text-sky-700">
                Pixel-sourced leads sync automatically to your GHL location
              </p>
            </div>
          )}

          {isExpired && isPro && (
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="ml-2 text-sm font-medium text-amber-800">Token Expired</p>
              </div>
              <p className="mt-1 text-sm text-amber-700">
                Please reconnect to restore GHL sync
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {!isConnected && !isExpired ? (
              <button
                onClick={handleConnect}
                disabled={connecting || !isPro || isLoading}
                className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {connecting ? 'Connecting...' : 'Connect GoHighLevel'}
              </button>
            ) : isExpired ? (
              <>
                <button
                  onClick={handleConnect}
                  disabled={connecting || !isPro}
                  className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {connecting ? 'Reconnecting...' : 'Reconnect'}
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </>
            ) : (
              <button
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
              </button>
            )}
          </div>
        </div>
      </div>

      {isConnected && isPro && (
        <div className="mt-6 pt-6 border-t border-zinc-200">
          <h4 className="text-sm font-medium text-zinc-900 mb-3">Configuration</h4>
          <div className="space-y-3">
            {connection?.location_id && (
              <div>
                <span className="text-sm text-zinc-500">Location ID:</span>
                <p className="text-sm text-zinc-900 font-mono break-all mt-1">
                  {connection.location_id}
                </p>
              </div>
            )}
            <div>
              <span className="text-sm text-zinc-500">Connected:</span>
              <p className="text-sm text-zinc-900 mt-1">
                {formatDate(connection?.connected_at) || 'Unknown'}
              </p>
            </div>
            <div>
              <span className="text-sm text-zinc-500">Last Sync:</span>
              <p className="text-sm text-zinc-900 mt-1">{formatSyncTime(connection?.last_sync_at)}</p>
            </div>
            <div>
              <span className="text-sm text-zinc-500">Features:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-sky-100 text-sky-800">
                  Contact Sync
                </span>
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-sky-100 text-sky-800">
                  Opportunity Creation
                </span>
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-sky-100 text-sky-800">
                  Pixel Auto-Push
                </span>
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-sky-100 text-sky-800">
                  Workflow Triggers
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={confirmDisconnect} onOpenChange={setConfirmDisconnect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect GoHighLevel</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect GoHighLevel? Pixel-sourced leads will no longer
              sync to your GHL location and any opportunity automation will stop.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDisconnect(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                disconnectMutation.mutate()
                setConfirmDisconnect(false)
              }}
              disabled={disconnectMutation.isPending}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
