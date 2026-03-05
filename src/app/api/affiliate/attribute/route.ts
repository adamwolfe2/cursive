/**
 * POST /api/affiliate/attribute
 * Called after signup to create referral row if cursive_ref cookie present
 * Idempotent via UNIQUE(affiliate_id, referred_email) — safe to call multiple times
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendPartnerNewLead } from '@/lib/email/affiliate-emails'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) {
      return NextResponse.json({ success: false, reason: 'not_authenticated' })
    }

    // Get ref code from body (passed from client reading the cookie)
    const body = await request.json().catch(() => ({}))
    const { refCode } = body as { refCode?: string }

    if (!refCode || typeof refCode !== 'string') {
      return NextResponse.json({ success: false, reason: 'no_ref_code' })
    }

    const code = refCode.toUpperCase().trim()
    if (!/^[A-Z0-9]{8}$/.test(code)) {
      return NextResponse.json({ success: false, reason: 'invalid_code' })
    }

    const admin = createAdminClient()

    // Look up active affiliate by partner code
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id, email, first_name')
      .eq('partner_code', code)
      .eq('status', 'active')
      .maybeSingle()

    if (!affiliate) {
      return NextResponse.json({ success: false, reason: 'affiliate_not_found' })
    }

    // Insert referral with onConflictDoNothing — idempotency guard
    const { data: referral } = await admin
      .from('affiliate_referrals')
      .insert({
        affiliate_id: affiliate.id,
        referred_user_id: authUser.id,
        referred_email: authUser.email.toLowerCase(),
      })
      .select('id')
      .maybeSingle()

    // If referral is null, this email was already attributed to this affiliate
    if (referral) {
      // Send new lead notification (non-blocking)
      sendPartnerNewLead(affiliate.email, affiliate.first_name, authUser.email).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('[affiliate/attribute] Error:', error)
    return NextResponse.json({ success: false, reason: 'error' })
  }
}
