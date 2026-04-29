export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { DncRepository } from '@/lib/repositories/dnc.repository'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const repo = new DncRepository()
    await repo.remove(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('[SDR DNC DELETE]', error)
    const isAuthError = error instanceof Error && error.message.includes('Unauthorized')
    return NextResponse.json(
      { error: isAuthError ? 'Unauthorized' : 'Internal server error' },
      { status: isAuthError ? 401 : 500 }
    )
  }
}
