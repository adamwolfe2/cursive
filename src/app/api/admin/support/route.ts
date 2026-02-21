export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(request: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const offset = (page - 1) * limit

    const adminSupabase = createAdminClient()
    const { data: messages, count, error } = await adminSupabase
      .from('support_messages')
      .select('id, user_id, workspace_id, subject, message, status, priority, category, admin_notes, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(error.message)
    }

    // Enrich with user email/name from users table
    const userIds = [...new Set((messages || []).map(m => m.user_id).filter(Boolean))]
    let userMap: Record<string, { email: string; full_name?: string }> = {}
    if (userIds.length > 0) {
      const { data: users } = await adminSupabase
        .from('users')
        .select('auth_user_id, email, full_name')
        .in('auth_user_id', userIds)
      for (const u of (users || [])) {
        userMap[u.auth_user_id] = { email: u.email || '', full_name: u.full_name }
      }
    }

    const enriched = (messages || []).map(m => ({
      ...m,
      name: userMap[m.user_id]?.full_name || userMap[m.user_id]?.email?.split('@')[0] || 'Unknown',
      email: userMap[m.user_id]?.email || '',
      source: m.category || 'contact',
      admin_notes: m.admin_notes ?? null,
    }))

    return NextResponse.json({
      messages: enriched,
      pagination: { page, limit, total: count ?? 0, has_more: offset + limit < (count ?? 0) },
    })
  } catch (error) {
    safeError('[Admin] Support messages fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support messages' },
      { status: 500 }
    )
  }
}
