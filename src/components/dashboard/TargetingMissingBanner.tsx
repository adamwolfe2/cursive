'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'

/**
 * Warning banner shown when a user's targeting data is missing
 * (no industries or states set in user_targeting). Without targeting,
 * the lead matching system cannot deliver relevant leads.
 */
export function TargetingMissingBanner() {
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-amber-900">
          Set your lead preferences to start receiving matched leads
        </p>
        <p className="text-sm text-amber-700 mt-1">
          We need to know your target industries and locations to match you with the right leads.
          Without preferences set, your lead pipeline will remain empty.
        </p>
        <Link
          href="/my-leads/preferences"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
        >
          Set Preferences <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
