'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

interface CrmConnectionStatus {
  connected: boolean
  status: string
  instance_url?: string
  connected_at?: string
  last_sync_at?: string
}

interface GoogleSheetsIntegrationProps {
  workspaceId: string
  isPro: boolean
}

export function GoogleSheetsIntegration({ workspaceId, isPro }: GoogleSheetsIntegrationProps) {
  const queryClient = useQueryClient()
  const [logoError, setLogoError] = useState(false)
  const [connecting, setConnecting] = useState(false)

  // Fetch Google Sheets connection status from crm_connections table
  const { data: connectionData, isLoading } = useQuery({
    queryKey: ['crm', 'connections', 'google_sheets'],
    queryFn: async () => {
      const response = await fetch('/api/crm/connections/google_sheets')
      if (!response.ok) throw new Error('Failed to fetch Google Sheets connection status')
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
      const response = await fetch('/api/crm/auth/google-sheets/disconnect', {
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to disconnect Google Sheets')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'connections', 'google_sheets'] })
      queryClient.invalidateQueries({ queryKey: ['crm', 'connections'] })
    },
  })

  const handleConnect = () => {
    if (!isPro) {
      toast.error('Google Sheets integration requires a Pro plan. Please upgrade to continue.')
      return
    }
    setConnecting(true)
    window.location.href = '/api/crm/auth/google-sheets/authorize'
  }

  const handleDisconnect = () => {
    toast.warning('Are you sure you want to disconnect Google Sheets? Your export configuration will be removed.', {
      action: {
        label: 'Disconnect',
        onClick: () => disconnectMutation.mutate(),
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    })
  }

  // Format connected date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Format last sync time
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
          {!logoError ? (
            <Image
              src="/Google_Sheets_Logo_512px.png"
              alt="Google Sheets"
              width={40}
              height={40}
              className="object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center text-white text-xs font-bold">
              GS
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-zinc-900">Google Sheets</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Export leads to Google Sheets automatically
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
            <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-blue-600"
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
                <p className="ml-2 text-sm font-medium text-blue-800">
                  Connected to Google Sheets
                </p>
              </div>
              <p className="mt-1 text-sm text-blue-700">
                Leads will be exported to your connected spreadsheet
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
                <p className="ml-2 text-sm font-medium text-amber-800">
                  Token Expired
                </p>
              </div>
              <p className="mt-1 text-sm text-amber-700">
                Please reconnect to restore Google Sheets export
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {!isConnected && !isExpired ? (
              <button
                onClick={handleConnect}
                disabled={connecting || !isPro || isLoading}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {connecting ? 'Connecting...' : 'Connect Google Sheets'}
              </button>
            ) : isExpired ? (
              <>
                <button
                  onClick={handleConnect}
                  disabled={connecting || !isPro}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
          <h4 className="text-sm font-medium text-zinc-900 mb-3">
            Configuration
          </h4>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-zinc-500">Connected:</span>
              <p className="text-sm text-zinc-900 mt-1">
                {formatDate(connection?.connected_at) || 'Unknown'}
              </p>
            </div>
            <div>
              <span className="text-sm text-zinc-500">Last Export:</span>
              <p className="text-sm text-zinc-900 mt-1">
                {formatSyncTime(connection?.last_sync_at)}
              </p>
            </div>
            <div>
              <span className="text-sm text-zinc-500">Features:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800">
                  Auto Export
                </span>
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800">
                  Custom Columns
                </span>
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800">
                  Scheduled Sync
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
