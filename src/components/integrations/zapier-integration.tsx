'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'

interface ZapierIntegrationProps {
  user: any
  isPro: boolean
}

export function ZapierIntegration({ user, isPro }: ZapierIntegrationProps) {
  const queryClient = useQueryClient()
  const [showWebhook, setShowWebhook] = useState(false)

  const hasWebhook = !!user?.zapier_webhook_url

  const generateWebhookMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/integrations/zapier/generate', {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to generate webhook')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      setShowWebhook(true)
    },
  })

  const revokeWebhookMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/integrations/zapier/revoke', {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to revoke webhook')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      setShowWebhook(false)
    },
  })

  const handleGenerate = () => {
    if (!isPro) {
      alert('Zapier integration requires a Pro plan. Please upgrade to continue.')
      return
    }

    generateWebhookMutation.mutate()
  }

  const handleRevoke = () => {
    if (confirm('Are you sure you want to revoke this webhook URL?')) {
      revokeWebhookMutation.mutate()
    }
  }

  const copyWebhookUrl = () => {
    if (user?.zapier_webhook_url) {
      navigator.clipboard.writeText(user.zapier_webhook_url)
      alert('Webhook URL copied to clipboard!')
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-2xl">
            ⚡
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Zapier</h3>
          <p className="mt-1 text-sm text-gray-500">
            Connect to 5,000+ apps via Zapier webhooks
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

          {hasWebhook && isPro && (
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
                  Webhook Active
                </p>
              </div>
              <p className="mt-1 text-sm text-green-700">
                Use this webhook URL in your Zapier Zaps
              </p>
            </div>
          )}

          <div className="mt-4 flex space-x-3">
            {!hasWebhook ? (
              <button
                onClick={handleGenerate}
                disabled={generateWebhookMutation.isPending || !isPro}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generateWebhookMutation.isPending
                  ? 'Generating...'
                  : 'Generate Webhook'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowWebhook(!showWebhook)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {showWebhook ? 'Hide' : 'Show'} Webhook URL
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={revokeWebhookMutation.isPending}
                  className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {revokeWebhookMutation.isPending ? 'Revoking...' : 'Revoke'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {hasWebhook && showWebhook && isPro && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Webhook URL
          </h4>
          <div className="flex space-x-2">
            <input
              type="text"
              value={user?.zapier_webhook_url || ''}
              readOnly
              className="block flex-1 rounded-md border-gray-300 bg-gray-50 text-sm font-mono shadow-sm"
            />
            <button
              onClick={copyWebhookUrl}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Copy
            </button>
          </div>

          <div className="mt-4 rounded-lg bg-blue-50 p-3">
            <h5 className="text-sm font-medium text-blue-900 mb-2">
              How to use with Zapier:
            </h5>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Copy the webhook URL above</li>
              <li>Create a new Zap in Zapier</li>
              <li>Use &quot;Webhooks by Zapier&quot; as the trigger</li>
              <li>Choose &quot;Catch Hook&quot; and paste your webhook URL</li>
              <li>Configure your action (e.g., add to Google Sheets, send to CRM)</li>
              <li>Test and activate your Zap!</li>
            </ol>
          </div>

          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-900 mb-2">
              Webhook Payload:
            </h5>
            <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto">
              {JSON.stringify(
                {
                  lead_id: 'uuid',
                  company: {
                    name: 'Acme Corp',
                    domain: 'acme.com',
                    industry: 'Technology',
                  },
                  contact: {
                    name: 'John Smith',
                    email: 'john@acme.com',
                    title: 'VP of Engineering',
                  },
                  intent_score: 'hot',
                  created_at: '2026-01-22T10:00:00Z',
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
