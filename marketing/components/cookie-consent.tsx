"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Cookie, X } from "lucide-react"

const CONSENT_KEY = "cursive-cookie-consent"
const CONSENT_VERSION = "2" // Bump when consent notice text changes materially

export type ConsentDecision = "accepted" | "declined"

export interface ConsentRecord {
  decision: ConsentDecision
  timestamp: string // ISO 8601
  version: string
}

/** Read the stored consent record (null = not yet decided) */
export function getConsentRecord(): ConsentRecord | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentRecord
    // Treat old format (plain string) as needing re-consent
    if (typeof parsed !== "object" || !parsed.decision) return null
    return parsed
  } catch {
    return null
  }
}

/** True only when the user has explicitly accepted */
export function hasConsentAccepted(): boolean {
  return getConsentRecord()?.decision === "accepted"
}

function saveConsent(decision: ConsentDecision) {
  const record: ConsentRecord = {
    decision,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  }
  localStorage.setItem(CONSENT_KEY, JSON.stringify(record))
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Small delay so it doesn't flash on page load
    const timer = setTimeout(() => {
      const record = getConsentRecord()
      // Re-show if never decided OR if the notice version changed
      if (!record || record.version !== CONSENT_VERSION) {
        setVisible(true)
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const accept = useCallback(() => {
    saveConsent("accepted")
    setVisible(false)
    // Let the page know consent changed so analytics can initialize
    window.dispatchEvent(new CustomEvent("cursive:consent", { detail: { decision: "accepted" } }))
  }, [])

  const decline = useCallback(() => {
    saveConsent("declined")
    setVisible(false)
    window.dispatchEvent(new CustomEvent("cursive:consent", { detail: { decision: "declined" } }))
  }, [])

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
            {/* Close button — treated as decline */}
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
                We use cookies &amp; tracking
              </h3>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              We use cookies, visitor identification pixels, and analytics to
              understand site traffic and improve your experience. Declining
              disables non-essential tracking. See our{" "}
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
