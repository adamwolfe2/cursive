'use client'

import { useEffect, useState } from 'react'
import { FUNNEL_EVENTS, trackFunnel } from '@/lib/funnel/tracking'

const DEFAULT_UNLOCK_SECONDS = 30

/**
 * Blurs the pricing section until the visitor has spent `unlockAfterSeconds`
 * on the page (proxy for "watched the VSL"). A countdown overlay sits on top
 * of the blurred cards so the gate feels intentional — not broken — and a
 * "show me pricing now" skip lets motivated buyers through immediately
 * (forced waiting bounces high-intent traffic).
 *
 * Duration is configurable via FUNNEL_GATE_SECONDS (passed from the server
 * page) so it can be A/B-tested without a redeploy. Set it to 0 to disable the
 * gate entirely.
 *
 * Why a wall-clock timer, not real video events? Loom/Mux iframe postMessage
 * APIs aren't officially stable, and autoplay starts within ~200ms anyway. A
 * timer is accurate enough and never gets stuck if a player changes its API.
 */
export function PricingGate({
  children,
  unlockAfterSeconds = DEFAULT_UNLOCK_SECONDS,
}: {
  children: React.ReactNode
  unlockAfterSeconds?: number
}) {
  const [secondsLeft, setSecondsLeft] = useState(unlockAfterSeconds)
  const [method, setMethod] = useState<'timer' | 'skip' | 'email'>('timer')
  const [showEmail, setShowEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const unlocked = secondsLeft <= 0

  async function captureAndUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || submitting) return
    setSubmitting(true)
    try {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
      await fetch('/api/funnel/capture-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'pricing_gate',
          utm_source: params.get('utm_source') || undefined,
          utm_medium: params.get('utm_medium') || undefined,
          utm_campaign: params.get('utm_campaign') || undefined,
        }),
      }).catch(() => {})
    } finally {
      // Never block the reveal on the capture request.
      setMethod('email')
      setSecondsLeft(0)
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (unlocked) return
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [unlocked])

  // Fire pricing_unlocked exactly once. Drives the funnel-conversion calc
  // (% of landing_viewed → pricing_unlocked) and lets us compare skip vs
  // timer unlock rates when A/B-testing the gate duration.
  useEffect(() => {
    if (unlocked) {
      trackFunnel(FUNNEL_EVENTS.PRICING_UNLOCKED, {
        unlocked_after_seconds: unlockAfterSeconds,
        method,
      })
    }
  }, [unlocked, unlockAfterSeconds, method])

  return (
    <div className="relative">
      <div
        className={`transition-all duration-500 ${
          unlocked
            ? 'opacity-100 blur-0'
            : 'pointer-events-none select-none opacity-60 blur-md'
        }`}
        aria-hidden={!unlocked}
      >
        {children}
      </div>

      {!unlocked && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center pt-24">
          <div className="pointer-events-auto rounded-2xl border border-gray-200 bg-white/95 px-6 py-5 text-center shadow-xl backdrop-blur">
            <div className="mb-2 flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              <p className="text-sm font-semibold text-gray-900">
                Pricing unlocks in {secondsLeft}s
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Keep watching, we&apos;ll show you the plans in a moment.
            </p>

            {!showEmail ? (
              <button
                type="button"
                onClick={() => setShowEmail(true)}
                className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                Show me pricing now →
              </button>
            ) : (
              <form onSubmit={captureAndUnlock} className="mt-3 flex flex-col items-stretch gap-2">
                <p className="text-[11px] text-gray-500">Enter your email to see pricing</p>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    disabled={submitting}
                    className="w-48 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !email.trim()}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? '…' : 'See pricing'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
