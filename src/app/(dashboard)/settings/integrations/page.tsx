'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/lib/hooks/use-toast'
import { SlackIntegration } from '@/components/integrations/slack-integration'
import { ZapierIntegration } from '@/components/integrations/zapier-integration'

// Integration logo configuration
const INTEGRATION_LOGOS: Record<string, { src: string; alt: string }> = {
  slack: { src: '/logos/slack.png', alt: 'Slack' },
  zapier: { src: '/logos/zapier.png', alt: 'Zapier' },
  salesforce: { src: '/logos/salesforce.png', alt: 'Salesforce' },
  hubspot: { src: '/logos/hubspot.png', alt: 'HubSpot' },
  pipedrive: { src: '/logos/pipedrive.png', alt: 'Pipedrive' },
  'google-sheets': { src: '/logos/google-sheets.png', alt: 'Google Sheets' },
  'microsoft-teams': { src: '/logos/microsoft-teams.png', alt: 'Microsoft Teams' },
  discord: { src: '/logos/discord.png', alt: 'Discord' },
}

// Fallback icon component when logo is not available
function FallbackIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    salesforce: 'bg-blue-500',
    hubspot: 'bg-orange-500',
    pipedrive: 'bg-green-600',
    'google-sheets': 'bg-green-500',
    'microsoft-teams': 'bg-purple-600',
    discord: 'bg-indigo-600',
  }

  const labels: Record<string, string> = {
    salesforce: 'SF',
    hubspot: 'HS',
    pipedrive: 'PD',
    'google-sheets': 'GS',
    'microsoft-teams': 'MT',
    discord: 'DC',
  }

  return (
    <div className={`w-10 h-10 rounded-lg ${icons[name] || 'bg-zinc-400'} flex items-center justify-center text-white text-xs font-bold`}>
      {labels[name] || name.slice(0, 2).toUpperCase()}
    </div>
  )
}

// Integration logo component with fallback
function IntegrationLogo({ name }: { name: string }) {
  const [hasError, setHasError] = useState(false)
  const logo = INTEGRATION_LOGOS[name]

  if (!logo || hasError) {
    return <FallbackIcon name={name} />
  }

  return (
    <Image
      src={logo.src}
      alt={logo.alt}
      width={40}
      height={40}
      className="object-contain"
      onError={() => setHasError(true)}
    />
  )
}

