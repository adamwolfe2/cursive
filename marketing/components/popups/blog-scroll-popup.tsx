'use client'

/**
 * Blog Scroll Popup
 * Shows at 50% scroll depth on blog posts
 * Offers: Newsletter subscription
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useScrollDepth } from '@/hooks/use-scroll-depth'
import { usePopupAnalytics } from '@/hooks/use-popup-analytics'
import {
  shouldShowPopup,
  markPopupShown,
  markPopupDismissed,
} from '@/lib/popup-storage'

const POPUP_ID = 'blog-scroll-newsletter'

interface BlogScrollPopupProps {
  enabled?: boolean
  scrollThreshold?: number
  onSubmit?: (data: { email: string }) => Promise<void>
}

export function BlogScrollPopup({
  enabled = true,
  scrollThreshold = 50,
  onSubmit,
}: BlogScrollPopupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)

  const analytics = usePopupAnalytics({
    popupId: POPUP_ID,
    variant: 'scroll-based',
  })

  // Scroll depth detection
  useScrollDepth({
    enabled: enabled && !isOpen,
    threshold: scrollThreshold,
    onThresholdReached: () => {
      // Check if popup should be shown based on frequency rules
      if (shouldShowPopup(POPUP_ID, 30, 1)) {
        // 30 day cooldown for newsletter
        setIsOpen(true)
        markPopupShown(POPUP_ID)
        analytics.trackImpression()
      }
    },
  })

  // Callback handlers (declared before effects that use them)
  const handleClose = useCallback((method: 'close-button' | 'escape-key') => {
    setIsOpen(false)
    markPopupDismissed(POPUP_ID)
    analytics.trackDismiss(method)
  }, [analytics])

  const handleMinimize = useCallback(() => {
    setIsMinimized(true)
    analytics.trackDismiss('escape-key')
  }, [analytics])

  const handleExpand = useCallback(() => {
    setIsMinimized(false)
    analytics.trackInteraction()
  }, [analytics])

  // Focus email input when opened (if not minimized)
  useEffect(() => {
    if (isOpen && !isMinimized && emailInputRef.current) {
      setTimeout(() => {
        emailInputRef.current?.focus()
      }, 300) // Small delay for animation
    }
  }, [isOpen, isMinimized])

  // Keyboard handling (Escape to minimize)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isMinimized) {
        handleMinimize()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, isMinimized, handleMinimize])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) return

    setIsSubmitting(true)

    try {
      // Track submission
      analytics.trackSubmission({ email })

      // Call the onSubmit handler (could be API call)
      if (onSubmit) {
        await onSubmit({ email })
      }

      // Show success state
      setIsSuccess(true)

      // Close after 2.5 seconds
      setTimeout(() => {
        setIsOpen(false)
      }, 2500)
    } catch (error) {
      console.error('Error submitting newsletter form:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!enabled) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full px-4 sm:px-0">
          {/* Minimized State */}
          {isMinimized && (
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              onClick={handleExpand}
              className="bg-[#007AFF] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#0066DD] transition-colors flex items-center gap-2 ml-auto"
              aria-label="Expand newsletter signup"
            >
              <Mail className="h-5 w-5" />
              <span className="font-medium">Subscribe to newsletter</span>
            </motion.button>
          )}

          {/* Expanded State */}
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
              role="dialog"
              aria-modal="true"
              aria-labelledby="blog-popup-title"
            >
              {/* Header Bar */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#007AFF] rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-gray-700">B2B Growth Insights</span>
                </div>
                <button
                  onClick={() => handleClose('close-button')}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded hover:bg-white/50"
                  aria-label="Close popup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {!isSuccess ? (
                  <>
                    {/* Icon */}
                    <div className="mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="h-6 w-6 text-[#007AFF]" />
                      </div>
                    </div>

                    {/* Headline */}
                    <h3
                      id="blog-popup-title"
                      className="text-xl font-bold text-gray-900 mb-2"
                    >
                      Want More B2B Growth Insights Like This?
                    </h3>

                    {/* Subheadline */}
                    <p className="text-gray-600 mb-5">
                      Join 5,000+ marketers getting weekly tips on visitor tracking, lead gen,
                      and conversion optimization.
                    </p>

                    {/* Form */}
                    <form
                      onSubmit={handleSubmit}
                      className="space-y-3"
                      toolname="subscribeNewsletter"
                      tooldescription="Subscribe to Cursive's B2B Growth Insights newsletter. Weekly tips on visitor tracking, lead generation, and conversion optimization. Join 5,000+ marketers."
                    >
                      {/* Email Field */}
                      <div>
                        <label htmlFor="blog-popup-email" className="sr-only">
                          Email Address
                        </label>
                        <input
                          ref={emailInputRef}
                          id="blog-popup-email"
                          name="email"
                          type="email"
                          required
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => analytics.trackInteraction()}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none transition-all text-sm"
                          toolparamdescription="Email address to receive weekly B2B growth insights"
                        />
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={isSubmitting || !email}
                        className="w-full"
                        size="default"
                      >
                        {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                      </Button>

                      {/* Privacy & Dismiss */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Free. Unsubscribe anytime.</span>
                        <button
                          type="button"
                          onClick={handleMinimize}
                          className="text-gray-400 hover:text-gray-600 underline"
                        >
                          Maybe later
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  /* Success State */
                  <div className="text-center py-4">
                    <div className="mb-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <svg
                          className="w-6 h-6 text-green-600"
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
                    <h4 className="text-lg font-bold text-gray-900 mb-1">You're Subscribed!</h4>
                    <p className="text-sm text-gray-600">
                      Check your inbox for our welcome email.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  )
}
