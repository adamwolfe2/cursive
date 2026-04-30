'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react'
import type { OnboardingTemplate } from '@/types/onboarding-templates'
import type { ParsedIntakeData, ContextFormat, TemplateData } from '@/types/onboarding-templates'
import { useWizardState } from '@/lib/hooks/use-wizard-state'
import StepIndicator from './StepIndicator'
import DealSummary from './DealSummary'
import DealConfigStep from './steps/DealConfigStep'
import CallNotesStep from './steps/CallNotesStep'
import ReviewStep from './steps/ReviewStep'
import InvoiceContractStep from './steps/InvoiceContractStep'
import CreateClientStep from './steps/CreateClientStep'

interface OnboardingWizardProps {
  templates: OnboardingTemplate[]
}

export default function OnboardingWizard({ templates }: OnboardingWizardProps) {
  const { state, actions, hasDraft, resumeDraft, startFresh } = useWizardState()

  // ---------------------------------------------------------------------------
  // Step 2 handlers
  // ---------------------------------------------------------------------------

  const handleTemplateSelect = useCallback(
    (data: TemplateData | null, id: string | null) => {
      actions.setTemplateData(data)
      actions.setTemplateId(id)
    },
    [actions]
  )

  const handleParse = useCallback(
    (rawContext: string, format: ContextFormat) => {
      actions.setRawContext(rawContext)
      actions.setContextFormat(format)
      actions.setIsParsing(true)
    },
    [actions]
  )

  const handleParsed = useCallback(
    (data: ParsedIntakeData) => {
      actions.setParsedData(data)
      actions.setIsParsing(false)
      actions.markStepComplete(1)
      actions.goToStep(2) // Jump to review
    },
    [actions]
  )

  const handleParseError = useCallback(
    (error: string) => {
      actions.setIsParsing(false)
      toast.error(`Parse failed: ${error}`)
    },
    [actions]
  )

  const handleSkipNotes = useCallback(() => {
    actions.markStepComplete(1)
    actions.goToStep(2)
  }, [actions])

  // ---------------------------------------------------------------------------
  // Draft resume banner
  // ---------------------------------------------------------------------------

  if (hasDraft) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Resume Draft?</h2>
        <p className="text-sm text-gray-500 mb-6">
          You have an unsaved onboarding draft. Would you like to resume or start fresh?
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={resumeDraft}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Resume Draft
          </button>
          <button
            type="button"
            onClick={startFresh}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Start Fresh
          </button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render current step
  // ---------------------------------------------------------------------------

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <DealConfigStep
            deal={state.deal}
            onUpdate={actions.updateDeal}
          />
        )
      case 1:
        return (
          <CallNotesStep
            deal={state.deal}
            templates={templates}
            selectedTemplateId={state.selectedTemplateId}
            isParsing={state.isParsing}
            onTemplateSelect={handleTemplateSelect}
            onParse={handleParse}
            onParsed={handleParsed}
            onParseError={handleParseError}
            onSkip={handleSkipNotes}
          />
        )
      case 2:
        return (
          <ReviewStep
            deal={state.deal}
            parsedData={state.parsedData}
            onChange={actions.setParsedData}
          />
        )
      case 3:
        return (
          <InvoiceContractStep
            deal={state.deal}
            parsedData={state.parsedData}
            invoice={state.invoice}
            contract={state.contract}
            onInvoiceUpdate={actions.setInvoice}
            onContractUpdate={actions.setContract}
          />
        )
      case 4:
        return (
          <CreateClientStep
            deal={state.deal}
            parsedData={state.parsedData}
            invoice={state.invoice}
            contract={state.contract}
            creationStatus={state.creationStatus}
            creationError={state.creationError}
            clientId={state.clientId}
            onStatusChange={actions.setCreationStatus}
            onClientCreated={actions.setClientId}
            onClearDraft={actions.clearSavedDraft}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <StepIndicator
        currentStep={state.currentStep}
        completedSteps={state.completedSteps}
        onStepClick={actions.goToStep}
      />

      {/* Main content + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Step content */}
        <div className="lg:col-span-3">
          {renderStep()}
        </div>

        {/* Deal summary sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <DealSummary deal={state.deal} compact={state.currentStep > 0} />
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      {state.creationStatus !== 'complete' && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={actions.prevStep}
            disabled={state.currentStep === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-default"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-3">
            {/* Skip button for optional steps */}
            {(state.currentStep === 1 || state.currentStep === 3) && (
              <button
                type="button"
                onClick={actions.nextStep}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </button>
            )}

            {state.currentStep < 4 && (
              <button
                type="button"
                onClick={() => {
                  actions.markStepComplete(state.currentStep)
                  actions.nextStep()
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
