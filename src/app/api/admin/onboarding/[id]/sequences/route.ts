// Admin inline-edit endpoint for draft email sequences.
//
// PATCH /api/admin/onboarding/[id]/sequences
// Body: { sequence_index, email_step, field, value, expected_updated_at }
//
// Delegates lock + optimistic concurrency + audit to the shared
// saveSequenceEdit service. Status-code mapping:
//   - 200: { ok:true, draft_sequences, updated_at, warnings }
//   - 401: not an admin
//   - 400: validation error / invalid position / invalid field
//   - 409: another writer beat us; current_updated_at returned for reload
//   - 423: campaign already deployed OR regeneration in progress (locked)
//   - 500: server error

export const maxDuration = 15

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin'
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin
  try {
    admin = await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: clientId } = await params

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid request',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    )
  }

  try {
    const result = await saveSequenceEdit({
      clientId,
      sequenceIndex: parsed.data.sequence_index,
      emailStep: parsed.data.email_step,
      field: parsed.data.field,
      value: parsed.data.value,
      expectedUpdatedAt: parsed.data.expected_updated_at,
      actor: 'admin',
      actorEmail: admin.email,
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
    safeError('[admin sequences PATCH] unexpected error', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
