'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/lib/hooks/use-toast'
import Link from 'next/link'

const SERVICE_TIERS = [
  { value: 'cursive-data', label: 'Cursive Data ($1k-3k/mo)' },
  { value: 'cursive-outbound', label: 'Cursive Outbound ($3-5k/mo)' },
  { value: 'cursive-pipeline', label: 'Cursive Pipeline ($5-10k/mo)' },
]

const BUDGET_OPTIONS = [
  { value: '$1k-3k/mo', label: '$1k - $3k / month' },
  { value: '$3k-5k/mo', label: '$3k - $5k / month' },
  { value: '$5k-10k/mo', label: '$5k - $10k / month' },
  { value: '$10k+/mo', label: '$10k+ / month' },
]

function ServiceRequestPageInner() {
  const searchParams = useSearchParams()
  const toast = useToast()
  const tierParam = searchParams.get('tier') || ''

  const [tier, setTier] = useState(tierParam || 'cursive-outbound')
  const [website, setWebsite] = useState('')
  const [goals, setGoals] = useState('')
  const [budget, setBudget] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Fetch user/workspace data for pre-fill
  const { data: userData } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/users/me')
      if (!response.ok) throw new Error('Failed to fetch user data')
      return response.json()
    },
  })

  const user = userData?.data

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!goals.trim()) {
      toast.error('Please describe your goals')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/services/contact-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier_slug: tier,
          name: user?.full_name || 'Unknown',
          email: user?.email || '',
          company: user?.workspaces?.name || 'Unknown',
          message: `Service Tier: ${tier}\nWebsite: ${website || 'Not provided'}\nMonthly Budget: ${budget || 'Not specified'}\n\nGoals:\n${goals}`,
          phone: phone || undefined,
          website: website || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit request')
      }

      setSubmitted(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-green-900 mb-2">Request Submitted!</h2>
          <p className="text-sm text-green-700 mb-6">
            Thanks! We&apos;ll reach out within 24 hours to discuss your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://cal.com/adamwolfe/cursive-ai-audit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Book a Call Now
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Back to Services
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/services" className="text-sm text-primary hover:text-primary/80 mb-4 inline-flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Services
        </Link>
        <h1 className="text-2xl font-semibold text-foreground mt-2">Request a Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tell us about your goals and we&apos;ll put together a tailored plan.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
        {/* Service Tier */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Service Tier
          </label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="block w-full rounded-lg border-zinc-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            {SERVICE_TIERS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Company (pre-filled) */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Company
          </label>
          <input
            type="text"
            value={user?.workspaces?.name || ''}
            readOnly
            className="block w-full rounded-lg border-zinc-300 bg-zinc-50 shadow-sm text-sm"
          />
        </div>

        {/* Website URL */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Website URL
          </label>
          <input
            type="url"
            placeholder="https://yourcompany.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="block w-full rounded-lg border-zinc-300 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>

        {/* Goals */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            What are your goals? <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="e.g., We want to book 20+ meetings per month with mid-market SaaS companies..."
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            rows={4}
            className="block w-full rounded-lg border-zinc-300 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>

        {/* Monthly Budget */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Monthly Budget
          </label>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="block w-full rounded-lg border-zinc-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="">Select a range</option>
            {BUDGET_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Phone <span className="text-zinc-400">(optional)</span>
          </label>
          <input
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="block w-full rounded-lg border-zinc-300 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || !goals.trim()}
            className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function ServiceRequestPage() {
  return (
    <Suspense fallback={<div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>}>
      <ServiceRequestPageInner />
    </Suspense>
  )
}
