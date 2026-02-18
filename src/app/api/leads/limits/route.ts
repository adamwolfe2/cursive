/**
 * Lead Limits API
 * GET /api/leads/limits - Get current workspace lead limits and usage
 */


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { getLeadProviderService } from '@/lib/services/lead-provider.service'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const leadProvider = getLeadProviderService()
    const limits = await leadProvider.getWorkspaceLeadLimits(user.workspace_id)

    return NextResponse.json({
      success: true,
      limits: {
        tier: limits.tierName,
        daily: {
          limit: limits.dailyLimit,
          used: limits.dailyUsed,
          remaining: limits.dailyRemaining,
        },
        monthly: limits.monthlyLimit
          ? {
              limit: limits.monthlyLimit,
              used: limits.monthlyUsed,
              remaining: limits.monthlyRemaining,
            }
          : null,
        canFetch: limits.canFetch,
      },
    })
  } catch (error: any) {
    safeError('[Lead Limits] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get lead limits' },
      { status: 500 }
    )
  }
}
