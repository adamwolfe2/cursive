"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "cursive_exit_intent_shown"
const SHOW_DELAY = 1000 // Wait 1 second before enabling exit intent

export function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Check if popup has already been shown this session
    if (typeof window !== "undefined") {
      const hasShown = sessionStorage.getItem(STORAGE_KEY)
      if (hasShown) {
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
        setIsVisible(true)
        sessionStorage.setItem(STORAGE_KEY, "true")
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
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit. Please try again.")
      }

      setSubmitted(true)

      // Track conversion event
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "generate_lead", {
          event_category: "engagement",
          event_label: "exit_intent_popup",
          value: email,
        })
      }

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
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
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
                    We'll send your free visitor audit to{" "}
                    <span className="font-medium text-gray-900">{email}</span>
                  </p>
                </div>
              ) : (
                // Form State
                <>
                  <div className="text-center mb-6">
                    <h2
                      id="exit-intent-title"
                      className="text-2xl md:text-3xl font-light text-gray-900 mb-2"
                    >
                      Wait! Get Your Free Visitor Audit
                    </h2>
                    <p className="text-gray-600">
                      See exactly who's visiting your site right now
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your work email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none transition-all"
                        required
                        disabled={isSubmitting}
                        autoFocus
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

                    <p className="text-xs text-gray-500 text-center">
                      No credit card required. Results in 24 hours.
                    </p>
                  </form>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="space-y-2 text-sm text-gray-600">
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
