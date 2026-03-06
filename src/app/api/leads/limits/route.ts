/**
 * Lead Limits API
 * GET /api/leads/limits - Get current workspace lead limits and usage
 */


import { NextRequest, NextResponse } from 'next/server'
import { fastAuth } from '@/lib/auth/fast-auth'
import { getLeadProviderService } from '@/lib/services/lead-provider.service'
import { safeError } from '@/lib/utils/log-sanitizer'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

export async function GET(request: NextRequest) {
  try {
    const user = await fastAuth(request)
    if (!user) {
      return unauthorized()
    }

    const leadProvider = getLeadProviderService()
    const limits = await leadProvider.getWorkspaceLeadLimits(user.workspaceId)

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
  } catch (error) {
    safeError('[Lead Limits] Error:', error)
    return handleApiError(error)
  }
}
