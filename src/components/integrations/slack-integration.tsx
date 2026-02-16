'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

interface SlackIntegrationProps {
  user: any
  isPro: boolean
}

export function SlackIntegration({ user, isPro }: SlackIntegrationProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)

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
      toast.error('Slack integration requires a Pro plan. Please upgrade to continue.')
      return
    }

    setLoading(true)
    // Redirect to Slack OAuth
    window.location.href = '/api/integrations/slack/oauth'
  }

  const handleDisconnect = () => {
    toast.warning('Are you sure you want to disconnect Slack?', {
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

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {!logoError ? (
            <Image
              src="/Slack_icon_2019.svg.png"
              alt="Slack"
              width={40}
              height={40}
              className="object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold">
              SL
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-zinc-900">Slack</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Send lead notifications to your Slack workspace
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
                  Connected to Slack
                </p>
              </div>
              <p className="mt-1 text-sm text-blue-700">
                Leads will be delivered to your configured channel
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={loading || !isPro}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loading ? 'Connecting...' : 'Connect Slack'}
              </button>
            ) : (
              <>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/integrations/slack/test', { method: 'POST' })
                      if (res.ok) {
                        toast.success('Test notification sent to Slack!')
                      } else {
                        toast.error('Failed to send test notification. Please reconnect Slack.')
                      }
                    } catch {
                      toast.error('Failed to send test notification.')
                    }
                  }}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Test Connection
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
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
        <div className="mt-6 pt-6 border-t border-zinc-200">
          <h4 className="text-sm font-medium text-zinc-900 mb-3">
            Configuration
          </h4>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-zinc-500">Webhook URL:</span>
              <p className="text-sm text-zinc-900 font-mono break-all mt-1">
                {user?.slack_webhook_url?.substring(0, 50)}...
              </p>
            </div>
            <div>
              <span className="text-sm text-zinc-500">Notification Types:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                  New Leads
                </span>
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800">
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
