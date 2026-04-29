export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/admin'
import { SdrInboxRepository } from '@/lib/repositories/sdr-inbox.repository'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdmin()

    const { searchParams } = new URL(req.url)
    const draft_status = searchParams.get('draft_status') || undefined
    const workspace_id = searchParams.get('workspace_id') || undefined
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '100')), 500)
    const rawOffset = parseInt(searchParams.get('offset') || '0')
    const offset = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset)

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
