'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'

interface RequestMoreLeadsBannerProps {
  currentLeads: number
  leadLimit: number
  workspaceName?: string
}

export function RequestMoreLeadsBanner({ currentLeads, leadLimit, workspaceName }: RequestMoreLeadsBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)

  // Calculate if near or at limit
  const percentUsed = (currentLeads / leadLimit) * 100
  const isNearLimit = percentUsed >= 80
  const isAtLimit = percentUsed >= 100

  // Don't show if dismissed or if under 80% usage
  if (dismissed || (!isNearLimit && !isAtLimit)) {
    return null
  }

  const handleRequest = async () => {
    setRequesting(true)
    try {
      const response = await fetch('/api/features/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_type: 'more_leads',
          request_title: `Request More Leads - Currently at ${currentLeads}/${leadLimit}`,
          request_description: `I need more leads for ${workspaceName || 'my workspace'}. Currently at ${percentUsed.toFixed(0)}% of my limit.`,
          request_data: {
            current_leads: currentLeads,
            current_limit: leadLimit,
            percent_used: percentUsed,
          },
          priority: isAtLimit ? 'high' : 'normal',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit request')
      }

      setRequested(true)
      // Auto-dismiss after 5 seconds
      setTimeout(() => setDismissed(true), 5000)
    } catch (error) {
      console.error('Failed to request more leads:', error)
      alert(error instanceof Error ? error.message : 'Failed to submit request')
    } finally {
      setRequesting(false)
    }
  }

  if (requested) {
    return (
      <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-green-900 mb-1">Request Submitted!</h3>
          <p className="text-sm text-green-700">
            Our team received your request for more leads and will contact you within 24 hours to discuss your needs.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-green-600 hover:text-green-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <div className={`mb-8 p-6 rounded-xl border-2 flex items-start gap-4 ${
      isAtLimit
        ? 'bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border-red-200'
        : 'bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-amber-200'
    }`}>
      <div className="flex-shrink-0">
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
          isAtLimit ? 'bg-red-100' : 'bg-amber-100'
        }`}>
          <Sparkles className={`h-6 w-6 ${isAtLimit ? 'text-red-600' : 'text-amber-600'}`} />
        </div>
      </div>
      <div className="flex-1">
        <h3 className={`text-lg font-bold mb-1 ${isAtLimit ? 'text-red-900' : 'text-amber-900'}`}>
          {isAtLimit ? '🚨 Lead Limit Reached!' : '⚠️ Approaching Lead Limit'}
        </h3>
        <p className={`text-sm mb-3 ${isAtLimit ? 'text-red-700' : 'text-amber-700'}`}>
          {isAtLimit
            ? `You've reached your limit of ${leadLimit} leads. Request more to continue receiving qualified prospects.`
            : `You're at ${currentLeads}/${leadLimit} leads (${percentUsed.toFixed(0)}%). Request more now to avoid interruption.`
          }
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRequest}
            disabled={requesting}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              isAtLimit
                ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400'
                : 'bg-amber-600 text-white hover:bg-amber-700 disabled:bg-amber-400'
            }`}
          >
            {requesting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting Request...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Request More Leads
              </>
            )}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className={`text-sm ${isAtLimit ? 'text-red-600 hover:text-red-800' : 'text-amber-600 hover:text-amber-800'}`}
          >
            Dismiss
          </button>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className={`flex-shrink-0 ${isAtLimit ? 'text-red-600 hover:text-red-800' : 'text-amber-600 hover:text-amber-800'}`}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}
