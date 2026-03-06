// Referrals API
// Get referral stats and manage referral codes


import { NextRequest, NextResponse } from 'next/server'
import { fastAuth } from '@/lib/auth/fast-auth'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import {
  getWorkspaceReferralStats,
  assignWorkspaceReferralCode,
} from '@/lib/services/referral.service'

export async function GET(request: NextRequest) {
  try {
    const user = await fastAuth(request)
    if (!user) return unauthorized()

    const stats = await getWorkspaceReferralStats(user.workspaceId)

    // Generate referral code if not exists
    if (!stats.referralCode) {
      stats.referralCode = await assignWorkspaceReferralCode(user.workspaceId)
    }

    return NextResponse.json(stats)
  } catch (error) {
    return handleApiError(error)
  }
}
