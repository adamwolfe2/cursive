/**
 * GET /api/affiliate/referrals
 * Returns referrals for the authenticated affiliate
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const status = request.nextUrl.searchParams.get('status')
    const admin = createAdminClient()

    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id')
      .eq('user_id', authUser.id)
      .maybeSingle()

    if (!affiliate) return NextResponse.json([])

    let query = admin
      .from('affiliate_referrals')
      .select('id, referred_email, status, attributed_at, activated_at')
      .eq('affiliate_id', affiliate.id)
      .order('attributed_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data } = await query
    return NextResponse.json(data || [])
  } catch (error) {
    safeError('[affiliate/referrals] Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
