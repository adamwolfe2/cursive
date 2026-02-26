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

  const colorClass =
    daysLeft <= 3
      ? 'bg-red-50 border-red-200'
      : daysLeft <= 7
      ? 'bg-amber-50 border-amber-200'
      : 'bg-blue-50 border-blue-200'

  const iconColor =
    daysLeft <= 3 ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-blue-600'

  const headingColor =
    daysLeft <= 3
      ? 'text-red-900'
      : daysLeft <= 7
      ? 'text-amber-900'
      : 'text-blue-900'

  const bodyColor =
    daysLeft <= 3 ? 'text-red-700' : daysLeft <= 7 ? 'text-amber-700' : 'text-blue-700'

  const btnColor =
    daysLeft <= 3
      ? 'bg-red-600 hover:bg-red-700'
      : daysLeft <= 7
      ? 'bg-amber-600 hover:bg-amber-700'
      : 'bg-blue-600 hover:bg-blue-700'

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
