'use client'

import { Check } from 'lucide-react'
import { WIZARD_STEPS } from '@/types/onboarding-wizard'

interface StepIndicatorProps {
  currentStep: number
  completedSteps: number[]
  onStepClick: (step: number) => void
}

export default function StepIndicator({ currentStep, completedSteps, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2 -mx-1 px-1">
      {WIZARD_STEPS.map((step, index) => {
        const isComplete = completedSteps.includes(index)
        const isCurrent = currentStep === index
        const isClickable = isComplete || index <= currentStep

        return (
          <div key={step.id} className="flex items-center">
            <button
              type="button"
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                isCurrent
                  ? 'bg-blue-600 text-white'
                  : isComplete
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-400 cursor-default'
              }`}
            >
              {isComplete ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="w-4 text-center">{index + 1}</span>
              )}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{step.shortLabel}</span>
            </button>
            {index < WIZARD_STEPS.length - 1 && (
              <div className={`w-4 h-px mx-1 ${isComplete ? 'bg-blue-300' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
