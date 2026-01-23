'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TopicSearchStep } from './wizard-steps/topic-search-step'
import { LocationFilterStep } from './wizard-steps/location-filter-step'
import { CompanySizeFilterStep } from './wizard-steps/company-size-filter-step'
import { IndustryFilterStep } from './wizard-steps/industry-filter-step'
import { ReviewStep } from './wizard-steps/review-step'
import type { QueryFilters } from '@/types'
import { LoadingButton } from '@/components/loading-button'
import { ErrorDisplay } from '@/components/error-display'

export interface WizardState {
  step: number
  topic_id: string | null
  topic_name: string | null
  filters: QueryFilters
}

const TOTAL_STEPS = 5
const STORAGE_KEY = 'openinfo-query-wizard-state'

const STEP_LABELS = [
  'Select Topic',
  'Location',
  'Company Size',
  'Industry',
  'Review & Create',
]

export function QueryWizard() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [state, setState] = useState<WizardState>({
    step: 1,
    topic_id: null,
    topic_name: null,
    filters: {
      location: null,
      company_size: null,
      industry: null,
      revenue_range: null,
      employee_range: null,
      technologies: null,
      exclude_companies: [],
    },
  })

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsedState = JSON.parse(saved)
        setState(parsedState)
      } catch (err) {
        // Ignore invalid saved state
      }
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const updateState = (updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    if (state.step < TOTAL_STEPS) {
      updateState({ step: state.step + 1 })
    }
  }

  const prevStep = () => {
    if (state.step > 1) {
      updateState({ step: state.step - 1 })
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: state.topic_id,
          filters: state.filters,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create query')
      }

      // Clear saved state
      localStorage.removeItem(STORAGE_KEY)

      // Redirect to queries list
      router.push('/queries')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((stepNum) => (
            <div
              key={stepNum}
              className="flex flex-1 items-center last:flex-none"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-medium transition-all duration-150 ${
                  stepNum <= state.step
                    ? 'bg-zinc-900 text-white'
                    : stepNum === state.step + 1
                      ? 'bg-zinc-200 text-zinc-600'
                      : 'bg-zinc-100 text-zinc-400'
                }`}
              >
                {stepNum}
              </div>
              {stepNum < 5 && (
                <div
                  className={`mx-4 h-1 flex-1 rounded transition-all duration-150 ${
                    stepNum < state.step ? 'bg-zinc-900' : 'bg-zinc-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between text-[12px] text-zinc-500">
          {STEP_LABELS.map((label, idx) => (
            <span
              key={label}
              className={`${idx + 1 === state.step ? 'font-medium text-zinc-900' : ''}`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-[13px] text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="rounded-lg bg-white border border-zinc-200 p-8 shadow-sm">
        {state.step === 1 && (
          <TopicSearchStep
            selectedTopicId={state.topic_id}
            selectedTopicName={state.topic_name}
            onSelect={(topicId, topicName) => {
              updateState({ topic_id: topicId, topic_name: topicName })
            }}
            onNext={nextStep}
          />
        )}

        {state.step === 2 && (
          <LocationFilterStep
            filters={state.filters}
            onUpdate={(filters) => updateState({ filters })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}

        {state.step === 3 && (
          <CompanySizeFilterStep
            filters={state.filters}
            onUpdate={(filters) => updateState({ filters })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}

        {state.step === 4 && (
          <IndustryFilterStep
            filters={state.filters}
            onUpdate={(filters) => updateState({ filters })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}

        {state.step === 5 && (
          <ReviewStep
            topicName={state.topic_name || 'Unknown Topic'}
            filters={state.filters}
            onSubmit={handleSubmit}
            onBack={prevStep}
            loading={loading}
          />
        )}
      </div>
    </div>
  )
}
