// Admin endpoint: assign (or clear) the EmailBison workspace for an onboarding client.
// This sets onboarding_clients.eb_workspace_id, which routes the EB campaign push
// to the correct EB workspace.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePlatformAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { getErrorMessage } from '@/lib/utils/error-helpers'

const bodySchema = z.object({
  eb_workspace_id: z.number().int().positive().nullable(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePlatformAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: clientId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'eb_workspace_id must be a positive integer or null', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('onboarding_clients')
      .update({
        eb_workspace_id: parsed.data.eb_workspace_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
