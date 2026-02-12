"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Cookie, X } from "lucide-react"

const CONSENT_KEY = "cursive-cookie-consent"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Small delay so it doesn't flash on page load
    const timer = setTimeout(() => {
      const consent = localStorage.getItem(CONSENT_KEY)
      if (!consent) {
        setVisible(true)
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted")
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined")
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-4 left-4 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-auto"
        >
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl p-5">
            {/* Close button */}
            <button
              onClick={decline}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close cookie banner"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon + heading */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Cookie className="w-4 h-4 text-[#007AFF]" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">
                We use cookies & tracking
              </h3>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              We use cookies, pixels, and similar technologies to analyze site traffic,
              identify visitors, and improve your experience. By clicking "Accept," you
              consent to our use of these technologies. See our{" "}
              <Link href="/privacy" className="text-[#007AFF] hover:underline">
                Privacy Policy
              </Link>{" "}
              for details.
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={accept}
                className="flex-1 px-4 py-2 text-sm bg-[#007AFF] text-white rounded-lg hover:bg-[#0066DD] transition-colors"
              >
                Accept
              </button>
              <button
                onClick={decline}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
