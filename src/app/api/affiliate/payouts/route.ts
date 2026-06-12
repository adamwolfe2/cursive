/**
 * GET /api/affiliate/payouts
 * Payout history for the authenticated partner.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAffiliateForUser } from '@/lib/affiliate/portal'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const affiliate = await getAffiliateForUser(authUser.id, authUser.email, !!authUser.email_confirmed_at)
    if (!affiliate) return NextResponse.json({ payouts: [] })

    const admin = createAdminClient()
    const { data } = await admin
      .from('affiliate_payouts')
      .select('id, amount, status, period_start, period_end, created_at')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ payouts: data || [] })
  } catch (error) {
    safeError('[affiliate/payouts] Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
