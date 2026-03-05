/**
 * GET /api/affiliate/commissions
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
      .select('id, total_activations, current_tier, total_earnings')
      .eq('user_id', authUser.id)
      .maybeSingle()

    if (!affiliate) return NextResponse.json({ commissions: [], milestones: [], affiliate: null })

    const [commissionsRes, milestonesRes] = await Promise.all([
      admin
        .from('affiliate_commissions')
        .select('id, invoice_amount, commission_rate, commission_amount, status, created_at')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false }),
      admin
        .from('affiliate_milestone_bonuses')
        .select('id, tier, bonus_amount, status, created_at')
        .eq('affiliate_id', affiliate.id)
        .order('tier', { ascending: true }),
    ])

    return NextResponse.json({
      commissions: commissionsRes.data || [],
      milestones: milestonesRes.data || [],
      affiliate: {
        total_activations: affiliate.total_activations,
        current_tier: affiliate.current_tier,
        total_earnings: affiliate.total_earnings,
      },
    })
  } catch (error) {
    safeError('[affiliate/commissions] Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
