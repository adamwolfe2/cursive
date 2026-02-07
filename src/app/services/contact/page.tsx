'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Send, Loader2, CheckCircle } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'

export default function ContactSalesPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    website: '',
    tier_slug: 'cursive-outbound',
    message: ''
  })
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/services/contact-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit inquiry')
      }

      setSubmitted(true)
      toast.success('Inquiry submitted successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit inquiry')
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white flex items-center justify-center py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 bg-green-100 rounded-full mb-8">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <h1 className="text-4xl font-bold text-zinc-900 mb-4">
            Thank You!
          </h1>
          <p className="text-xl text-zinc-600 mb-8">
            We've received your inquiry and our team will contact you within 24 hours.
          </p>

          <div className="bg-white rounded-xl border border-zinc-200 p-8 mb-8 text-left">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">
              What to Expect
            </h2>
            <ul className="space-y-3 text-zinc-600">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>A sales representative will reach out within 24 hours</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>We'll discuss your specific needs and goals</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Get a custom quote tailored to your business</span>
              </li>
            </ul>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <Link
            href="/services"
            className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 mb-6"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to services
          </Link>

          <h1 className="text-4xl font-bold text-zinc-900 mb-4">
            Let's Talk About Your Growth
          </h1>
          <p className="text-xl text-zinc-600">
            Tell us about your business and we'll create a custom solution for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-200 p-8">
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-2">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your full name"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-2">
                Work Email *
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@company.com"
                disabled={loading}
              />
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-zinc-700 mb-2">
                Company Name *
              </label>
              <input
                id="company"
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Acme Inc"
                disabled={loading}
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+1 (555) 123-4567"
                disabled={loading}
              />
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-zinc-700 mb-2">
                Company Website
              </label>
              <input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://company.com"
                disabled={loading}
              />
            </div>

            {/* Service Tier */}
            <div>
              <label htmlFor="tier" className="block text-sm font-medium text-zinc-700 mb-2">
                Service Tier of Interest *
              </label>
              <select
                id="tier"
                required
                value={formData.tier_slug}
                onChange={(e) => setFormData({ ...formData, tier_slug: e.target.value })}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
              >
                <option value="cursive-data">Cursive Data</option>
                <option value="cursive-outbound">Cursive Outbound</option>
                <option value="cursive-pipeline">Cursive Pipeline</option>
                <option value="cursive-studio">Cursive Studio</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-zinc-700 mb-2">
                Tell us about your needs *
              </label>
              <textarea
                id="message"
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Tell us about your business, target audience, and what you're looking to achieve..."
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Inquiry
                </>
              )}
            </button>

            <p className="text-xs text-zinc-500 text-center">
              By submitting this form, you agree to be contacted by our sales team.
              We'll never share your information with third parties.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
