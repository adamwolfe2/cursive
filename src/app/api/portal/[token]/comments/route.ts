export const maxDuration = 10

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { sendSlackAlert } from '@/lib/monitoring/alerts'

const postSchema = z.object({
  sequence_index: z.number().int().min(0).max(100),
  email_step: z.number().int().min(0).max(100),
  body: z.string().min(1).max(4000),
  quoted_text: z.string().max(1000).optional().nullable(),
  parent_comment_id: z.string().uuid().optional().nullable(),
  author_name: z.string().max(200).optional().nullable(),
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const validated = await validateToken(token)
    if ('error' in validated) {
      return NextResponse.json({ error: validated.error }, { status: validated.status })
    }
    const { tokenRecord, supabase } = validated

    const { data, error } = await supabase
      .from('client_portal_copy_comments')
      .select('*')
      .eq('client_id', tokenRecord.client_id)
      .order('created_at', { ascending: true })

    if (error) {
      safeError('[Portal] Failed to load comments:', error)
      return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 })
    }

    return NextResponse.json({ comments: data ?? [] })
  } catch (err) {
    safeError('[Portal] comments GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const validated = await validateToken(token)
    if ('error' in validated) {
      return NextResponse.json({ error: validated.error }, { status: validated.status })
    }
    const { tokenRecord, supabase } = validated

    const body = await req.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const input = parsed.data

    // If replying, verify parent belongs to this client to prevent cross-client writes.
    if (input.parent_comment_id) {
      const { data: parent } = await supabase
        .from('client_portal_copy_comments')
        .select('client_id')
        .eq('id', input.parent_comment_id)
        .maybeSingle()
      if (!parent || parent.client_id !== tokenRecord.client_id) {
        return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('client_portal_copy_comments')
      .insert({
        client_id: tokenRecord.client_id,
        token_id: tokenRecord.id,
        sequence_index: input.sequence_index,
        email_step: input.email_step,
        parent_comment_id: input.parent_comment_id ?? null,
        author_type: 'client',
        author_name: input.author_name ?? null,
        body: input.body.trim(),
        quoted_text: input.quoted_text?.trim() || null,
      })
      .select('*')
      .single()

    if (error) {
      safeError('[Portal] Failed to insert comment:', error)
      return NextResponse.json({ error: 'Failed to save comment' }, { status: 500 })
    }

    // Ping Slack so admin knows the client left feedback (fire-and-forget).
    try {
      const { data: clientMeta } = await supabase
        .from('onboarding_clients')
        .select('company_name')
        .eq('id', tokenRecord.client_id)
        .maybeSingle()
      const companyName = clientMeta?.company_name ?? 'Unknown client'
      const isReply = !!input.parent_comment_id
      const preview = input.body.length > 240 ? input.body.slice(0, 240) + '…' : input.body

      await sendSlackAlert({
        type: 'dfy_onboarding_complete',
        severity: 'warning',
        message: `${companyName} ${isReply ? 'replied on' : 'commented on'} Sequence ${input.sequence_index + 1}, Email ${input.email_step} — "${preview}"`,
        metadata: {
          company: companyName,
          client_id: tokenRecord.client_id,
          sequence_index: input.sequence_index,
          email_step: input.email_step,
          is_reply: isReply,
          quoted_text: input.quoted_text ?? null,
        },
      })
    } catch (err) {
      safeError('[Portal] Slack alert for comment failed:', err)
      // Non-fatal — the comment is saved.
    }

    return NextResponse.json({ comment: data })
  } catch (err) {
    safeError('[Portal] comments POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
