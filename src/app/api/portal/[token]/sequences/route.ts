// Portal inline-edit endpoint for draft email sequences.
//
// PATCH /api/portal/[token]/sequences
// Body: { sequence_index, email_step, field, value, expected_updated_at }
//
// Same shape as the admin route; auth is the portal token (no admin session).
// The shared service handles lock + concurrency + audit identically.
//
// Token validation:
//   - token must exist in client_portal_tokens
//   - token must not be revoked
//   - token must not be expired
// On any of those: 404 / 403 (don't leak which one).

export const maxDuration = 15

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { saveSequenceEdit } from '@/lib/services/onboarding/sequence-edit.service'
import { safeError } from '@/lib/utils/log-sanitizer'

const bodySchema = z.object({
  sequence_index: z.number().int().min(0).max(50),
  email_step: z.number().int().min(1).max(20),
  field: z.enum(['subject_line', 'body']),
  value: z.string().max(5000),
  expected_updated_at: z.string().min(1),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = createAdminClient()

    // Validate the portal token.
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('client_portal_tokens')
      .select('id, client_id, expires_at, revoked')
      .eq('token', token)
      .maybeSingle()

    if (tokenError || !tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid portal link' },
        { status: 404 }
      )
    }
    if (tokenRecord.revoked) {
      return NextResponse.json(
        { error: 'This portal link has been revoked' },
        { status: 403 }
      )
    }
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This portal link has expired' },
        { status: 403 }
      )
    }

    let raw: unknown
    try {
      raw = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const result = await saveSequenceEdit({
      clientId: tokenRecord.client_id,
      sequenceIndex: parsed.data.sequence_index,
      emailStep: parsed.data.email_step,
      field: parsed.data.field,
      value: parsed.data.value,
      expectedUpdatedAt: parsed.data.expected_updated_at,
      actor: 'client',
      actorTokenId: tokenRecord.id,
    })

    if (result.ok) {
      return NextResponse.json({
        ok: true,
        updated_at: result.updated_at,
        warnings: result.warnings,
      })
    }

    const statusByKind = {
      locked: 423,
      conflict: 409,
      not_found: 404,
      invalid_position: 400,
      invalid_field: 400,
      invalid_value: 400,
      server_error: 500,
    } as const
    return NextResponse.json(
      {
        ok: false,
        error: result.message,
        status: result.status,
        current_updated_at: result.current_updated_at,
        current_draft_sequences: result.current_draft_sequences,
      },
      { status: statusByKind[result.status] }
    )
  } catch (err) {
    safeError('[portal sequences PATCH] unexpected error', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
