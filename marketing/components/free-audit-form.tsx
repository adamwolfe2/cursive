"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle } from "lucide-react"
import { trackLeadCaptured, trackFormSubmission } from "@/lib/analytics"
import Link from "next/link"

const PROVISION_DEMO_URL = "https://leads.meetcursive.com/api/pixel/provision-demo"

export function FreeAuditForm() {
  const [formData, setFormData] = useState({
    websiteUrl: "",
    email: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [pixelProvisioned, setPixelProvisioned] = useState(false)
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

      // Lead capture + pixel provision run in parallel
      const [leadResponse] = await Promise.all([
        fetch("/api/leads/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            company: formData.websiteUrl,
            source: "free_audit_page",
            timestamp: new Date().toISOString(),
          }),
        }),
        // Fire-and-forget pixel provision — sends them the snippet via email
        fetch(PROVISION_DEMO_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            websiteUrl: url,
            prospectEmail: formData.email,
          }),
        }).then(r => {
          if (r.ok) setPixelProvisioned(true)
        }).catch(() => {
          // Non-blocking — don't fail the form if pixel provision fails
        }),
      ])

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
            You&apos;re all set!
          </h3>
          <p className="text-gray-600">
            We&apos;re preparing your visitor audit now — results within 24 hours at{" "}
            <span className="font-medium text-gray-900">{formData.email}</span>
          </p>
        </div>

        {/* Two-step next actions */}
        <div className="space-y-3">
          {/* Step 1: Check email for pixel */}
          {pixelProvisioned ? (
            <div className="flex gap-3 p-4 bg-[#007AFF]/5 border border-[#007AFF]/20 rounded-xl">
              <div className="flex-shrink-0 w-8 h-8 bg-[#007AFF] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <p className="font-semibold text-sm text-gray-900">Check your email — your pixel is ready</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  We&apos;ve sent you a pixel snippet. Install it on your site
                  <strong> before your call</strong> so we have live data to show you.
                  Takes 60 seconds.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <p className="font-semibold text-sm text-gray-900">Check your email</p>
                <p className="text-sm text-gray-600 mt-0.5">Your audit is being prepared — results within 24 hours.</p>
              </div>
            </div>
          )}

          {/* Step 2: Sign up for trial */}
          <div className="flex gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900">Start your 14-day free trial</p>
              <p className="text-sm text-gray-600 mt-0.5 mb-2">
                Sign up at <strong>leads.meetcursive.com</strong> to see your identified leads in
                real time — no credit card required.
              </p>
              <a
                href="https://leads.meetcursive.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Start Free Trial →
              </a>
            </div>
          </div>

          {/* Step 3: Book a call */}
          <div className="flex gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <div>
              <p className="font-semibold text-sm text-gray-900">Book your strategy call (optional)</p>
              <p className="text-sm text-gray-600 mt-0.5">
                We&apos;ll review your visitor data together and show you exactly which visitors to target first.{" "}
                <a href="https://cal.com/gotdarrenhill/30min" target="_blank" rel="noopener noreferrer" className="text-[#007AFF] hover:underline">
                  Book 30 minutes →
                </a>
              </p>
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
      toolname="requestFreeAudit"
      tooldescription="Request a free audit of your last 100 website visitors. Includes visitor identification, intent scores, and personalized outreach templates. Results delivered within 24 hours."
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
          toolparamdescription="The website URL to analyze for visitor identification"
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
          toolparamdescription="Work email address to receive the audit report"
        />
      </div>

      {error && (
        <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm">
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
