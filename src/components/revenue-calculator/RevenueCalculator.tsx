'use client'
import { useState } from 'react'
import { CalculatorForm } from './CalculatorForm'
import { LoadingState } from './LoadingState'
import { ResultsDashboard } from './ResultsDashboard'
import { calculateScenarios } from '@/lib/superpixel-constants'
import { safeError } from '@/lib/utils/log-sanitizer'

type Step = 'form' | 'loading' | 'results'

interface FormData {
  domain: string
  monthlyVisitors: number
  dealSize: number
  industry: string
}

export function RevenueCalculator() {
  const [step, setStep] = useState<Step>('form')
  const [formData, setFormData] = useState<FormData | null>(null)
  const [results, setResults] = useState<ReturnType<typeof calculateScenarios> | null>(null)
  const [siteData, setSiteData] = useState<{ title?: string; image?: string; favicon?: string } | null>(null)

  const handleFormSubmit = async (data: FormData) => {
    setFormData(data)
    setStep('loading')

    const [calcResults] = await Promise.all([
      Promise.resolve(calculateScenarios(data.monthlyVisitors, data.dealSize, data.industry)),
      fetch(`/api/analyze-site?domain=${encodeURIComponent(data.domain)}`)
        .then(r => r.json())
        .then(d => setSiteData(d.error ? null : d))
        .catch((err) => { safeError('[RevenueCalculator] Site analysis fetch failed:', err) }),
    ])

    // Minimum loading time of 2s for UX
    await new Promise(r => setTimeout(r, 2000))
    setResults(calcResults)
    setStep('results')
  }

  const handleReset = () => {
    setStep('form')
    setFormData(null)
    setResults(null)
    setSiteData(null)
  }

  return (
    <div className="w-full">
      {step === 'form' && <CalculatorForm onSubmit={handleFormSubmit} />}
      {step === 'loading' && formData && <LoadingState domain={formData.domain} />}
      {step === 'results' && results && formData && (
        <ResultsDashboard
          results={results}
          domain={formData.domain}
          monthlyVisitors={formData.monthlyVisitors}
          dealSize={formData.dealSize}
          industry={formData.industry}
          siteData={siteData}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
