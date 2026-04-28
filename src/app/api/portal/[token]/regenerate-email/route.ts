// Per-email regeneration endpoint for the client portal (self-serve loop).
//
// Token-authenticated. The actual flow lives in
// src/lib/services/onboarding/email-regen-runner.ts so the admin endpoint
// can share it (Next.js route files can only export route handlers).

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = createAdminClient()

    // 1. Validate token
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('client_portal_tokens')
      .select('id, client_id, expires_at, revoked')
      .eq('token', token)
      .maybeSingle()

    if (tokenError || !tokenRecord) {
      return NextResponse.json({ error: 'Invalid portal link' }, { status: 404 })
    }
    if (tokenRecord.revoked) {
      return NextResponse.json({ error: 'This portal link has been revoked' }, { status: 403 })
    }
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This portal link has expired' }, { status: 403 })
    }

    // 2. Validate body
    const json = await request.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid request body' },
        { status: 400 }
      )
    }

    return await runRegen({
      supabase,
      clientId: tokenRecord.client_id,
      sequenceIndex: parsed.data.sequence_index,
      emailStep: parsed.data.email_step,
      authorType: 'client',
    })
  } catch (error) {
    safeError('[Portal regenerate-email] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
