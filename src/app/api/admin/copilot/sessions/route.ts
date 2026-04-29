/**
 * GET /api/admin/copilot/sessions — list current admin's chat sessions (most recent first).
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { listSessions } from '@/lib/copilot/sessions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  let platformAdmin: { id: string; email: string }
  try {
    platformAdmin = await requireAdmin()
  } catch {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const sessions = await listSessions(platformAdmin.id, 50)
  return NextResponse.json({ sessions })
}
