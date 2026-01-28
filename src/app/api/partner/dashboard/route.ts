// Partner Dashboard API Route
// Returns dashboard statistics for the authenticated partner

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { getPartnerDashboardStats } from '@/lib/auth/partner'

export async function GET(request: NextRequest) {
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

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching partner dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
