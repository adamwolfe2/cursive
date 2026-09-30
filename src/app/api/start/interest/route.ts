/** POST /api/start/interest (session required)  body: { tier }  -> InterestResponse. Records intent on the claim. */
export const runtime = 'nodejs'

import { NextResponse, type NextRequest } from 'next/server'
import { BOOKING_URL, InterestRequestSchema, type InterestResponse } from '@/lib/free-leads/contract'
import { findLatestClaimByEmail, recordInterest } from '@/lib/free-leads/claims'
import { badRequest, readJson, serverError, sessionUser } from '@/lib/free-leads/http'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

export async function POST(req: NextRequest) {
  const user = await sessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = InterestRequestSchema.safeParse(await readJson(req))
  if (!parsed.success) return badRequest('Invalid tier')

  // Service role: free_lead_claims is server-only (RLS, no policies); scoped to the session email.
  const admin = createAdminClient()
  try {
    const claim = await findLatestClaimByEmail(user.email, admin)
    if (claim) await recordInterest(claim.id, parsed.data.tier, admin)
    safeLog('[start/interest] recorded', { tier: parsed.data.tier, has_claim: Boolean(claim) })
    return NextResponse.json<InterestResponse>({ ok: true, booking_url: BOOKING_URL })
  } catch (err) {
    safeError('[start/interest] record failed', err)
    return serverError()
  }
}
