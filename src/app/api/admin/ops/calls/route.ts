/**
 * GET /api/admin/ops/calls
 * Full Cal.com booking log with workspace match
 *
 * PATCH /api/admin/ops/calls
 * Update booking status (no_show, completed)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    await requireAdminRole()

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = 50
    const offset = (page - 1) * limit

    const adminClient = createAdminClient()

    let query = adminClient
      .from('cal_bookings')
      .select('id, booking_uid, attendee_name, attendee_email, start_time, end_time, status, workspace_id, notes, created_at', { count: 'exact' })
      .order('start_time', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data: bookings, count, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      safeError('[ops/calls] DB error:', error)
      return NextResponse.json({ error: 'Failed to load calls' }, { status: 500 })
    }

    // Check which attendees have signed up: match email → users → workspace
    const emails = [...new Set((bookings || []).map((b) => b.attendee_email).filter(Boolean))]
    // email → { workspace_id, workspace_name }
    const emailToWorkspace = new Map<string, { workspace_id: string; workspace_name: string | null }>()

    if (emails.length > 0) {
      const { data: users } = await adminClient
        .from('users')
        .select('email, workspace_id')
        .in('email', emails)

      const workspaceIds = [...new Set((users || []).map((u) => u.workspace_id).filter(Boolean))]

      let workspaceNames = new Map<string, string>()
      if (workspaceIds.length > 0) {
        const { data: workspaces } = await adminClient
          .from('workspaces')
          .select('id, name')
          .in('id', workspaceIds)
        for (const w of workspaces || []) {
          workspaceNames.set(w.id, w.name)
        }
      }

      for (const u of users || []) {
        if (u.email && u.workspace_id) {
          emailToWorkspace.set(u.email, {
            workspace_id: u.workspace_id,
            workspace_name: workspaceNames.get(u.workspace_id) ?? null,
          })
        }
      }
    }

    const enrichedBookings = (bookings || []).map((b) => {
      const ws = emailToWorkspace.get(b.attendee_email)
      return {
        ...b,
        signed_up: !!ws,
        workspace_id: ws?.workspace_id ?? b.workspace_id ?? null,
        workspace_name: ws?.workspace_name ?? null,
      }
    })

    // Stats
    const total = count ?? 0
    const upcoming = enrichedBookings.filter((b) => b.status === 'upcoming').length
    const completed = enrichedBookings.filter((b) => b.status === 'completed').length
    const cancelled = enrichedBookings.filter((b) => b.status === 'cancelled').length
    const signedUp = enrichedBookings.filter((b) => b.signed_up).length
    const conversionRate = total > 0 ? Math.round((signedUp / total) * 100) : 0

    return NextResponse.json({
      bookings: enrichedBookings,
      stats: { total, upcoming, completed, cancelled, signed_up: signedUp, conversion_rate: conversionRate },
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    safeError('[ops/calls] Error:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to load calls' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminRole()

    const { booking_uid, status } = await request.json() as { booking_uid: string; status: string }

    const VALID_STATUSES = ['upcoming', 'completed', 'cancelled', 'no_show']
    if (!booking_uid || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid booking_uid or status' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('cal_bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('booking_uid', booking_uid)

    if (error) {
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    safeError('[ops/calls PATCH] Error:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}
