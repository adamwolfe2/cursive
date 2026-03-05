/**
 * POST /api/affiliate/accept-terms
 * Records agreement acceptance for the authenticated affiliate
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    const admin = createAdminClient()

    // Find affiliate by user_id or email
    let affiliate = null
    const { data: byUserId } = await admin
      .from('affiliates')
      .select('id')
      .eq('user_id', authUser.id)
      .maybeSingle()

    if (byUserId) {
      affiliate = byUserId
    } else {
      const { data: byEmail } = await admin
        .from('affiliates')
        .select('id')
        .eq('email', authUser.email?.toLowerCase() || '')
        .maybeSingle()
      affiliate = byEmail
    }

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    await admin
      .from('affiliates')
      .update({
        agreement_accepted_at: new Date().toISOString(),
        agreement_version: version,
        user_id: authUser.id, // ensure linked
      })
      .eq('id', affiliate.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('[affiliate/accept-terms] Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
