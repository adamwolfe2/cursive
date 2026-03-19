/**
 * GET /api/admin/affiliates
 * List all affiliate applications with stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { safeError } from '@/lib/utils/log-sanitizer'
import { z } from 'zod'

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'all'] as const
const statusSchema = z.enum(VALID_STATUSES).default('all')

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin()

    const rawStatus = request.nextUrl.searchParams.get('status') ?? 'all'
    const statusResult = statusSchema.safeParse(rawStatus)
    if (!statusResult.success) {
      return NextResponse.json(
        { error: 'Invalid status filter', valid: VALID_STATUSES },
        { status: 400 }
      )
    }
    const status = statusResult.data
    const admin = createAdminClient()

    let query = admin
      .from('affiliate_applications')
      .select('id, first_name, last_name, email, phone, website, audience_size, audience_types, promotion_plan, status, created_at')
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: applications, error } = await query
    if (error) {
      safeError('[Admin] Affiliates fetch error:', error)
      throw new Error('Failed to fetch affiliate applications')
    }

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
    return NextResponse.json({ error: 'Failed to load affiliates' }, { status: 500 })
  }
}
