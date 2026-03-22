'use client'

import * as React from 'react'
import type { FormStep } from '@/types/onboarding'

interface ProgressBarProps {
  steps: FormStep[]
  currentStepIndex: number
}

export function ProgressBar({ steps, currentStepIndex }: ProgressBarProps) {
  const progressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100)
  const currentLabel = steps[currentStepIndex]?.label ?? ''

  return (
    <div className="w-full overflow-hidden">
      {/* Mobile: compact indicator */}
      <div className="block sm:hidden">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
          <p className="text-sm text-muted-foreground">{currentLabel}</p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Desktop: slim progress bar with step info */}
      <div className="hidden sm:block">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-sm text-slate-500">
            Step {currentStepIndex + 1} of {steps.length}
            <span className="mx-2 text-slate-300">&mdash;</span>
            <span className="font-semibold text-[#0F172A]">{currentLabel}</span>
          </p>
          <p className="text-sm font-medium text-blue-600">{progressPercent}%</p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
