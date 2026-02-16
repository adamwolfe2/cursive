'use client'

/**
 * Exit Intent Popup - Variant B
 * Alternative copy/design for A/B testing
 *
 * CHANGES FROM VARIANT A:
 * - Different headline (more urgency-focused)
 * - Different subheadline (specific number)
 * - Different CTA text
 * - Added social proof element
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useExitIntent } from '@/hooks/use-exit-intent'
import { usePopupAnalytics } from '@/hooks/use-popup-analytics'
import {
  shouldShowPopup,
  markPopupShown,
  markPopupDismissed,
} from '@/lib/popup-storage'

const POPUP_ID = 'exit-intent-visitor-report-variant-b'

interface ExitIntentPopupVariantBProps {
  enabled?: boolean
  onSubmit?: (data: { email: string; company?: string }) => Promise<void>
}

export function ExitIntentPopupVariantB({
  enabled = true,
  onSubmit,
}: ExitIntentPopupVariantBProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const emailInputRef = useRef<HTMLInputElement>(null)

  const analytics = usePopupAnalytics({
    popupId: POPUP_ID,
    variant: 'exit-intent-variant-b',
  })

  useExitIntent({
    enabled: enabled && !isOpen,
    threshold: 20,
    delay: 5000,
    onExitIntent: () => {
      if (shouldShowPopup(POPUP_ID, 7, 1)) {
        setIsOpen(true)
        markPopupShown(POPUP_ID)
        analytics.trackImpression()
      }
    },
  })

  useEffect(() => {
    if (isOpen && emailInputRef.current) {
      emailInputRef.current.focus()
    }
  }, [isOpen])

  const handleClose = useCallback((method: 'close-button' | 'outside-click' | 'escape-key') => {
    setIsOpen(false)
    markPopupDismissed(POPUP_ID)
    analytics.trackDismiss(method)
  }, [analytics])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose('escape-key')
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)

    try {
      analytics.trackSubmission({ email, company })

      if (onSubmit) {
        await onSubmit({ email, company })
      }

      setIsSuccess(true)
      setTimeout(() => setIsOpen(false), 2000)
    } catch (error) {
      console.error('Error submitting popup form:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!enabled) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => handleClose('outside-click')}
            aria-hidden="true"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full pointer-events-auto relative overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="popup-title"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleClose('close-button')}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 z-10"
                aria-label="Close popup"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="p-8 sm:p-10">
                {!isSuccess ? (
                  <>
                    {/* Social Proof Badge - VARIANT B DIFFERENCE */}
                    <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                      <TrendingUp className="h-4 w-4" />
                      <span>Join 2,400+ companies using Cursive</span>
                    </div>

                    {/* Headline - VARIANT B DIFFERENCE */}
                    <h2
                      id="popup-title"
                      className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 pr-8"
                    >
                      Don't Leave Without Your Free Visitor Report
                    </h2>

                    {/* Subheadline - VARIANT B DIFFERENCE */}
                    <p className="text-lg text-gray-600 mb-8">
                      Discover exactly which companies are checking out your site right now.
                      Get a personalized report with 20+ company names in the next 5 minutes.
                    </p>

                    <form
                      onSubmit={handleSubmit}
                      className="space-y-4"
                      toolname="requestVisitorReportB"
                      tooldescription="Request a free personalized report with 20+ company names currently visiting your website. Delivered in 5 minutes."
                    >
                      <div>
                        <label htmlFor="popup-email-b" className="sr-only">
                          Work Email
                        </label>
                        <input
                          ref={emailInputRef}
                          id="popup-email-b"
                          name="email"
                          type="email"
                          required
                          placeholder="Enter your work email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => analytics.trackInteraction()}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none transition-all text-base"
                          toolparamdescription="Work email to receive the free visitor report"
                        />
                      </div>

                      <div>
                        <label htmlFor="popup-company-b" className="sr-only">
                          Company Name (Optional)
                        </label>
                        <input
                          id="popup-company-b"
                          name="company"
                          type="text"
                          placeholder="Company name (optional)"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none transition-all text-base"
                        />
                      </div>

                      {/* CTA Button - VARIANT B DIFFERENCE */}
                      <Button
                        type="submit"
                        disabled={isSubmitting || !email}
                        className="w-full"
                        size="lg"
                      >
                        {isSubmitting ? 'Sending...' : 'Send Me My Free Report Now'}
                      </Button>

                      <p className="text-xs text-gray-500 text-center">
                        We respect your privacy. Read our{' '}
                        <a
                          href="/privacy"
                          className="text-[#007AFF] hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Privacy Policy
                        </a>
                        .
                      </p>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
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
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Your Report is On The Way!
                    </h3>
                    <p className="text-gray-600">Check {email} in the next 5 minutes.</p>
                  </div>
                )}
              </div>

              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full opacity-50 blur-3xl pointer-events-none" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
