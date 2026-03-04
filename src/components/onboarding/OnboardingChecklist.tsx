'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, X, ArrowRight } from 'lucide-react'
import { useOnboardingChecklist } from '@/lib/hooks/use-onboarding-checklist'

const DISMISSED_KEY = 'onboarding_checklist_dismissed'

export function OnboardingChecklist() {
  const { data, isLoading, isError } = useOnboardingChecklist()
  const [dismissed, setDismissed] = useState<boolean | null>(null)

  // Read dismissed state from localStorage after mount
  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true')
    } catch {
      setDismissed(false)
    }
  }, [])

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, 'true')
    } catch {
      // localStorage unavailable — still hide in this session
    }
    setDismissed(true)
  }

  // Don't render until we know the dismissed state (avoids flash)
  if (dismissed === null || dismissed) return null
  if (isLoading || isError || !data) return null

  const items = data.items
  const completedCount = items.filter((i) => i.completed).length
  const totalCount = items.length
  const allComplete = completedCount === totalCount

  // Hide once all steps are complete AND user hasn't explicitly dismissed yet —
  // show the celebration state briefly so they see it, then they can dismiss.
  // (Widget stays visible when allComplete so user can see the success state.)

  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 text-sm">Setup Checklist</h3>
            <span className="text-xs text-gray-500 ml-2 shrink-0">
              {completedCount} of {totalCount}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                allComplete
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                  : 'bg-gradient-to-r from-blue-500 to-primary'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss checklist"
          className="ml-3 shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* All-complete celebration */}
      {allComplete ? (
        <div className="px-5 pb-4">
          <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-4 py-3 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-900">You&apos;re all set!</p>
              <p className="text-xs text-green-700 mt-0.5">
                Your Cursive setup is complete. Leads arrive every morning at 8am CT.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="shrink-0 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1.5 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : (
        /* Step list */
        <div className="px-5 pb-4 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2.5">
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-gray-300 shrink-0" />
              )}

              {!item.completed ? (
                <Link
                  href={item.href}
                  className="flex-1 flex items-center justify-between gap-1 group"
                >
                  <span className="text-sm text-gray-700 group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                  <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-primary transition-colors shrink-0" />
                </Link>
              ) : (
                <span className="text-sm text-gray-400 line-through flex-1">
                  {item.title}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
