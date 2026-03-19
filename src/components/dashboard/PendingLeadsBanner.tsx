'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, X, ArrowRight } from 'lucide-react'

const DISMISSED_KEY = 'cursive_pending_leads_dismissed'

interface PendingLeadsBannerProps {
  /** Hours since workspace was created */
  workspaceAgeHours: number
  /** Whether the user has set targeting preferences */
  hasPreferences: boolean
  /** Whether the pixel is installed */
  hasPixel: boolean
  /** Daily lead limit for this user */
  dailyLimit: number
}

/**
 * Shown to new workspaces (< 48h old) that have zero leads.
 * Reassures the user that leads are being matched and will arrive soon.
 */
export function PendingLeadsBanner({
  workspaceAgeHours,
  hasPreferences,
  hasPixel,
  dailyLimit,
}: PendingLeadsBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DISMISSED_KEY)
      if (!dismissed) {
        setVisible(true)
      }
    } catch {
      // localStorage unavailable
      setVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, 'true')
    } catch {}
    setVisible(false)
  }

  if (!visible) return null

  const isVeryNew = workspaceAgeHours < 1

  return (
    <div className="rounded-xl bg-blue-50 border border-blue-200 p-5 flex items-start gap-3">
      <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-blue-900">
          {isVeryNew
            ? "We're matching leads to your preferences right now"
            : 'Your first leads will arrive by 8 AM CT tomorrow'}
        </p>
        <p className="text-sm text-blue-700 mt-1">
          {isVeryNew
            ? `Our system is building your lead pipeline. You'll receive up to ${dailyLimit} fresh, matched leads every morning at 8 AM CT.`
            : `We're matching leads to your industry and location preferences. You'll get up to ${dailyLimit} fresh leads every morning.`}
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          {!hasPreferences && (
            <Link
              href="/my-leads/preferences"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
            >
              Set targeting preferences <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
          {hasPreferences && !hasPixel && (
            <Link
              href="/settings/pixel"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
            >
              Install pixel while you wait <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss banner"
        className="p-1 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
