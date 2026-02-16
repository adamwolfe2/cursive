"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trackLeadCaptured, trackFormSubmission } from "@/lib/analytics"

const STORAGE_KEY = "cursive_exit_intent_count"
const MAX_SHOWS_PER_SESSION = 2
const SHOW_DELAY = 1000 // Wait 1 second before enabling exit intent

export function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [selectedAudit, setSelectedAudit] = useState<'ai' | 'visitor' | null>(null)
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Check if popup has reached max shows this session
    if (typeof window !== "undefined") {
      const showCount = parseInt(sessionStorage.getItem(STORAGE_KEY) || "0", 10)
      if (showCount >= MAX_SHOWS_PER_SESSION) {
        return
      }
    }

    // Enable exit intent after delay
    const timer = setTimeout(() => {
      setIsEnabled(true)
    }, SHOW_DELAY)

    return () => clearTimeout(timer)
  }, [])

  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      // Only trigger if cursor is leaving from the top
      if (e.clientY <= 0 && isEnabled && !isVisible) {
        const currentCount = parseInt(sessionStorage.getItem(STORAGE_KEY) || "0", 10)
        if (currentCount >= MAX_SHOWS_PER_SESSION) return
        setIsVisible(true)
        sessionStorage.setItem(STORAGE_KEY, String(currentCount + 1))
        // Disable until popup is closed to prevent re-triggers
        setIsEnabled(false)
      }
    },
    [isEnabled, isVisible]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        setIsVisible(false)
      }
    },
    [isVisible]
  )

  useEffect(() => {
    if (isEnabled) {
      document.addEventListener("mouseleave", handleMouseLeave)
      document.addEventListener("keydown", handleKeyDown)

      return () => {
        document.removeEventListener("mouseleave", handleMouseLeave)
        document.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [isEnabled, handleMouseLeave, handleKeyDown])

  const handleClose = () => {
    setIsVisible(false)
    // Re-enable exit intent if under the limit
    const currentCount = parseInt(sessionStorage.getItem(STORAGE_KEY) || "0", 10)
    if (currentCount < MAX_SHOWS_PER_SESSION) {
      setTimeout(() => setIsEnabled(true), SHOW_DELAY)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error("Please enter a valid email address")
      }

      const response = await fetch("/api/leads/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          source: "exit_intent_popup",
          auditType: selectedAudit,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit. Please try again.")
      }

      setSubmitted(true)

      // Track conversion event using new analytics library
      trackLeadCaptured(`exit_intent_popup_${selectedAudit}`)
      trackFormSubmission(`exit_intent_popup_${selectedAudit}`)

      // Close popup after 3 seconds
      setTimeout(() => {
        setIsVisible(false)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-intent-title"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close popup"
              >
                <X className="w-5 h-5" />
              </button>

              {submitted ? (
                // Success State
                <div className="text-center py-4">
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
                    Thank You!
                  </h3>
                  <p className="text-gray-600">
                    We'll send your free {selectedAudit === 'ai' ? 'AI audit' : 'visitor audit'} to{" "}
                    <span className="font-medium text-gray-900">{email}</span>
                  </p>
                </div>
              ) : selectedAudit === null ? (
                // Quiz State - Choose Audit Type
                <>
                  <div className="text-center mb-6">
                    <h2
                      id="exit-intent-title"
                      className="text-2xl md:text-3xl font-light text-gray-900 mb-2"
                    >
                      Wait! Get Your Free Audit
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Which audit would help your business most?
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => setSelectedAudit('ai')}
                      className="w-full bg-white border-2 border-gray-200 hover:border-[#007AFF] rounded-xl p-6 text-left transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                          <svg
                            className="w-6 h-6 text-[#007AFF]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            AI Audit of Your Company
                          </h3>
                          <p className="text-sm text-gray-600">
                            Get personalized insights and recommendations powered by AI to optimize your marketing and sales strategy
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedAudit('visitor')}
                      className="w-full bg-white border-2 border-gray-200 hover:border-[#007AFF] rounded-xl p-6 text-left transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                          <svg
                            className="w-6 h-6 text-[#007AFF]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            Website Visitor Audit
                          </h3>
                          <p className="text-sm text-gray-600">
                            See exactly who's visiting your site right now with full contact details and intent scores
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 text-center mt-6">
                    No credit card required. Results in 24 hours.
                  </p>
                </>
              ) : (
                // Form State - After Quiz Selection
                <>
                  <div className="text-center mb-6">
                    <h2
                      id="exit-intent-title"
                      className="text-2xl md:text-3xl font-light text-gray-900 mb-2"
                    >
                      {selectedAudit === 'ai'
                        ? 'Get Your Free AI Audit'
                        : 'Get Your Free Visitor Audit'}
                    </h2>
                    <p className="text-gray-600">
                      {selectedAudit === 'ai'
                        ? 'Enter your email to receive personalized AI-powered insights'
                        : 'Enter your email to see who\'s visiting your site'}
                    </p>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    toolname="requestFreeAuditPopup"
                    tooldescription="Request a free AI or visitor audit from Cursive. Enter your email to receive personalized insights or a report of your last 100 website visitors."
                  >
                    <div>
                      <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your work email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none transition-all"
                        required
                        disabled={isSubmitting}
                        autoFocus
                        toolparamdescription="Work email to receive the free audit report"
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
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Get My Free Audit"
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setSelectedAudit(null)}
                      className="text-sm text-gray-500 hover:text-gray-700 w-full text-center"
                    >
                      ← Back to options
                    </button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="space-y-2 text-sm text-gray-600">
                      {selectedAudit === 'visitor' ? (
                        <>
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-[#007AFF] flex-shrink-0"
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
                            <span>Last 100 identified visitors with contact info</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-[#007AFF] flex-shrink-0"
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
                            <span>Intent scores showing who's ready to buy</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-[#007AFF] flex-shrink-0"
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
                            <span>Personalized outreach templates</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-[#007AFF] flex-shrink-0"
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
                            <span>AI-powered marketing strategy recommendations</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-[#007AFF] flex-shrink-0"
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
                            <span>Competitive analysis and positioning insights</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-[#007AFF] flex-shrink-0"
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
                            <span>Growth opportunities and optimization tactics</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
