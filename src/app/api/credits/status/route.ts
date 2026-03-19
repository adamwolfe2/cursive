// Credits Status API
// Returns current credit status for authenticated user

import { NextRequest, NextResponse } from 'next/server'
import { protectRoute, applyProtectionHeaders, PROTECTION_PRESETS } from '@/lib/middleware/api-protection'
import { CreditService } from '@/lib/services/credit.service'
import { safeError } from '@/lib/utils/log-sanitizer'
import { handleApiError } from '@/lib/utils/api-error-handler'

export async function GET(req: NextRequest) {
  // Protect route with authentication
  const protection = await protectRoute(req, PROTECTION_PRESETS.authenticated)

  if (!protection.success) {
    return protection.response
  }

  const { user } = protection.req

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get credit status
    const credits = await CreditService.getRemainingCredits(user.id)

    // Get usage stats (last 7 days)
    const stats = await CreditService.getUsageStats(user.workspace_id, 7)

    const response = NextResponse.json({
      credits: {
        remaining: credits.remaining,
        limit: credits.limit,
        used: credits.limit - credits.remaining,
        resetAt: credits.resetAt,
        plan: credits.plan,
      },
      usage: stats,
    })

    // Apply rate limit headers
    return applyProtectionHeaders(response, req, PROTECTION_PRESETS.authenticated)
  } catch (error) {
    safeError('[Credits Status] Error:', error)
    return handleApiError(error)
  }
}
