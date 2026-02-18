
import { NextRequest, NextResponse } from 'next/server'
import { serviceTierRepository } from '@/lib/repositories/service-tier.repository'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/roles'
import { safeError } from '@/lib/utils/log-sanitizer'

/**
 * GET /api/services/tiers
 * List all available service tiers (public only for non-admin users)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check if user is admin
    let showAllTiers = false
    if (user) {
      showAllTiers = await isAdmin(user)
    }

    // Get tiers based on user role
    const tiers = showAllTiers
      ? await serviceTierRepository.getAllTiers()
      : await serviceTierRepository.getAllPublicTiers()

    return NextResponse.json({
      tiers,
      count: tiers.length
    })
  } catch (error) {
    safeError('[API] Error fetching service tiers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service tiers' },
      { status: 500 }
    )
  }
}
