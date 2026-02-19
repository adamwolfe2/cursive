export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { SdrInboxRepository } from '@/lib/repositories/sdr-inbox.repository'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const draft_status = searchParams.get('draft_status') || undefined
    const workspace_id = searchParams.get('workspace_id') || undefined
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 100
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined

    const repo = new SdrInboxRepository()
    const [replies, counts] = await Promise.all([
      repo.findAll({ draft_status, workspace_id, limit, offset }),
      repo.countByDraftStatus(),
    ])

    return NextResponse.json({ replies, counts })
  } catch (error) {
    safeError('[SDR Inbox GET]', error)
    const isAuthError = error instanceof Error && error.message.includes('Unauthorized')
    return NextResponse.json(
      { error: isAuthError ? 'Unauthorized' : 'Internal server error' },
      { status: isAuthError ? 401 : 500 }
    )
  }
}
