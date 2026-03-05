/**
 * GET /api/admin/ops/summary
 * Hub KPIs for Darren's Ops Dashboard
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
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayIso = today.toISOString()
    const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      bookingsTodayRes,
      activeTrialsRes,
      expiringSoonRes,
      activeClientsRes,
      unclaimedDemosRes,
      recentBookingsRes,
      recentSignupsRes,
    ] = await Promise.all([
      adminClient
        .from('cal_bookings')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayIso),
      adminClient
        .from('audiencelab_pixels')
        .select('id', { count: 'exact', head: true })
        .eq('trial_status', 'trial'),
      adminClient
        .from('audiencelab_pixels')
        .select('id', { count: 'exact', head: true })
        .eq('trial_status', 'trial')
        .lte('trial_ends_at', sevenDaysOut),
      adminClient
        .from('audiencelab_pixels')
        .select('id', { count: 'exact', head: true })
        .eq('trial_status', 'active'),
      adminClient
        .from('audiencelab_pixels')
        .select('id', { count: 'exact', head: true })
        .eq('trial_status', 'demo'),
      // Recent bookings for activity feed
      adminClient
        .from('cal_bookings')
        .select('id, attendee_name, attendee_email, start_time, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      // Recent workspace signups for activity feed (with owner email)
      adminClient
        .from('workspaces')
        .select('id, name, created_at, users!inner(email, role)')
        .eq('users.role', 'owner')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    // Build activity feed: mix bookings + signups sorted by time
    const bookingItems = (recentBookingsRes.data || []).map((b) => ({
      type: 'booking' as const,
      id: b.id,
      label: `${b.attendee_name} booked a demo`,
      sub: b.attendee_email,
      time: b.created_at,
      status: b.status,
    }))
    const signupItems = (recentSignupsRes.data || []).map((w: any) => {
      const ownerEmail = Array.isArray(w.users) ? w.users[0]?.email : null
      return {
        type: 'signup' as const,
        id: w.id,
        label: `${w.name} signed up`,
        sub: ownerEmail || null,
        time: w.created_at,
        status: null,
      }
    })
    const activityFeed = [...bookingItems, ...signupItems]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 12)

    return NextResponse.json({
      bookings_today: bookingsTodayRes.count ?? 0,
      active_trials: activeTrialsRes.count ?? 0,
      expiring_soon: expiringSoonRes.count ?? 0,
      active_clients: activeClientsRes.count ?? 0,
      unclaimed_demos: unclaimedDemosRes.count ?? 0,
      activity_feed: activityFeed,
    })
  } catch (error) {
    safeError('[ops/summary] Error:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to load summary' }, { status: 500 })
  }
}
