'use client'

import { useEffect, useState } from 'react'

const MAX_ATTEMPTS = 30 // ~60 seconds at 2s interval
const INTERVAL_MS = 2000

export function WaitingPoller({ sessionId }: { sessionId: string }) {
  const [attempts, setAttempts] = useState(0)
  const [exhausted, setExhausted] = useState(false)

  useEffect(() => {
    if (exhausted) return
    const handle = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/funnel/by-session?session_id=${encodeURIComponent(sessionId)}`,
          { cache: 'no-store' }
        )
        if (res.ok) {
          const json = (await res.json()) as { portal_url?: string }
          if (json.portal_url) {
            window.location.assign(json.portal_url)
            return
          }
        }
        setAttempts((n) => {
          const next = n + 1
          if (next >= MAX_ATTEMPTS) {
            setExhausted(true)
            clearInterval(handle)
          }
          return next
        })
      } catch {
        // try again next tick
      }
    }, INTERVAL_MS)

    return () => clearInterval(handle)
  }, [sessionId, exhausted])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        {exhausted ? (
          <>
            <h1 className="mb-3 text-xl font-semibold text-gray-900">
              Almost there — check your email
            </h1>
            <p className="text-sm text-gray-500">
              Your payment went through. We&apos;ve sent your setup portal link
              to the email you used at checkout. Reply to that email if you
              don&apos;t see it.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
            <h1 className="mb-3 text-xl font-semibold text-gray-900">
              Getting your account ready…
            </h1>
            <p className="text-sm text-gray-500">
              Payment received. Stripe is confirming things on our end — this
              usually takes just a few seconds.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
