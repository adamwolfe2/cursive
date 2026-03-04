'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Target } from 'lucide-react'

interface TrialCountdownProps {
  trialEndsAt: string
  visitorCountTotal?: number | null
}

function computeDaysLeft(trialEndsAt: string): number {
  return Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000))
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

  const isUrgent = daysLeft <= 3
  const colorClass = isUrgent ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
  const iconColor = isUrgent ? 'text-red-600' : 'text-blue-600'
  const headingColor = isUrgent ? 'text-red-900' : 'text-blue-900'
  const bodyColor = isUrgent ? 'text-red-700' : 'text-blue-700'
  const btnColor = isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'

  const heading =
    daysLeft === 0
      ? 'Pixel trial ends today!'
      : daysLeft === 1
      ? 'Pixel trial ends tomorrow'
      : `${daysLeft} days remaining in your free pixel trial`

  return (
    <div className={`rounded-xl border p-5 flex items-center justify-between gap-4 ${colorClass}`}>
      <div className="flex items-center gap-3">
        <Target className={`h-6 w-6 shrink-0 ${iconColor}`} />
        <div>
          <p className={`font-semibold text-sm mb-1 ${headingColor}`}>{heading}</p>
          <p className={`text-xs ${bodyColor}`}>
            {visitorCountTotal ? `${visitorCountTotal} visitors identified so far · ` : ''}
            Upgrade to keep website visitor identification active.
          </p>
        </div>
      </div>
      <Link
        href="/settings/billing"
        className={`shrink-0 text-sm font-semibold rounded-lg px-4 py-2 transition-colors text-white ${btnColor}`}
      >
        Upgrade Now
      </Link>
    </div>
  )
}
