
import { NextRequest, NextResponse } from 'next/server'
import { serviceTierRepository } from '@/lib/repositories/service-tier.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError } from '@/lib/utils/api-error-handler'

/**
 * GET /api/services/tiers
 * List all available service tiers (public only for non-admin users)
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser()

    // Check if user is admin (owner or admin role)
    const showAllTiers = user?.role === 'owner' || user?.role === 'admin'

    // Get tiers based on user role
    const tiers = showAllTiers
      ? await serviceTierRepository.getAllTiers()
      : await serviceTierRepository.getAllPublicTiers()

    return NextResponse.json({
      tiers,
      count: tiers.length
    })
  } catch (error) {
    return handleApiError(error)
  }
}