export default function IntegrationsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [customWebhookUrl, setCustomWebhookUrl] = useState('')

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

  // Save custom webhook mutation
  const saveCustomWebhookMutation = useMutation({
    mutationFn: async (webhookUrl: string) => {
      const response = await fetch('/api/integrations/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_url: webhookUrl }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save webhook')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      toast.success('Custom webhook saved successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save webhook')
    },
  })

  // Generate API key mutation
  const generateApiKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/integrations/api-key', {
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate API key')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      toast.success('API key generated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate API key')
    },
  })

  const handleSaveCustomWebhook = () => {
    if (!customWebhookUrl) {
      toast.error('Please enter a webhook URL')
      return
    }

    try {
      new URL(customWebhookUrl)
      saveCustomWebhookMutation.mutate(customWebhookUrl)
    } catch {
      toast.error('Please enter a valid URL')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse" />
        <div className="h-96 bg-zinc-200 rounded animate-pulse" />
      </div>
    )
  }

  const isPro = user?.plan === 'pro'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Integrations</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Connect Cursive with your favorite tools and automate your lead workflow
        </p>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-500"
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
              Multi-Channel Lead Delivery
            </h3>
            <p className="mt-2 text-sm text-blue-700">
              Connect Slack, Zapier, or custom webhooks to receive leads in real-time
              across multiple channels. Pro plan required for integrations.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Integrations */}
      <div className="grid gap-6 md:grid-cols-2">
        <SlackIntegration user={user} isPro={isPro} />
        <ZapierIntegration user={user} isPro={isPro} />
      </div>

      {/* Custom Webhooks */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-zinc-900">Custom Webhooks</h2>
            <p className="text-sm text-zinc-600 mt-1">
              Send lead data to any endpoint via HTTP POST. Perfect for custom
              integrations and internal tools.
            </p>
          </div>
          {!isPro && (
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 ml-4">
              Pro
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              placeholder="https://your-domain.com/webhook"
              className="block w-full rounded-lg border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-zinc-50 disabled:cursor-not-allowed"
              value={customWebhookUrl || user?.custom_webhook_url || ''}
              onChange={(e) => setCustomWebhookUrl(e.target.value)}
              disabled={!isPro}
            />
            <p className="mt-1 text-xs text-zinc-500">
              Receives POST requests with JSON lead data
            </p>
          </div>

          <button
            onClick={handleSaveCustomWebhook}
            disabled={!isPro || saveCustomWebhookMutation.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {saveCustomWebhookMutation.isPending ? 'Saving...' : 'Save Webhook'}
          </button>

          {!isPro && (
            <p className="text-sm text-zinc-500 mt-2">
              <Link
                href="/settings/billing"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Upgrade to Pro
              </Link>{' '}
              to use custom webhooks
            </p>
          )}
        </div>

        {user?.custom_webhook_url && isPro && (
          <div className="mt-6 pt-6 border-t border-zinc-200">
            <h3 className="text-sm font-medium text-zinc-900 mb-3">Webhook Payload</h3>
            <pre className="text-xs bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(
                {
                  event: 'lead.created',
                  lead_id: 'uuid',
                  company: {
                    name: 'Acme Corp',
                    domain: 'acme.com',
                    industry: 'Technology',
                    employee_count: 250,
                  },
                  contact: {
                    name: 'John Smith',
                    email: 'john@acme.com',
                    title: 'VP of Engineering',
                  },
                  intent_score: 'hot',
                  query_id: 'uuid',
                  created_at: '2026-01-23T10:00:00Z',
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>

      {/* API Keys */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-zinc-900">API Keys</h2>
            <p className="text-sm text-zinc-600 mt-1">
              Generate API keys to access Cursive programmatically via our REST API.
            </p>
          </div>
          {!isPro && (
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 ml-4">
              Pro
            </span>
          )}
        </div>

        {user?.api_key && isPro ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Your API Key
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={user.api_key}
                  readOnly
                  className="block flex-1 rounded-lg border-zinc-300 bg-zinc-50 shadow-sm text-sm font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user.api_key)
                    toast.success('API key copied to clipboard!')
                  }}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                if (
                  confirm(
                    'Are you sure you want to regenerate your API key? The old key will stop working immediately.'
                  )
                ) {
                  generateApiKeyMutation.mutate()
                }
              }}
              disabled={generateApiKeyMutation.isPending}
              className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
            >
              {generateApiKeyMutation.isPending ? 'Regenerating...' : 'Regenerate API Key'}
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={() => generateApiKeyMutation.mutate()}
              disabled={!isPro || generateApiKeyMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {generateApiKeyMutation.isPending ? 'Generating...' : 'Generate API Key'}
            </button>

            {!isPro && (
              <p className="text-sm text-zinc-500 mt-3">
                <Link
                  href="/settings/billing"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Upgrade to Pro
                </Link>{' '}
                to generate API keys
              </p>
            )}
          </div>
        )}

        {user?.api_key && isPro && (
          <div className="mt-6 pt-6 border-t border-zinc-200">
            <h3 className="text-sm font-medium text-zinc-900 mb-3">Example Usage</h3>
            <pre className="text-xs bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto">
              {`curl -X GET "https://api.meetcursive.com/v1/leads" \\
  -H "Authorization: Bearer ${user.api_key}" \\
  -H "Content-Type: application/json"`}
            </pre>
            <p className="text-sm text-zinc-500 mt-3">
              <a
                href="/docs/api"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View API Documentation →
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Coming Soon - with real logos */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 mb-6">Coming Soon</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: 'Salesforce',
              key: 'salesforce',
              description: 'Sync leads directly to Salesforce CRM',
            },
            {
              name: 'HubSpot',
              key: 'hubspot',
              description: 'Push leads to HubSpot contacts',
            },
            {
              name: 'Pipedrive',
              key: 'pipedrive',
              description: 'Create deals in Pipedrive automatically',
            },
            {
              name: 'Google Sheets',
              key: 'google-sheets',
              description: 'Export leads to Google Sheets',
            },
            {
              name: 'Microsoft Teams',
              key: 'microsoft-teams',
              description: 'Receive lead notifications in Teams',
            },
            {
              name: 'Discord',
              key: 'discord',
              description: 'Get lead alerts in Discord channels',
            },
          ].map((integration) => (
            <div
              key={integration.key}
              className="rounded-xl border border-zinc-200 p-4 opacity-60 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <IntegrationLogo name={integration.key} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {integration.name}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{integration.description}</p>
                </div>
              </div>
              <div className="mt-4">
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-zinc-100 text-zinc-600">
                  Coming Soon
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade CTA */}
      {!isPro && (
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Unlock All Integrations</h2>
              <p className="text-blue-100">
                Upgrade to Pro to connect Slack, Zapier, custom webhooks, and access our API.
                Automate your entire lead workflow.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                href="/settings/billing"
                className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors shadow-md"
              >
                Upgrade to Pro →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
