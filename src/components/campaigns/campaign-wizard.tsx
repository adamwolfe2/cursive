'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/design-system'

// Wizard Steps
import { StepBasics } from './wizard-steps/step-basics'
import { StepTargeting } from './wizard-steps/step-targeting'
import { StepValueProps } from './wizard-steps/step-value-props'
import { StepTemplates } from './wizard-steps/step-templates'
import { StepSequence } from './wizard-steps/step-sequence'
import { StepReview } from './wizard-steps/step-review'

// Types for campaign wizard form data
export interface CampaignFormData {
  // Step 1: Basics
  name: string
  description: string
  agent_id?: string

  // Step 2: Targeting
  target_industries: string[]
  target_company_sizes: string[]
  target_seniorities: string[]
  target_regions: string[]

  // Step 3: Value Props & Trust Signals
  value_propositions: Array<{
    id: string
    name: string
    description: string
    target_segments?: string[]
  }>
  trust_signals: Array<{
    id: string
    type: string
    content: string
  }>

  // Step 4: Templates
  selected_template_ids: string[]
  matching_mode: 'intelligent' | 'random'

  // Step 5: Sequence
  sequence_steps: number
  days_between_steps: number[]
  scheduled_start_at?: string
}

const STEPS = [
  { id: 'basics', title: 'Basics', description: 'Campaign name and settings' },
  { id: 'targeting', title: 'Targeting', description: 'Define your audience' },
  { id: 'value-props', title: 'Value Props', description: 'Messaging strategy' },
  { id: 'templates', title: 'Templates', description: 'Select email templates' },
  { id: 'sequence', title: 'Sequence', description: 'Timing and follow-ups' },
  { id: 'review', title: 'Review', description: 'Confirm and submit' },
]

const initialFormData: CampaignFormData = {
  name: '',
  description: '',
  agent_id: undefined,
  target_industries: [],
  target_company_sizes: [],
  target_seniorities: [],
  target_regions: [],
  value_propositions: [],
  trust_signals: [],
  selected_template_ids: [],
  matching_mode: 'intelligent',
  sequence_steps: 3,
  days_between_steps: [3, 5],
  scheduled_start_at: undefined,
}

export function CampaignWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<CampaignFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateFormData = useCallback((updates: Partial<CampaignFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0: // Basics
        return formData.name.trim().length > 0
      case 1: // Targeting
        return true // Targeting is optional
      case 2: // Value Props
        return true // Value props are optional
      case 3: // Templates
        return formData.selected_template_ids.length > 0 || formData.matching_mode === 'intelligent'
      case 4: // Sequence
        return formData.sequence_steps >= 1 && formData.sequence_steps <= 10
      case 5: // Review
        return true
      default:
        return false
    }
  }, [currentStep, formData])

  const handleNext = () => {
    if (currentStep < STEPS.length - 1 && canProceed()) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to create campaign')
      }

      const result = await response.json()
      router.push(`/campaigns/${result.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepBasics formData={formData} updateFormData={updateFormData} />
      case 1:
        return <StepTargeting formData={formData} updateFormData={updateFormData} />
      case 2:
        return <StepValueProps formData={formData} updateFormData={updateFormData} />
      case 3:
        return <StepTemplates formData={formData} updateFormData={updateFormData} />
      case 4:
        return <StepSequence formData={formData} updateFormData={updateFormData} />
      case 5:
        return <StepReview formData={formData} />
      default:
        return null
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Create Campaign"
        description="Set up a new email outreach campaign"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Campaigns', href: '/campaigns' },
          { label: 'Create New' },
        ]}
      />

      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {STEPS.map((step, index) => (
              <li
                key={step.id}
                className={cn(
                  'relative',
                  index !== STEPS.length - 1 && 'pr-8 sm:pr-20 flex-1'
                )}
              >
                <div className="flex items-center">
                  <div
                    className={cn(
                      'relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                      index < currentStep
                        ? 'border-primary bg-primary text-primary-foreground'
                        : index === currentStep
                        ? 'border-primary bg-background text-primary'
                        : 'border-border bg-background text-muted-foreground'
                    )}
                  >
                    {index < currentStep ? (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index !== STEPS.length - 1 && (
                    <div
                      className={cn(
                        'absolute top-4 left-8 -ml-px h-0.5 w-full sm:w-20',
                        index < currentStep ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  )}
                </div>
                <div className="mt-2 hidden sm:block">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Current Step Content */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            {STEPS[currentStep].title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {STEPS[currentStep].description}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 0 ? () => router.push('/campaigns') : handleBack}
            disabled={loading}
          >
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          <div className="flex gap-3">
            {currentStep === STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={handleSubmit}
                loading={loading}
                disabled={!canProceed()}
              >
                Create Campaign
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </Card>
    </PageContainer>
  )
}
