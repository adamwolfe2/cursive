'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Sparkles } from 'lucide-react'

const DISMISSED_KEY = 'cursive_leads_banner_dismissed'

interface FirstLeadsBannerProps {
  count: number
  workspaceAgeHours: number
}

export function FirstLeadsBanner({ count, workspaceAgeHours }: FirstLeadsBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DISMISSED_KEY)
      if (!dismissed && count > 0 && workspaceAgeHours < 48) {
        setVisible(true)
      }
    } catch {
      // localStorage unavailable — leave hidden
    }
  }, [count, workspaceAgeHours])

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, 'true')
    } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-emerald-500 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold text-emerald-900 text-sm">
            Your first {count} lead{count === 1 ? '' : 's'} just arrived — matched to your industry and location.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/leads"
          className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 transition-colors"
        >
          View All Leads
        </Link>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="p-1 rounded-md text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
