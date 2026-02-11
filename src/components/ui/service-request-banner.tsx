'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useToast } from '@/lib/hooks/use-toast'

interface ServiceRequestBannerProps {
  title: string
  description: string
  requestType: string
  variant?: 'inline' | 'card' | 'banner'
  ctaLabel?: string
  showBookCall?: boolean
}

export function ServiceRequestBanner({
  title,
  description,
  requestType,
  variant = 'card',
  ctaLabel = 'Request This',
  showBookCall = true,
}: ServiceRequestBannerProps) {
  const toast = useToast()
  const [submitted, setSubmitted] = useState(false)

  // Fetch user info to auto-fill the request
  const { data: userData } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/users/me')
      if (!response.ok) throw new Error('Failed to fetch user data')
      return response.json()
    },
  })

  const user = userData?.data

  // Submit service request
  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/service-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: requestType,
          details: `${title}: ${description}`,
          metadata: {
            source_component: 'service-request-banner',
            variant,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit request')
      }

      return response.json()
    },
    onSuccess: () => {
      setSubmitted(true)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit request. Please try again.')
    },
  })

  const handleSubmit = () => {
    if (!user) {
      toast.error('Please sign in to submit a request.')
      return
    }
    submitMutation.mutate()
  }

  // Success state
  if (submitted) {
    return (
      <SuccessState
        variant={variant}
        showBookCall={showBookCall}
      />
    )
  }

  // Variant-specific rendering
  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900">{title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitMutation.isPending ? 'Submitting...' : ctaLabel}
          </button>
          {showBookCall && (
            <a
              href="https://cal.com/adamwolfe/cursive-ai-audit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
            >
              Book a Call
            </a>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-shrink-0">
            <div className="p-2 rounded-lg bg-primary/10">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-primary">{title}</h3>
            <p className="mt-1 text-sm text-primary/80">{description}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {submitMutation.isPending ? 'Submitting...' : ctaLabel}
            </button>
            {showBookCall && (
              <a
                href="https://cal.com/adamwolfe/cursive-ai-audit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
              >
                Book a Call
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default: 'card' variant
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-shrink-0">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
          <p className="mt-1 text-sm text-zinc-600">{description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {submitMutation.isPending ? 'Submitting...' : ctaLabel}
            </button>
            {showBookCall && (
              <a
                href="https://cal.com/adamwolfe/cursive-ai-audit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Book a Call
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Success state shown after a request is submitted
 */
function SuccessState({
  variant,
  showBookCall,
}: {
  variant: 'inline' | 'card' | 'banner'
  showBookCall: boolean
}) {
  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <svg
            className="h-4 w-4 text-green-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p className="text-sm text-green-700">
            Submitted! We&apos;ll reach out within 24 hours.
          </p>
        </div>
        {showBookCall && (
          <a
            href="https://cal.com/adamwolfe/cursive-ai-audit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
          >
            Book a Call
          </a>
        )}
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-shrink-0">
            <div className="p-2 rounded-lg bg-green-100">
              <svg
                className="h-5 w-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-green-800">Request Submitted!</h3>
            <p className="mt-1 text-sm text-green-700">
              We&apos;ll reach out within 24 hours.
            </p>
          </div>
          {showBookCall && (
            <a
              href="https://cal.com/adamwolfe/cursive-ai-audit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors shadow-sm flex-shrink-0"
            >
              Book a Call
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>
      </div>
    )
  }

  // Default: 'card' variant
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-shrink-0">
          <div className="p-2.5 rounded-lg bg-green-100">
            <svg
              className="h-5 w-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-green-800">Request Submitted!</h3>
          <p className="mt-1 text-sm text-green-700">
            We&apos;ll reach out within 24 hours.
          </p>
        </div>
        {showBookCall && (
          <a
            href="https://cal.com/adamwolfe/cursive-ai-audit"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors shadow-sm flex-shrink-0"
          >
            Book a Call
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>
    </div>
  )
}
