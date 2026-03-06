// Marketplace Credits API
// Get current workspace credit balance

import { NextRequest, NextResponse } from 'next/server'
import { fastAuth } from '@/lib/auth/fast-auth'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { MarketplaceRepository } from '@/lib/repositories/marketplace.repository'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(request: NextRequest) {
  try {
    const user = await fastAuth(request)
    if (!user) return unauthorized()

    const repo = new MarketplaceRepository()
    const credits = await repo.getWorkspaceCredits(user.workspaceId)

    return NextResponse.json({
      balance: credits?.balance || 0,
      totalPurchased: credits?.total_purchased || 0,
      totalUsed: credits?.total_used || 0,
      totalEarned: credits?.total_earned || 0,
    })
  } catch (error) {
    safeError('Failed to get credits:', error)
    return handleApiError(error)
  }
}
