'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Target } from 'lucide-react'
import { useDismissible } from '@/lib/hooks/use-dismissible'

interface TrialCountdownProps {
  trialEndsAt: string
  visitorCountTotal?: number | null
}

function computeDaysLeft(trialEndsAt: string): number {
  return Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000)
}

export function TrialCountdown({ trialEndsAt, visitorCountTotal }: TrialCountdownProps) {
  const [daysLeft, setDaysLeft] = useState(() => computeDaysLeft(trialEndsAt))
  const { dismissed, dismiss } = useDismissible('cursive_trial_banner_dismissed', 24)

  useEffect(() => {
    setDaysLeft(computeDaysLeft(trialEndsAt))

    const interval = setInterval(() => {
      setDaysLeft(computeDaysLeft(trialEndsAt))
    }, 60_000)

    return () => clearInterval(interval)
  }, [trialEndsAt])

  if (dismissed) return null

  const isExpired = daysLeft < 0
  const isUrgent = !isExpired && daysLeft <= 3

  const colorClass = isExpired || isUrgent ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
  const iconColor = isExpired || isUrgent ? 'text-red-600' : 'text-blue-600'
  const headingColor = isExpired || isUrgent ? 'text-red-900' : 'text-blue-900'
  const bodyColor = isExpired || isUrgent ? 'text-red-700' : 'text-blue-700'
  const btnColor = isExpired || isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'

  const heading = isExpired
    ? 'Pixel trial expired'
    : daysLeft === 0
    ? 'Pixel trial ends today!'
    : daysLeft === 1
    ? 'Pixel trial ends tomorrow'
    : `${daysLeft} days left in pixel trial`

  const bodyText = isExpired
    ? 'Pixel stopped. Upgrade to reactivate.'
    : `${visitorCountTotal ? `${visitorCountTotal} visitors identified · ` : ''}Upgrade to keep visitor ID active.`

  return (
    <div className={`rounded-lg border px-4 py-2 flex items-center justify-between gap-3 ${colorClass}`}>
      <div className="flex items-center gap-2 min-w-0">
        <Target className={`h-4 w-4 shrink-0 ${iconColor}`} />
        <p className={`font-semibold text-xs ${headingColor} truncate`}>{heading}</p>
        <span className={`hidden sm:inline text-xs ${bodyColor}`}>{bodyText}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/settings/billing"
          className={`text-xs font-semibold rounded-md px-3 py-1 transition-colors text-white ${btnColor}`}
        >
          {isExpired ? 'Reactivate' : 'Upgrade'}
        </Link>
        <button
          onClick={dismiss}
          className="text-current opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Dismiss trial banner"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
