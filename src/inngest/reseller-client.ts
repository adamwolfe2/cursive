// Isolated Inngest Client — Reseller / White-Label App
//
// WHY A SECOND CLIENT/APP:
// The main Inngest app (`cursive-platform`) declares functions with per-function
// concurrency far above the Free plan's account cap (5). Inngest rejects the
// WHOLE app's sync (`PUT /api/inngest` → 400, `modified:false`), so every main-app
// function — including reseller delivery if it lived there — silently never
// registers in production.
//
// To keep reseller lead-forwarding LIVE on the free tier without touching the
// main app, `deliverResellerLead` is served under this SEPARATE app id
// (`cursive-reseller`) at `/api/inngest-reseller`. It registers ONE function whose
// concurrency (limit 3) is well under the cap, so its sync succeeds independently.
//
// Inngest events are ACCOUNT-WIDE: `lead/created` (fired by edge-processor) is
// delivered to every app that has a subscriber, so this app receives it even
// though it's a different serve endpoint.
//
// This client reuses the same Events typing + INNGEST_EVENT_KEY as the main
// client. It only RECEIVES events (never sends), but shares the account signing
// key (INNGEST_SIGNING_KEY, env) used by serve().

import { Inngest } from 'inngest'

// Lazy-init to avoid build-time initialization (mirrors src/inngest/client.ts).
let resellerInstance: Inngest | null = null

export function getResellerInngest(): Inngest {
  if (!resellerInstance) {
    resellerInstance = new Inngest({
      id: 'cursive-reseller',
      name: 'Cursive Reseller',
      eventKey: process.env.INNGEST_EVENT_KEY,
    } as any)
  }
  return resellerInstance
}

// Export the reseller inngest instance with lazy initialization
// (mirrors the Proxy pattern in src/inngest/client.ts).
export const resellerInngest = new Proxy({} as Inngest, {
  get(_target, prop) {
    return (getResellerInngest() as any)[prop]
  },
})
