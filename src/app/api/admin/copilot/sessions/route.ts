/**
 * GET /api/admin/copilot/sessions — list current admin's chat sessions (most recent first).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserWithRole } from '@/lib/auth/roles'
import { listSessions } from '@/lib/copilot/sessions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const userWithRole = await getUserWithRole(user)
  if (!userWithRole || !['owner', 'admin'].includes(userWithRole.role)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const sessions = await listSessions(userWithRole.id, 50)
  return NextResponse.json({ sessions })
}
