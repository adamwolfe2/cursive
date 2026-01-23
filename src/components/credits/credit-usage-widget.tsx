'use client'

// Credit Usage Widget
// Displays current credit status and usage statistics

import { useEffect, useState } from 'react'
import { Activity, TrendingUp, AlertCircle } from 'lucide-react'

interface CreditStatus {
  credits: {
    remaining: number
    limit: number
    used: number
    resetAt: string
    plan: string
  }
  usage: Record<
    string,
    {
      count: number
      total: number
    }
  >
}

export function CreditUsageWidget() {
  const [status, setStatus] = useState<CreditStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCreditStatus()
    // Refresh every minute
    const interval = setInterval(fetchCreditStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchCreditStatus = async () => {
    try {
      const response = await fetch('/api/credits/status')
      if (!response.ok) throw new Error('Failed to fetch credit status')
      const data = await response.json()
      setStatus(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 animate-pulse">
        <div className="h-4 w-24 bg-zinc-200 rounded mb-4"></div>
        <div className="h-8 w-32 bg-zinc-200 rounded mb-2"></div>
        <div className="h-3 w-full bg-zinc-200 rounded"></div>
      </div>
    )
  }

  if (error || !status) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">Failed to load credit status</p>
        </div>
      </div>
    )
  }

  const { credits, usage } = status
  const usagePercent = (credits.used / credits.limit) * 100
  const isLowCredits = credits.remaining < credits.limit * 0.2

  // Format reset time
  const resetDate = new Date(credits.resetAt)
  const resetTime = resetDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-900">Daily Credits</h3>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${
            credits.plan === 'pro'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-zinc-100 text-zinc-700'
          }`}
        >
          {credits.plan.toUpperCase()}
        </span>
      </div>

      {/* Credits Display */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span className="text-3xl font-bold text-zinc-900">
              {credits.remaining.toLocaleString()}
            </span>
            <span className="text-sm text-zinc-500 ml-2">
              / {credits.limit.toLocaleString()}
            </span>
          </div>
          {isLowCredits && (
            <span className="text-xs text-amber-600 font-medium">
              Low credits
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${
              isLowCredits
                ? 'bg-amber-500'
                : usagePercent > 50
                  ? 'bg-emerald-500'
                  : 'bg-emerald-400'
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>

        <p className="text-[12px] text-zinc-500 mt-2">
          Resets at {resetTime}
        </p>
      </div>

      {/* Usage Breakdown */}
      {Object.keys(usage).length > 0 && (
        <div className="pt-4 border-t border-zinc-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-zinc-400" />
            <p className="text-xs font-medium text-zinc-700">
              Last 7 Days Usage
            </p>
          </div>
          <div className="space-y-2">
            {Object.entries(usage).map(([action, stats]) => (
              <div key={action} className="flex items-center justify-between">
                <span className="text-[12px] text-zinc-600 capitalize">
                  {action.replace(/_/g, ' ')}
                </span>
                <span className="text-[12px] font-medium text-zinc-900">
                  {stats.count} ({stats.total} credits)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade CTA for free users */}
      {credits.plan === 'free' && isLowCredits && (
        <div className="mt-4 pt-4 border-t border-zinc-200">
          <a
            href="/pricing"
            className="block w-full text-center px-4 py-2 bg-zinc-900 text-white text-[13px] font-medium rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Upgrade to Pro
          </a>
        </div>
      )}
    </div>
  )
}
