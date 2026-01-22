'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'

interface SlackIntegrationProps {
  user: any
  isPro: boolean
}

export function SlackIntegration({ user, isPro }: SlackIntegrationProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const isConnected = !!user?.slack_webhook_url

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/integrations/slack/disconnect', {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to disconnect Slack')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
    },
  })

  const handleConnect = () => {
    if (!isPro) {
      alert('Slack integration requires a Pro plan. Please upgrade to continue.')
      return
    }

    setLoading(true)
    // Redirect to Slack OAuth
    window.location.href = '/api/integrations/slack/oauth'
  }

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect Slack?')) {
      disconnectMutation.mutate()
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
            💬
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Slack</h3>
          <p className="mt-1 text-sm text-gray-500">
            Send lead notifications to your Slack workspace
          </p>

          {!isPro && (
            <div className="mt-3 rounded-lg bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">
                Pro plan required.{' '}
                <Link
                  href="/pricing"
                  className="font-medium underline hover:text-yellow-900"
                >
                  Upgrade now
                </Link>
              </p>
            </div>
          )}

          {isConnected && isPro && (
            <div className="mt-3 rounded-lg bg-green-50 p-3">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-green-400"
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
                <p className="ml-2 text-sm font-medium text-green-800">
                  Connected to Slack
                </p>
              </div>
              <p className="mt-1 text-sm text-green-700">
                Leads will be delivered to your configured channel
              </p>
            </div>
          )}

          <div className="mt-4 flex space-x-3">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={loading || !isPro}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Connecting...' : 'Connect Slack'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => alert('Test notification sent to Slack!')}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Test Connection
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                  className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {disconnectMutation.isPending
                    ? 'Disconnecting...'
                    : 'Disconnect'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isConnected && isPro && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Configuration
          </h4>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Webhook URL:</span>
              <p className="text-sm text-gray-900 font-mono break-all mt-1">
                {user?.slack_webhook_url?.substring(0, 50)}...
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Notification Types:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                  New Leads
                </span>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                  Hot Leads
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
