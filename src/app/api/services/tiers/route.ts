import { NextRequest, NextResponse } from 'next/server'
import { serviceTierRepository } from '@/lib/repositories/service-tier.repository'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/roles'

/**
 * GET /api/services/tiers
 * List all available service tiers (public only for non-admin users)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    // Check if user is admin
    let showAllTiers = false
    if (session?.user) {
      showAllTiers = await isAdmin(session.user)
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
    console.error('[API] Error fetching service tiers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service tiers' },
      { status: 500 }
    )
  }
}
