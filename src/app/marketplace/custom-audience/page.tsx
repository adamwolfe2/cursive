'use client'

import { useState } from 'react'
import { PageContainer, PageHeader } from '@/components/layout/page-container'
import { GradientCard } from '@/components/ui/gradient-card'
import { Check, ArrowRight, Loader2 } from 'lucide-react'

const INDUSTRIES = [
  'SaaS / Software',
  'Financial Services',
  'Healthcare',
  'eCommerce',
  'Manufacturing',
  'Real Estate',
  'Education',
  'Professional Services',
  'Other',
]

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+']
const SENIORITY_LEVELS = ['C-Suite', 'VP', 'Director', 'Manager', 'Individual Contributor']
const VOLUME_OPTIONS = ['100', '500', '1,000', '5,000', '10,000+']

export default function CustomAudiencePage() {
  const [formData, setFormData] = useState({
    industry: '',
    geography: '',
    companySize: '',
    seniorityLevels: [] as string[],
    intentSignals: '',
    volume: '',
    additionalNotes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSeniorityToggle = (level: string) => {
    setFormData(prev => ({
      ...prev,
      seniorityLevels: prev.seniorityLevels.includes(level)
        ? prev.seniorityLevels.filter(l => l !== level)
        : [...prev.seniorityLevels, level],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/marketplace/custom-audience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit request')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <PageContainer maxWidth="narrow">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Request Submitted!</h2>
          <p className="text-muted-foreground mb-2">
            We'll review your criteria and deliver a free 25-lead sample within 48 hours.
          </p>
          <p className="text-sm text-muted-foreground">
            Check your email for confirmation and next steps.
          </p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="narrow">
      <PageHeader
        title="Custom Audience Request"
        description="Tell us exactly who you need to reach. We'll deliver a free 25-lead sample within 48 hours."
      />

      <div className="mt-8">
        <GradientCard variant="subtle">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Industry *</label>
              <select
                required
                value={formData.industry}
                onChange={e => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select an industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            {/* Geography */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Geography *</label>
              <input
                required
                type="text"
                placeholder="e.g., US, UK, DACH region"
                value={formData.geography}
                onChange={e => setFormData(prev => ({ ...prev, geography: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Company Size *</label>
              <select
                required
                value={formData.companySize}
                onChange={e => setFormData(prev => ({ ...prev, companySize: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select company size</option>
                {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
              </select>
            </div>

            {/* Seniority */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Seniority Level *</label>
              <div className="flex flex-wrap gap-2">
                {SENIORITY_LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleSeniorityToggle(level)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      formData.seniorityLevels.includes(level)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:border-primary'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Intent Signals */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Intent Signals (optional)</label>
              <textarea
                placeholder="e.g., Actively researching CRM solutions, hiring SDRs, recently funded"
                value={formData.intentSignals}
                onChange={e => setFormData(prev => ({ ...prev, intentSignals: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Volume */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Desired Volume *</label>
              <select
                required
                value={formData.volume}
                onChange={e => setFormData(prev => ({ ...prev, volume: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select volume</option>
                {VOLUME_OPTIONS.map(v => <option key={v} value={v}>{v} leads</option>)}
              </select>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Additional Notes</label>
              <textarea
                placeholder="Any other requirements or specifications..."
                value={formData.additionalNotes}
                onChange={e => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || formData.seniorityLevels.length === 0}
              className="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Request
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </GradientCard>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-primary mb-1">48h</div>
            <div className="text-sm text-muted-foreground">Sample delivery</div>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-primary mb-1">$0.50</div>
            <div className="text-sm text-muted-foreground">Starting per lead</div>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-primary mb-1">25</div>
            <div className="text-sm text-muted-foreground">Free sample leads</div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
