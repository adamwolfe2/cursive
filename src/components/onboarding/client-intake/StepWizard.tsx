'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ProgressBar } from './ProgressBar'
import type { FormStep } from '@/types/onboarding'

interface StepWizardProps {
  children: React.ReactNode
  activeSteps: FormStep[]
  currentStep: number
  onNext: () => Promise<boolean>
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function StepWizard({
  children,
  activeSteps,
  currentStep,
  onNext,
  onBack,
  onSubmit,
  isSubmitting,
}: StepWizardProps) {
  const [direction, setDirection] = React.useState(1)
  const isFirst = currentStep === 0
  const isLast = currentStep === activeSteps.length - 1

  const handleNext = async () => {
    setDirection(1)
    await onNext()
  }

  const handleBack = () => {
    setDirection(-1)
    onBack()
  }

  // Cmd/Ctrl+Enter advances to the next step (or submits on the last step).
  // Plain Enter in text inputs must NOT submit mid-wizard — the parent form
  // already preventDefaults, and we intentionally don't listen for bare Enter.
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (isSubmitting) return
        if (isLast) {
          onSubmit()
        } else {
          void handleNext()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLast, isSubmitting])

  const variants = {
    enter: (d: number) => ({
      x: d > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (d: number) => ({
      x: d > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.98,
    }),
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Progress */}
      <ProgressBar steps={activeSteps} currentStepIndex={currentStep} />

      {/* Step content */}
      <div className="relative min-h-[300px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeSteps[currentStep]?.id ?? currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ willChange: 'transform' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-blue-100 pt-6">
        <div>
          {!isFirst && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="mr-2 h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Back
            </Button>
          )}
        </div>
        <div>
          {isLast ? (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            >
              Submit Onboarding Form
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="ml-2 h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
