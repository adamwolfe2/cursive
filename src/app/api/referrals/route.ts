// Referrals API
// Get referral stats and manage referral codes

import { NextRequest, NextResponse } from 'next/server'
import { fastAuth } from '@/lib/auth/fast-auth'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import {
  getWorkspaceReferralStats,
  assignWorkspaceReferralCode,
} from '@/lib/services/referral.service'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const user = await fastAuth(request)
    if (!user) return unauthorized()

    const stats = await getWorkspaceReferralStats(user.workspaceId)

    // Generate referral code if not exists
    if (!stats.referralCode) {
      stats.referralCode = await assignWorkspaceReferralCode(user.workspaceId)
    }

    // Fetch per-referral milestone data
    const supabase = createAdminClient()
    const { data: referrals } = await supabase
      .from('referrals')
      .select('id, status, milestones_achieved, created_at, referee_id')
      .eq('referrer_id', user.workspaceId)
      .eq('referrer_type', 'buyer')
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({
      ...stats,
      referrals: (referrals || []).map((r) => ({
        id: r.id,
        status: r.status,
        milestonesAchieved: (r.milestones_achieved as string[]) || [],
        createdAt: r.created_at,
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
