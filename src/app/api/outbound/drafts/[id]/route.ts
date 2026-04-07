/**
 * PATCH /api/outbound/drafts/[id]
 *
 * Inline edit subject + body for a draft. Only allowed while the draft is in
 * `pending_approval` status. Workspace ownership enforced via the join to
 * email_campaigns.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import {
  handleApiError,
  unauthorized,
  NotFoundError,
  ApiError,
} from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  subject: z.string().min(1).max(500).optional(),
  body_text: z.string().min(1).max(20000).optional(),
  body_html: z.string().min(1).max(50000).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const { id } = await params
    const body = await request.json()
    const parsed = bodySchema.parse(body)

    const supabase = await createClient()

    // Verify the draft exists and belongs to this workspace + is editable
    const { data: existing } = await supabase
      .from('email_sends')
      .select('id, status, workspace_id, body_text, body_html')
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (!existing) throw new NotFoundError('Draft not found')
    if (existing.status !== 'pending_approval') {
      throw new ApiError('Draft is no longer editable', 409)
    }

    // Auto-derive body_html from body_text if only text is provided
    const bodyText: string | null = parsed.body_text ?? existing.body_text ?? null
    const bodyHtml: string | null =
      parsed.body_html ??
      (parsed.body_text && bodyText
        ? bodyText
            .split('\n\n')
            .map((p: string) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
            .join('\n')
        : existing.body_html ?? null)

    const update: Record<string, unknown> = {}
    if (parsed.subject) update.subject = parsed.subject
    if (parsed.body_text) update.body_text = parsed.body_text
    if (bodyHtml) update.body_html = bodyHtml

    const { data: updated, error } = await supabase
      .from('email_sends')
      .update(update)
      .eq('id', id)
      .eq('status', 'pending_approval')
      .select('*')
      .maybeSingle()

    if (error) throw new Error(error.message)
    return NextResponse.json({ data: updated })
  } catch (error) {
    return handleApiError(error)
  }
}
