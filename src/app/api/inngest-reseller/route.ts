export const maxDuration = 300

// Isolated Inngest API Route — Reseller / White-Label App
//
// Serves ONLY the reseller lead-forwarding function under its own Inngest app
// (`cursive-reseller`). This exists because the main app's sync is rejected on
// the Free plan (functions declare concurrency > the account cap of 5), which
// would otherwise leave reseller delivery permanently unregistered. Isolating it
// here — with a single low-concurrency function — lets it sync and run
// independently. See src/inngest/reseller-client.ts for the full rationale.
//
// Node.js runtime: the delivery function uses crypto + admin Supabase client.

export const runtime = 'nodejs'

import { serve } from 'inngest/next'
import { resellerInngest } from '@/inngest/reseller-client'
import { deliverResellerLead } from '@/inngest/functions/deliver-reseller-lead'

export const { GET, POST, PUT } = serve({
  client: resellerInngest,
  functions: [deliverResellerLead],
})
