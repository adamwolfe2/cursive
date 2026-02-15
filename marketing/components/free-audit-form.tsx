"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
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

      // Attempt to validate URL
      try {
        new URL(url)
      } catch {
        throw new Error("Please enter a valid website URL")
      }

      const response = await fetch("/api/leads/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          company: formData.websiteUrl,
          source: "free_audit_page",
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
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
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-medium text-gray-900 mb-2">
          Success! Check Your Email
        </h3>
        <p className="text-gray-600 mb-6">
          We're analyzing your website visitors now. You'll receive your complete audit report within 24 hours at{" "}
          <span className="font-medium text-gray-900">{formData.email}</span>
        </p>
        <p className="text-sm text-gray-500">
          Keep an eye out for an email from us with next steps and your free strategy call link.
        </p>
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
