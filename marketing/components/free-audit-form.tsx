"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, Calendar } from "lucide-react"
import { trackLeadCaptured, trackFormSubmission } from "@/lib/analytics"


export function FreeAuditForm() {
  const [formData, setFormData] = useState({
    websiteUrl: "",
    email: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      // Validate website URL
      if (!formData.websiteUrl.trim()) {
        throw new Error("Please enter your website URL")
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid work email")
      }

      // Basic URL validation
      let url = formData.websiteUrl.trim()
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url
      }
      try {
        new URL(url)
      } catch {
        throw new Error("Please enter a valid website URL")
      }

      const leadResponse = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          website_url: formData.websiteUrl,
          source: "free_audit_page",
          timestamp: new Date().toISOString(),
        }),
      })

      if (!leadResponse.ok) {
        const data = await leadResponse.json()
        throw new Error(data.error || "Failed to submit. Please try again.")
      }

      setSubmitted(true)

      // Track conversion event using new analytics library
      trackLeadCaptured("free_audit_form")
      trackFormSubmission("free_audit_form")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="py-6">
        {/* Main success header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            Your audit is on its way!
          </h3>
          <p className="text-gray-600">
            Results within 24 hours at{" "}
            <span className="font-medium text-gray-900">{formData.email}</span>
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {/* Step 1: Audit incoming */}
          <div className="flex gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <div>
              <p className="font-semibold text-sm text-gray-900">Check your email in 24 hours</p>
              <p className="text-sm text-gray-600 mt-0.5">
                We&apos;re identifying your last 100 visitors — names, emails, companies, intent scores.
              </p>
            </div>
          </div>

          {/* Step 2: Book the call — primary CTA */}
          <div className="flex gap-3 p-4 bg-[#007AFF]/5 border-2 border-[#007AFF]/40 rounded-xl">
            <div className="flex-shrink-0 w-8 h-8 bg-[#007AFF] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900">Book a call — we&apos;ll walk through your results live</p>
              <p className="text-sm text-gray-600 mt-0.5 mb-3">
                On the call, Darren will review your audit <em>and</em> set up your
                SuperPixel live so you see your first identified visitors{" "}
                <strong>within 5 minutes.</strong> Free 14-day trial — no credit card.
              </p>
              <a
                href="https://cal.com/gotdarrenhill/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#007AFF] hover:bg-[#0066DD] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Book 30 Minutes with Darren →
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div>
        <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-2">
          Website URL
        </label>
        <input
          id="websiteUrl"
          name="websiteUrl"
          type="text"
          value={formData.websiteUrl}
          onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
          placeholder="yourcompany.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none transition-all"
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Work Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="you@company.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none transition-all"
          required
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="w-full text-lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          "Get My Free Audit"
        )}
      </Button>
    </form>
  )
}
