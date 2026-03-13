'use client'
import { useEffect, useState } from 'react'

interface Props { domain: string }

const STEPS = [
  'Fetching traffic data for {domain}...',
  'Calculating visitor identification rates...',
  'Modeling revenue scenarios...',
  'Generating your personalized report...',
]

export function LoadingState({ domain }: Props) {
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => Math.min(s + 1, STEPS.length - 1))
      setProgress(p => Math.min(p + 25, 95))
    }, 600)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-gray-900 font-semibold text-lg">
          {STEPS[step].replace('{domain}', domain)}
        </p>
        <p className="text-gray-500 text-sm">This takes just a moment...</p>
      </div>
      <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
