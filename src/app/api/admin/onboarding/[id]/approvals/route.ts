export const maxDuration = 10

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('client_portal_approvals')
      .select('step_type, status, notes, updated_at')
      .eq('client_id', id)

    if (error) {
      safeError('[Admin] Failed to load approvals:', error)
      return NextResponse.json({ error: 'Failed to load approvals' }, { status: 500 })
    }

    return NextResponse.json({ approvals: data ?? [] })
  } catch (err) {
    safeError('[Admin] approvals GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
