'use client'

import { useQuery } from '@tanstack/react-query'
import { SlackIntegration } from '@/components/integrations/slack-integration'
import { ZapierIntegration } from '@/components/integrations/zapier-integration'

export default function IntegrationsPage() {
  // Fetch current user
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/users/me')
      if (!response.ok) throw new Error('Failed to fetch user data')
      return response.json()
    },
  })

  const user = userData?.data

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-96 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="mt-2 text-sm text-gray-600">
          Connect OpenInfo with your favorite tools and services
        </p>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Multi-channel Lead Delivery
            </h3>
            <p className="mt-2 text-sm text-blue-700">
              Connect Slack or set up webhooks to receive leads in real-time
              across multiple channels. Pro plan required for Slack
              integrations.
            </p>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <SlackIntegration
          user={user}
          isPro={user?.plan === 'pro'}
        />

        <ZapierIntegration
          user={user}
          isPro={user?.plan === 'pro'}
        />
      </div>

      {/* Coming Soon */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Coming Soon
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: 'Salesforce',
              icon: '☁️',
              description: 'Sync leads directly to Salesforce CRM',
            },
            {
              name: 'HubSpot',
              icon: '🟠',
              description: 'Push leads to HubSpot contacts',
            },
            {
              name: 'Pipedrive',
              icon: '🔵',
              description: 'Create deals in Pipedrive automatically',
            },
            {
              name: 'Google Sheets',
              icon: '📊',
              description: 'Export leads to Google Sheets',
            },
            {
              name: 'Microsoft Teams',
              icon: '💬',
              description: 'Receive lead notifications in Teams',
            },
            {
              name: 'Discord',
              icon: '🎮',
              description: 'Get lead alerts in Discord channels',
            },
          ].map((integration) => (
            <div
              key={integration.name}
              className="rounded-lg border border-gray-200 p-4 opacity-50"
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{integration.icon}</div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    {integration.name}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {integration.description}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                  Coming Soon
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Webhooks (For advanced users) */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Custom Webhooks
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Send lead data to any endpoint via HTTP POST. Perfect for custom
          integrations and internal tools.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              placeholder="https://your-domain.com/webhook"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              defaultValue={user?.custom_webhook_url || ''}
            />
          </div>

          <button
            disabled={user?.plan !== 'pro'}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {user?.plan !== 'pro' ? 'Pro Plan Required' : 'Save Webhook'}
          </button>
        </div>
      </div>
    </div>
  )
}
