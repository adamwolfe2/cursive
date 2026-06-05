'use client'

import { useEffect, useState } from 'react'

const UNLOCK_AFTER_SECONDS = 20

/**
 * Blurs the pricing section until the visitor has spent UNLOCK_AFTER_SECONDS
 * on the page (proxy for "watched ~20s of the autoplaying VSL"). A countdown
 * overlay sits on top of the blurred cards so the gate feels intentional —
 * not broken.
 *
 * Why not key off real Loom playback events? Loom's iframe postMessage API
 * is not officially stable, and autoplay/mute heuristics mean playback
 * usually starts within ~200ms of page load anyway. A wall-clock timer is
 * accurate enough and never gets stuck if Loom changes their event shape.
 */
export function PricingGate({ children }: { children: React.ReactNode }) {
  const [secondsLeft, setSecondsLeft] = useState(UNLOCK_AFTER_SECONDS)
  const unlocked = secondsLeft <= 0

  useEffect(() => {
    if (unlocked) return
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [unlocked])

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
              Keep watching — we&apos;ll show you the plans in a moment.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
