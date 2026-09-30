/** POST /api/start/interest (session required)  body: { tier }  -> InterestResponse. Records intent on the claim. */
export const runtime = 'nodejs'

import { NextResponse, type NextRequest } from 'next/server'
import { BOOKING_URL, InterestRequestSchema, type InterestResponse } from '@/lib/free-leads/contract'
import { findLatestClaimByEmail, recordInterest } from '@/lib/free-leads/claims'
import { badRequest, readJson, serverError, sessionUser } from '@/lib/free-leads/http'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { recordStep } from '@/lib/free-leads/funnel'
import { notifySales, slackSafe } from '@/lib/free-leads/notify'

const TIER_LABEL = { weekly_leads: 'weekly leads', linkedin_outreach: 'LinkedIn outreach done for you', ai_dashboard: 'AI dashboard' } as const

export async function POST(req: NextRequest) {
  const user = await sessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = InterestRequestSchema.safeParse(await readJson(req))
  if (!parsed.success) return badRequest('Invalid tier')

  // Service role: free_lead_claims is server-only (RLS, no policies); scoped to the session email.
  const admin = createAdminClient()
  try {
    const claim = await findLatestClaimByEmail(user.email, admin)
    const tier = parsed.data.tier
    if (claim) await recordInterest(claim.id, tier, admin)
    safeLog('[start/interest] recorded', { tier, has_claim: Boolean(claim) })
    await recordStep(claim?.session_id ?? null, `upgrade_${tier}`)
    await notifySales(
      `Upgrade intent: ${TIER_LABEL[tier]} from ${slackSafe(user.email)}${claim ? ` (${slackSafe(claim.website.replace(/^https?:\/\//, ''))})` : ''}`
    )
    return NextResponse.json<InterestResponse>({ ok: true, booking_url: BOOKING_URL })
  } catch (err) {
    safeError('[start/interest] record failed', err)
    return serverError()
  }
}
