'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { FormStep } from '@/types/onboarding'

interface ProgressBarProps {
  steps: FormStep[]
  currentStepIndex: number
}

export function ProgressBar({ steps, currentStepIndex }: ProgressBarProps) {
  return (
    <>
      {/* Mobile: compact indicator */}
      <div className="block sm:hidden">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
          <p className="text-sm text-muted-foreground">{steps[currentStepIndex]?.label}</p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: full step indicator */}
      <nav aria-label="Progress" className="hidden sm:block">
        <ol className="flex items-center">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent = index === currentStepIndex
            const isFuture = index > currentStepIndex

            return (
              <li
                key={step.id}
                className={cn('relative flex items-center', index < steps.length - 1 && 'flex-1')}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300',
                      isCompleted && 'bg-blue-600 text-white',
                      isCurrent && 'bg-blue-600 text-white ring-4 ring-blue-100',
                      isFuture && 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {isCompleted ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      'mt-2 whitespace-nowrap text-[11px] leading-tight',
                      isCurrent && 'font-bold text-blue-700',
                      isCompleted && 'font-medium text-blue-600',
                      isFuture && 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'mx-2 mt-[-16px] h-0.5 flex-1 transition-all duration-500',
                      index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                    )}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
