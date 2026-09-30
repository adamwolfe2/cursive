/**
 * GET /api/start/leads?c=<link token> (session required) -> LeadsResponse.
 * The `c` token from the emailed link is required to fulfill a pending claim: a session
 * alone does not prove mailbox access (invariant 1). Only the user who fulfilled the claim
 * can re-read it without the token.
 * First call for a pending claim atomically moves it pending -> processing, provisions
 * (or reuses) the workspace, pulls exactly 25 leads and stores them. Later calls (refresh,
 * parallel tabs) return the stored rows; a concurrent call waits for the winner.
 */
export const runtime = 'nodejs'
export const maxDuration = 90

import { NextResponse, type NextRequest } from 'next/server'
import type { LeadsResponse } from '@/lib/free-leads/contract'
import {
  beginFulfillment,
  ClaimError,
  claimIcp,
  findLatestClaimByEmail,
  fulfillClaim,
  loadStoredLeads,
  releaseClaim,
  withinDailyFulfillmentCap,
  type ClaimRow,
} from '@/lib/free-leads/claims'
import { leadsActionFor, mayAccessClaim } from '@/lib/free-leads/rules'
import { sessionUser } from '@/lib/free-leads/http'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

type Admin = ReturnType<typeof createAdminClient>

const reply = (body: LeadsResponse, status = 200) => NextResponse.json<LeadsResponse>(body, { status })
const failed = (message: string) => reply({ status: 'failed', message })
const RETRY_MESSAGE = 'We could not load your leads just now. Refresh in a minute.'
const LINK_MESSAGE = 'Open the link in your email to unlock your leads.'
const CAP_MESSAGE = 'We have handed out all of today\'s free lists. Use the same email link tomorrow.'

async function ready(claim: ClaimRow, admin: Admin) {
  const icp = claimIcp(claim)
  if (!icp || !claim.workspace_id) return failed(RETRY_MESSAGE)
  const leads = await loadStoredLeads(claim.workspace_id, claim.id, admin)
  return reply({ status: 'ready', icp, website: claim.website, leads, total_matching: claim.total_matching ?? leads.length })
}

/** Loser of the pending -> processing race: wait for the winner to finish (max ~25s). */
async function waitForWinner(email: string, admin: Admin): Promise<ClaimRow | null> {
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 1000))
    const claim = await findLatestClaimByEmail(email, admin)
    if (leadsActionFor(claim) !== 'wait') return claim
  }
  return null
}

async function respondFor(claim: ClaimRow | null, userId: string, email: string, admin: Admin): Promise<NextResponse> {
  switch (leadsActionFor(claim)) {
    case 'no_claim':
      return reply({ status: 'no_claim' })
    case 'return_stored':
      return ready(claim as ClaimRow, admin)
    case 'failed':
      return failed('This free batch could not be delivered. Reply to the email and we will sort it out.')
    case 'wait': {
      const settled = await waitForWinner(email, admin)
      const next = leadsActionFor(settled)
      return next === 'wait' || next === 'fulfill' ? failed(RETRY_MESSAGE) : respondFor(settled, userId, email, admin)
    }
    case 'fulfill': {
      const won = await beginFulfillment((claim as ClaimRow).id, userId, admin)
      if (!won) return respondFor(await findLatestClaimByEmail(email, admin), userId, email, admin)
      if (!(await withinDailyFulfillmentCap(admin))) {
        await releaseClaim((claim as ClaimRow).id, admin)
        return failed(CAP_MESSAGE)
      }
      await fulfillClaim(claim as ClaimRow, userId, admin)
      return respondFor(await findLatestClaimByEmail(email, admin), userId, email, admin)
    }
  }
}

export async function GET(req: NextRequest) {
  const user = await sessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Service role: free_lead_claims is server-only (RLS, no policies), and the first call
  // provisions workspace/users rows for a user who has none yet. Claim lookup is keyed on
  // the verified session email, so a user can only ever materialize their own claim.
  const admin = createAdminClient()
  try {
    const claim = await findLatestClaimByEmail(user.email, admin)
    if (claim && !mayAccessClaim(claim, req.nextUrl.searchParams.get('c'), user.id)) return failed(LINK_MESSAGE)
    return await respondFor(claim, user.id, user.email, admin)
  } catch (err) {
    safeError('[start/leads] materialize failed', err)
    if (err instanceof ClaimError && err.code === 'domain_taken') {
      return failed('Someone at your company already claimed the free 25 leads.')
    }
    return failed(RETRY_MESSAGE)
  }
}
