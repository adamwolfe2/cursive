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
  const showLabels = steps.length <= 7

  return (
    <div className="w-full overflow-hidden">
      {/* Mobile: simple bar with step info */}
      <div className="block sm:hidden">
        <p className="text-sm font-medium text-foreground">
          Step {currentStepIndex + 1} of {steps.length}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{currentLabel}</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Desktop: numbered circles with connecting lines */}
      <div className="hidden sm:block">
        <div className="flex items-center">
          {steps.map((step, i) => {
            const isCompleted = i < currentStepIndex
            const isCurrent = i === currentStepIndex
            const isFuture = i > currentStepIndex

            return (
              <React.Fragment key={step.id}>
                {/* Circle + label column */}
                <div className="flex flex-col items-center">
                  <div
                    className={[
                      'flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-semibold transition-all',
                      isCompleted && 'border-blue-600 bg-blue-600 text-white',
                      isCurrent && 'border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100',
                      isFuture && 'border-blue-200 bg-white text-blue-400',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {isCompleted ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  {/* Label below circle — only for completed/current, hidden on <lg when >7 steps */}
                  {(isCompleted || isCurrent) && showLabels && (
                    <span
                      className={[
                        'mt-1.5 max-w-[72px] truncate text-center text-[10px] leading-tight',
                        isCurrent ? 'font-semibold text-blue-700' : 'text-slate-500',
                        steps.length > 7 ? 'hidden lg:block' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {step.label}
                    </span>
                  )}
                </div>

                {/* Connecting line */}
                {i < steps.length - 1 && (
                  <div
                    className={[
                      'mx-1 h-px flex-1 transition-colors',
                      i < currentStepIndex ? 'bg-blue-500' : 'bg-blue-200',
                    ].join(' ')}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
