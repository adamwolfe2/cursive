/**
 * GET /api/affiliate/overview
 * Aggregate summary for the partner portal (rate, active payers, balances,
 * next-tier progress, payout schedule, onboarding/agreement status).
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAffiliateForUser, tryBuildPortalSummary } from '@/lib/affiliate/portal'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const affiliate = await getAffiliateForUser(authUser.id, authUser.email, !!authUser.email_confirmed_at)
    if (!affiliate) return NextResponse.json({ affiliate: null, summary: null })

    const summary = await tryBuildPortalSummary(affiliate)

    return NextResponse.json({
      affiliate: {
        first_name: affiliate.first_name,
        last_name: affiliate.last_name,
        email: affiliate.email,
        partner_code: affiliate.partner_code,
        status: affiliate.status,
      },
      summary,
    })
  } catch (error) {
    safeError('[affiliate/overview] Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
