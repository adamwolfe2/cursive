/**
 * GET /api/admin/ops/pipeline
 * Kanban pipeline data — all managed workspaces + pre-signup prospects
 */

import { NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export const runtime = 'edge'

export async function GET() {
  try {
    await requireAdminRole()

    const adminClient = createAdminClient()

    const [workspacesRes, prospectBookingsRes] = await Promise.all([
      // All workspaces with pixel + owner + leads this week
      adminClient
        .from('workspaces')
        .select(`
          id,
          name,
          industry_vertical,
          ops_stage,
          website_url,
          created_at,
          users!inner (
            email,
            full_name,
            role
          ),
          audiencelab_pixels (
            pixel_id,
            trial_status,
            trial_ends_at,
            is_active
          )
        `)
        .eq('users.role', 'owner')
        .order('created_at', { ascending: false })
        .limit(200),

      // Bookings with no matching workspace (pre-signup prospects)
      adminClient
        .from('cal_bookings')
        .select('id, booking_uid, attendee_name, attendee_email, start_time, end_time, status, created_at')
        .is('workspace_id', null)
        .in('status', ['upcoming', 'completed'])
        .order('start_time', { ascending: false })
        .limit(50),
    ])

    // Get lead counts this week for each workspace
    const workspaceIds = (workspacesRes.data || []).map((w) => w.id)
    let leadCounts: Record<string, number> = {}
    if (workspaceIds.length > 0) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: leadsData } = await adminClient
        .from('leads')
        .select('workspace_id')
        .in('workspace_id', workspaceIds)
        .gte('created_at', sevenDaysAgo)

      for (const lead of leadsData || []) {
        leadCounts[lead.workspace_id] = (leadCounts[lead.workspace_id] || 0) + 1
      }
    }

    const workspaces = (workspacesRes.data || []).map((w: any) => {
      const pixel = Array.isArray(w.audiencelab_pixels) ? w.audiencelab_pixels[0] : null
      const owner = Array.isArray(w.users) ? w.users[0] : null

      // Determine trial_days_remaining
      let trialDaysRemaining: number | null = null
      if (pixel?.trial_ends_at) {
        const ms = new Date(pixel.trial_ends_at).getTime() - Date.now()
        trialDaysRemaining = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
      }

      // Override ops_stage to 'at_risk' if trial expiring in ≤3 days
      let effectiveStage = w.ops_stage || 'new'
      if (pixel?.trial_status === 'trial' && trialDaysRemaining !== null && trialDaysRemaining <= 3) {
        effectiveStage = 'at_risk'
      }

      return {
        id: w.id,
        name: w.name,
        industry_vertical: w.industry_vertical,
        ops_stage: effectiveStage,
        website_url: w.website_url,
        created_at: w.created_at,
        owner_email: owner?.email || null,
        owner_name: owner?.full_name || null,
        pixel_status: pixel?.is_active ? 'live' : pixel ? 'inactive' : 'none',
        trial_status: pixel?.trial_status || null,
        trial_days_remaining: trialDaysRemaining,
        leads_this_week: leadCounts[w.id] || 0,
      }
    })

    return NextResponse.json({
      workspaces,
      prospects: prospectBookingsRes.data || [],
    })
  } catch (error) {
    safeError('[ops/pipeline] Error:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to load pipeline' }, { status: 500 })
  }
}
