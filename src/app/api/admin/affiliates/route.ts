/**
 * GET /api/admin/affiliates
 * List all affiliate applications with stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminRole()

    const status = request.nextUrl.searchParams.get('status')
    const admin = createAdminClient()

    // Fetch applications
    let query = admin
      .from('affiliate_applications')
      .select('id, first_name, last_name, email, audience_size, audience_types, status, created_at')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: applications, error } = await query

    if (error) throw new Error(error.message)

    // Stats
    const [allApps, affiliatesRes] = await Promise.all([
      admin.from('affiliate_applications').select('status'),
      admin.from('affiliates').select('id, total_activations, status'),
    ])

    const allAppsData = allApps.data || []
    const affiliatesData = affiliatesRes.data || []

    const stats = {
      total_applications: allAppsData.length,
      pending: allAppsData.filter((a) => a.status === 'pending').length,
      approved: allAppsData.filter((a) => a.status === 'approved').length,
      rejected: allAppsData.filter((a) => a.status === 'rejected').length,
      active_affiliates: affiliatesData.filter((a) => a.status === 'active').length,
      total_activations: affiliatesData.reduce((sum, a) => sum + (a.total_activations || 0), 0),
    }

    return NextResponse.json({ applications: applications || [], stats })
  } catch (error) {
    safeError('[admin/affiliates] Error:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to load affiliates' }, { status: 500 })
  }
}
