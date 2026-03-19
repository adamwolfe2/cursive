// Partner Dashboard API Route
// Returns dashboard statistics for the authenticated partner

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { getPartnerDashboardStats } from '@/lib/auth/partner'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(_request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is linked to a partner
    if (!user.linked_partner_id) {
      return NextResponse.json(
        { error: 'Not a partner account' },
        { status: 403 }
      )
    }

    // Get dashboard stats
    const stats = await getPartnerDashboardStats(user.linked_partner_id)

    if (!stats) {
      safeError('[Partner Dashboard] No stats returned for partner:', { partnerId: user.linked_partner_id })
      return NextResponse.json(
        { error: 'Failed to fetch dashboard data' },
        { status: 500 }
      )
    }

    return NextResponse.json(stats)
  } catch (error) {
    safeError('[Partner Dashboard] Error fetching dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
