'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'

interface OnboardingFormProps {
  subscriptionId: string
  tierName: string
  initialData?: Record<string, any>
}

const INDUSTRIES = [
  'SaaS',
  'E-commerce',
  'Fintech',
  'Healthcare',
  'Real Estate',
  'Marketing Agency',
  'Consulting',
  'Manufacturing',
  'Education',
  'Other'
]

const COMPANY_SIZES = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees'
]

const REVENUE_RANGES = [
  'Pre-revenue',
  '$0-$1M',
  '$1M-$5M',
  '$5M-$10M',
  '$10M-$50M',
  '$50M+'
]

const SENIORITY_LEVELS = [
  'C-Level (CEO, CTO, CFO)',
  'VP / SVP',
  'Director',
  'Manager',
  'Individual Contributor'
]

const REGIONS = [
  'United States',
  'Canada',
  'United Kingdom',
  'Europe',
  'Asia Pacific',
  'Latin America',
  'Global'
]

export function OnboardingForm({ subscriptionId, tierName, initialData = {} }: OnboardingFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    // Step 1: Industry & Company Size
    industries: (initialData.industries as string[]) || [],
    companySize: (initialData.company_size as string) || '',
    revenueRange: (initialData.revenue_range as string) || '',

    // Step 2: Target Personas
    targetTitles: (initialData.target_titles as string) || '',
    targetSeniority: (initialData.target_seniority as string[]) || [],

    // Step 3: Geographic & Tech
    geographicFocus: (initialData.geographic_focus as string[]) || [],
    techStack: (initialData.tech_stack as string) || '',

    // Step 4: Goals & Use Case
    painPoints: (initialData.pain_points as string) || '',
    useCase: (initialData.use_case as string) || '',
    idealLeadProfile: (initialData.ideal_lead_profile as string) || '',
    exclusions: (initialData.exclusions as string) || '',
    additionalNotes: (initialData.additional_notes as string) || '',
  })

  const totalSteps = 4

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleArrayItem = (field: string, item: string) => {
    const current = formData[field as keyof typeof formData] as string[]
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item]
    updateField(field, updated)
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.industries.length > 0 && formData.companySize && formData.revenueRange
      case 2:
        return formData.targetTitles.trim() && formData.targetSeniority.length > 0
      case 3:
        return formData.geographicFocus.length > 0
      case 4:
        return formData.useCase.trim() && formData.idealLeadProfile.trim()
      default:
        return false
    }
  }

  const handleNext = () => {
    if (canProceed()) {
      setStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!canProceed()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/services/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: subscriptionId,
          onboarding_data: {
            industries: formData.industries,
            company_size: formData.companySize,
            revenue_range: formData.revenueRange,
            target_titles: formData.targetTitles,
            target_seniority: formData.targetSeniority,
            geographic_focus: formData.geographicFocus,
            tech_stack: formData.techStack,
            pain_points: formData.painPoints,
            use_case: formData.useCase,
            ideal_lead_profile: formData.idealLeadProfile,
            exclusions: formData.exclusions,
            additional_notes: formData.additionalNotes,
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save onboarding')
      }

      // Redirect to dashboard with success message
      router.push('/dashboard?onboarding=complete')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-900">
            Step {step} of {totalSteps}
          </span>
          <span className="text-sm text-zinc-500">
            {Math.round((step / totalSteps) * 100)}% complete
          </span>
        </div>
        <div className="w-full bg-zinc-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              Tell me about your target companies
            </h2>
            <p className="text-zinc-600 mb-6">
              What industries and company sizes are you targeting?
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-3">
                  Industries (select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {INDUSTRIES.map(industry => (
                    <button
                      key={industry}
                      type="button"
                      onClick={() => toggleArrayItem('industries', industry)}
                      className={`px-4 py-3 rounded-lg border text-left transition-colors ${
                        formData.industries.includes(industry)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-zinc-200 hover:border-zinc-300 text-zinc-700'
                      }`}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-3">
                  Company size
                </label>
                <select
                  value={formData.companySize}
                  onChange={e => updateField('companySize', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select company size</option>
                  {COMPANY_SIZES.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-3">
                  Revenue range
                </label>
                <select
                  value={formData.revenueRange}
                  onChange={e => updateField('revenueRange', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select revenue range</option>
                  {REVENUE_RANGES.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              Who are you trying to reach?
            </h2>
            <p className="text-zinc-600 mb-6">
              What titles and seniority levels should I target?
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-3">
                  Target titles or roles (one per line)
                </label>
                <textarea
                  value={formData.targetTitles}
                  onChange={e => updateField('targetTitles', e.target.value)}
                  placeholder="CEO&#10;VP of Sales&#10;Head of Growth&#10;Director of Marketing"
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:border-primary focus:ring-1 focus:ring-primary font-mono text-sm"
                />
                <p className="text-sm text-zinc-500 mt-2">
                  Example: CEO, VP Sales, Head of Growth, etc.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-3">
                  Seniority levels (select all that apply)
                </label>
                <div className="space-y-2">
                  {SENIORITY_LEVELS.map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleArrayItem('targetSeniority', level)}
                      className={`w-full px-4 py-3 rounded-lg border text-left transition-colors ${
                        formData.targetSeniority.includes(level)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-zinc-200 hover:border-zinc-300 text-zinc-700'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              Geography & tech stack
            </h2>
            <p className="text-zinc-600 mb-6">
              Where are your target companies located? Any tech requirements?
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-3">
                  Geographic focus (select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {REGIONS.map(region => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleArrayItem('geographicFocus', region)}
                      className={`px-4 py-3 rounded-lg border text-left transition-colors ${
                        formData.geographicFocus.includes(region)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-zinc-200 hover:border-zinc-300 text-zinc-700'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-3">
                  Tech stack or tools (optional)
                </label>
                <textarea
                  value={formData.techStack}
                  onChange={e => updateField('techStack', e.target.value)}
                  placeholder="Salesforce, HubSpot, Stripe, etc."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <p className="text-sm text-zinc-500 mt-2">
                  Target companies using specific platforms or tools
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              Use case & ideal profile
            </h2>
            <p className="text-zinc-600 mb-6">
              Help me understand what you're building and who converts best.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-3">
                  What are you using these leads for?
                </label>
                <textarea
                  value={formData.useCase}
                  onChange={e => updateField('useCase', e.target.value)}
                  placeholder="Cold outbound email campaigns, LinkedIn outreach, sales prospecting, etc."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-3">
                  Describe your ideal lead in detail
                </label>
                <textarea
                  value={formData.idealLeadProfile}
                  onChange={e => updateField('idealLeadProfile', e.target.value)}
                  placeholder="B2B SaaS companies, $1M+ ARR, Series A funded, using Salesforce, based in US, 20-100 employees, actively hiring sales reps..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-3">
                  Any exclusions? (optional)
                </label>
                <textarea
                  value={formData.exclusions}
                  onChange={e => updateField('exclusions', e.target.value)}
                  placeholder="No agencies, no consultants, no non-profits, etc."
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-3">
                  Anything else I should know? (optional)
                </label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={e => updateField('additionalNotes', e.target.value)}
                  placeholder="Companies that raised funding in last 12 months, specific pain points, job postings to look for, etc."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-200">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className="inline-flex items-center gap-2 px-4 py-2 text-zinc-700 hover:text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        {step < totalSteps ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Complete Onboarding
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
