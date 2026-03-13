'use client'

import { useState } from 'react'
import { useToast } from '@/lib/hooks/use-toast'
import { IntegrationLogo } from './IntegrationLogo'

interface Integration {
  name: string
  key: string
  description: string
  premium: boolean
}

interface IntegrationCardProps {
  integration: Integration
  toast: ReturnType<typeof useToast>
}

export function IntegrationCard({ integration, toast }: IntegrationCardProps) {
  const [requesting, setRequesting] = useState(false)

  const handleRequestIntegration = async () => {
    setRequesting(true)
    try {
      const response = await fetch('/api/features/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_type: 'custom_integration',
          request_title: `${integration.name} Integration Request`,
          request_description: `Please set up ${integration.name} integration to sync leads automatically.`,
          request_data: {
            integration_name: integration.name,
            integration_key: integration.key,
          },
          priority: 'normal',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit request')
      }

      toast.success(`${integration.name} integration requested! Our team will contact you shortly.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit request')
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <IntegrationLogo name={integration.key} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">{integration.name}</h3>
            {integration.premium && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                Coming Soon
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{integration.description}</p>
        </div>
      </div>
      <div className="mt-4">
        {integration.premium ? (
          <button
            onClick={handleRequestIntegration}
            disabled={requesting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {requesting ? (
              <>
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Requesting...
              </>
            ) : (
              <>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Request Integration
              </>
            )}
          </button>
        ) : (
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            Coming Soon - Free
          </span>
        )}
      </div>
    </div>
  )
}
