export const maxDuration = 10

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

const patchSchema = z.object({
  status: z.enum(['open', 'resolved']),
})

async function validateToken(token: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('client_portal_tokens')
    .select('id, client_id, expires_at, revoked')
    .eq('token', token)
    .maybeSingle()

  if (error || !data) return { error: 'Invalid portal link', status: 404 as const }
  if (data.revoked) return { error: 'This portal link has been revoked', status: 403 as const }
  if (new Date(data.expires_at) < new Date()) {
    return { error: 'This portal link has expired', status: 403 as const }
  }
  return { tokenRecord: data, supabase }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; commentId: string }> }
) {
  try {
    const { token, commentId } = await params
    const validated = await validateToken(token)
    if ('error' in validated) {
      return NextResponse.json({ error: validated.error }, { status: validated.status })
    }
    const { tokenRecord, supabase } = validated

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Verify the comment belongs to this client.
    const { data: existing } = await supabase
      .from('client_portal_copy_comments')
      .select('id, client_id')
      .eq('id', commentId)
      .maybeSingle()

    if (!existing || existing.client_id !== tokenRecord.client_id) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const update =
      parsed.data.status === 'resolved'
        ? { status: 'resolved', resolved_by: 'client', resolved_at: now, updated_at: now }
        : { status: 'open', resolved_by: null, resolved_at: null, updated_at: now }

    const { data, error } = await supabase
      .from('client_portal_copy_comments')
      .update(update)
      .eq('id', commentId)
      .select('*')
      .single()

    if (error) {
      safeError('[Portal] Failed to update comment:', error)
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
    }

    return NextResponse.json({ comment: data })
  } catch (err) {
    safeError('[Portal] comment PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
