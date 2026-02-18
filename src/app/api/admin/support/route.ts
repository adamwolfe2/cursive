
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET() {
  try {
    // SECURITY: Verify platform admin authorization
    await requireAdmin()

    // Fetch all support messages using admin client
    const adminSupabase = createAdminClient()
    const { data, error } = await adminSupabase
      .from('support_messages')
      .select('id, user_id, workspace_id, subject, message, status, priority, category, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ messages: data })
  } catch (error) {
    safeError('[Admin] Support messages fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support messages' },
      { status: 500 }
    )
  }
}
