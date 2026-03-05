/**
 * GET /api/affiliate/settings
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id, email, first_name, last_name, partner_code, stripe_onboarding_complete, agreement_accepted_at, agreement_version, created_at')
      .eq('user_id', authUser.id)
      .maybeSingle()

    if (!affiliate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(affiliate)
  } catch (error) {
    safeError('[affiliate/settings] Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
