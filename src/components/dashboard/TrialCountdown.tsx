'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Target } from 'lucide-react'

interface TrialCountdownProps {
  trialEndsAt: string
  visitorCountTotal?: number | null
}

function computeDaysLeft(trialEndsAt: string): number {
  return Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000)
}

export function TrialCountdown({ trialEndsAt, visitorCountTotal }: TrialCountdownProps) {
  const [daysLeft, setDaysLeft] = useState(() => computeDaysLeft(trialEndsAt))

  useEffect(() => {
    // Recalculate immediately in case of client/server time drift
    setDaysLeft(computeDaysLeft(trialEndsAt))

    const interval = setInterval(() => {
      setDaysLeft(computeDaysLeft(trialEndsAt))
    }, 60_000)

    return () => clearInterval(interval)
  }, [trialEndsAt])

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
    : `${daysLeft} days remaining in your free pixel trial`

  const bodyText = isExpired
    ? 'Your pixel has stopped firing. Upgrade to reactivate website visitor identification.'
    : `${visitorCountTotal ? `${visitorCountTotal} visitors identified so far · ` : ''}Upgrade to keep website visitor identification active.`

  return (
    <div className={`rounded-xl border p-5 flex items-center justify-between gap-4 ${colorClass}`}>
      <div className="flex items-center gap-3">
        <Target className={`h-6 w-6 shrink-0 ${iconColor}`} />
        <div>
          <p className={`font-semibold text-sm mb-1 ${headingColor}`}>{heading}</p>
          <p className={`text-xs ${bodyColor}`}>{bodyText}</p>
        </div>
      </div>
      <Link
        href="/settings/billing"
        className={`shrink-0 text-sm font-semibold rounded-lg px-4 py-2 transition-colors text-white ${btnColor}`}
      >
        {isExpired ? 'Reactivate Pixel' : 'Upgrade Now'}
      </Link>
    </div>
  )
}
