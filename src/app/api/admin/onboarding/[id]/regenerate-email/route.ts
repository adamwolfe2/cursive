// Admin counterpart to /api/portal/[token]/regenerate-email.
// Same per-email regen, same isolation guarantees, but admin-authenticated.
// Useful when ops handles client feedback off-platform and wants to apply a
// targeted revision without going through the portal.

export const maxDuration = 90

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { runRegen } from '@/lib/services/onboarding/email-regen-runner'
import { safeError } from '@/lib/utils/log-sanitizer'

const bodySchema = z.object({
  sequence_index: z.number().int().min(0),
  email_step: z.number().int().min(1),
})

async function isAuthorized(request: NextRequest): Promise<boolean> {
  // Admin session OR x-automation-secret header.
  const secret = request.headers.get('x-automation-secret')
  const expected = process.env.AUTOMATION_SECRET
  if (expected && secret === expected) return true
  try {
    const { requireAdmin } = await import('@/lib/auth/admin')
    await requireAdmin()
    return true
  } catch {
    return false
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id: clientId } = await params

    const json = await request.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid request body' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    return await runRegen({
      supabase,
      clientId,
      sequenceIndex: parsed.data.sequence_index,
      emailStep: parsed.data.email_step,
      authorType: 'admin',
    })
  } catch (err) {
    safeError('[Admin regenerate-email] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
