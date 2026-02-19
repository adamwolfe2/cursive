export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin'
import { DncRepository } from '@/lib/repositories/dnc.repository'
import { safeError } from '@/lib/utils/log-sanitizer'

const addSchema = z.object({
  workspace_id: z.string().uuid(),
  emails: z.array(z.string().email()),
  reason: z.string().optional(),
})

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin()
    const repo = new DncRepository()
    const entries = await repo.findAll()
    return NextResponse.json({ entries })
  } catch (error) {
    safeError('[SDR DNC GET]', error)
    const isAuthError = error instanceof Error && error.message.includes('Unauthorized')
    return NextResponse.json(
      { error: isAuthError ? 'Unauthorized' : 'Internal server error' },
      { status: isAuthError ? 401 : 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    const body = await req.json()
    const parsed = addSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const repo = new DncRepository()
    await repo.bulkAdd(
      parsed.data.workspace_id,
      parsed.data.emails,
      parsed.data.reason,
      admin.email
    )

    return NextResponse.json({ added: parsed.data.emails.length })
  } catch (error) {
    safeError('[SDR DNC POST]', error)
    const isAuthError = error instanceof Error && error.message.includes('Unauthorized')
    return NextResponse.json(
      { error: isAuthError ? 'Unauthorized' : 'Internal server error' },
      { status: isAuthError ? 401 : 500 }
    )
  }
}
