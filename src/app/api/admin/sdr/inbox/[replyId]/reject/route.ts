export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin'
import { SdrInboxRepository } from '@/lib/repositories/sdr-inbox.repository'
import { safeError } from '@/lib/utils/log-sanitizer'

const bodySchema = z.object({
  notes: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ replyId: string }> }
) {
  try {
    await requireAdmin()
    const { replyId } = await params

    const json = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(json)

    const repo = new SdrInboxRepository()
    await repo.updateDraftStatus(replyId, {
      draft_status: 'rejected',
      status: 'reviewed',
      ...(parsed.success && parsed.data.notes ? { admin_notes: parsed.data.notes } : {}),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('[SDR Reject POST]', error)
    const isAuthError = error instanceof Error && error.message.includes('Unauthorized')
    return NextResponse.json(
      { error: isAuthError ? 'Unauthorized' : 'Internal server error' },
      { status: isAuthError ? 401 : 500 }
    )
  }
}
