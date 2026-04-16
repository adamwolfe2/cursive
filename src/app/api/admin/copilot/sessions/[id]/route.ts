/**
 * GET    /api/admin/copilot/sessions/[id] — full message history for a session.
 * DELETE /api/admin/copilot/sessions/[id] — soft-nothing; hard delete cascade via FK.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserWithRole } from '@/lib/auth/roles'
import { loadSession, deleteSession } from '@/lib/copilot/sessions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function resolveAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401, message: 'Unauthorized' }

  const userWithRole = await getUserWithRole(user)
  if (!userWithRole || !['owner', 'admin'].includes(userWithRole.role)) {
    return { ok: false as const, status: 403, message: 'Forbidden' }
  }
  return { ok: true as const, userId: userWithRole.id }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await resolveAdmin()
  if (!auth.ok) return new NextResponse(auth.message, { status: auth.status })
  const { id } = await params

  const data = await loadSession(id, auth.userId)
  if (!data) return new NextResponse('Not found', { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await resolveAdmin()
  if (!auth.ok) return new NextResponse(auth.message, { status: auth.status })
  const { id } = await params

  const ok = await deleteSession(id, auth.userId)
  if (!ok) return new NextResponse('Delete failed', { status: 500 })
  return NextResponse.json({ ok: true })
}
