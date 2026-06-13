/**
 * POST /api/affiliate/accept-terms
 * Records agreement acceptance for the authenticated affiliate.
 *
 * SECURITY (blocker B1): the affiliate row is resolved ONLY through the hardened
 * claim authority `resolveAffiliateIdForUser`, which links by a VERIFIED email
 * exactly once. The previous unguarded `email`-fallback let an attacker who
 * signed up with a known partner's email claim that partner's row (and redirect
 * their payouts). Never re-introduce a raw-email lookup here.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveAffiliateIdForUser } from '@/lib/affiliate/portal'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const version = (body as { version?: string }).version || 'v1.0'

    // Hardened resolution: verified-email + one-time claim only. No raw-email fallback.
    const affiliateId = await resolveAffiliateIdForUser(
      authUser.id,
      authUser.email,
      !!authUser.email_confirmed_at
    )

    if (!affiliateId) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    const admin = createAdminClient()
    await admin
      .from('affiliates')
      .update({
        agreement_accepted_at: new Date().toISOString(),
        agreement_version: version,
      })
      .eq('id', affiliateId)

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('[affiliate/accept-terms] Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
