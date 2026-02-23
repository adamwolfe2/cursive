'use client'

import { Suspense, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/lib/hooks/use-toast'
import Link from 'next/link'
import { BookDemoButton } from '@/components/ui/cal-inline-booking'

const SERVICE_OPTIONS = [
  { value: 'cursive-data', label: 'Cursive Data ($1k-3k/mo)' },
  { value: 'cursive-outbound', label: 'Cursive Outbound ($3-5k/mo)' },
  { value: 'cursive-pipeline', label: 'Cursive Pipeline ($5-10k/mo)' },
  { value: 'cursive-venture', label: 'Cursive Venture Studio (custom)' },
  { value: 'general', label: 'General inquiry' },
]

function ContactSalesPageInner() {
  const toast = useToast()

  const [tierSlug, setTierSlug] = useState('cursive-venture')
  const [website, setWebsite] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Pre-fill from user profile
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

    if (!message.trim()) {
      toast.error('Please describe what you need')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/services/contact-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier_slug: tierSlug,
          name: user?.full_name || 'Unknown',
          email: user?.email || '',
          company: user?.email?.split('@')[1]?.replace(/\.[^.]+$/, '') || '',
          message,
          phone: phone || undefined,
          website: website || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to submit inquiry')
      }

      setSubmitted(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit inquiry')
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
          <h2 className="text-xl font-semibold text-green-900 mb-2">Message Sent!</h2>
          <p className="text-sm text-green-700 mb-6">
            Thanks! Our team will reach out within 24 hours to discuss your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <BookDemoButton
              label="Book a Call Now"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            />
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
        <h1 className="text-2xl font-semibold text-foreground mt-2">Contact Sales</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tell us what you&apos;re looking for and we&apos;ll put together a custom plan.
        </p>
      </div>

      {/* What to expect */}
      <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-foreground mb-2">What happens next:</p>
        <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
          <li>Our team reviews your inquiry (usually within a few hours)</li>
          <li>We schedule a 30-minute discovery call</li>
          <li>You receive a tailored proposal within 48 hours</li>
        </ol>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
        {/* Contact info (pre-filled, read-only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Name</label>
            <input
              type="text"
              value={user?.full_name || ''}
              readOnly
              className="block w-full rounded-lg border-zinc-300 bg-zinc-50 shadow-sm text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              className="block w-full rounded-lg border-zinc-300 bg-zinc-50 shadow-sm text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Company</label>
          <input
            type="text"
            value={user?.email?.split('@')[1]?.replace(/\.[^.]+$/, '') || ''}
            readOnly
            className="block w-full rounded-lg border-zinc-300 bg-zinc-50 shadow-sm text-sm"
          />
        </div>

        {/* Service interest */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            I&apos;m interested in
          </label>
          <select
            value={tierSlug}
            onChange={(e) => setTierSlug(e.target.value)}
            className="block w-full rounded-lg border-zinc-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            {SERVICE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Website URL <span className="text-zinc-400">(optional)</span>
          </label>
          <input
            type="url"
            placeholder="https://yourcompany.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="block w-full rounded-lg border-zinc-300 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            What can we help you with? <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="Tell us about your goals, timeline, budget, and any specific requirements..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            required
            className="block w-full rounded-lg border-zinc-300 shadow-sm focus:border-primary focus:ring-primary"
          />
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
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="flex-1 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? 'Sending...' : 'Send Message'}
          </button>
          <BookDemoButton
            label="Or Book a Call"
            className="flex-1 inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          />
        </div>
      </form>

      {/* Direct email fallback */}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Prefer email?{' '}
        <a href="mailto:hello@meetcursive.com" className="text-primary hover:underline">
          hello@meetcursive.com
        </a>
      </p>
    </div>
  )
}

export default function ContactSalesPage() {
  return (
    <Suspense fallback={<div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>}>
      <ContactSalesPageInner />
    </Suspense>
  )
}
