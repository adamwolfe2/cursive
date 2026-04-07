/**
 * POST /api/outbound/drafts/[id]/reject
 *
 * Marks a draft as rejected and the corresponding campaign_lead as 'paused'
 * (since 'skipped' isn't an allowed campaign_lead status). Discards the draft.
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
import { createAdminClient } from '@/lib/supabase/admin'

const bodySchema = z.object({
  reason: z.string().max(500).optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { reason } = bodySchema.parse(body)

    const supabase = await createClient()
    const { data: send } = await supabase
      .from('email_sends')
      .select('id, status, lead_id, campaign_id')
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (!send) throw new NotFoundError('Draft not found')
    if (send.status !== 'pending_approval') {
      throw new ApiError(`Draft cannot be rejected (status: ${send.status})`, 409)
    }

    const admin = createAdminClient()

    await admin
      .from('email_sends')
      .update({
        status: 'rejected',
        composition_metadata: {
          rejected_at: new Date().toISOString(),
          rejected_by: user.id,
          reject_reason: reason ?? 'manual_discard',
        },
      } as any)
      .eq('id', id)

    // Mark the corresponding campaign_lead as paused so it doesn't re-enter the loop
    await admin
      .from('campaign_leads')
      .update({ status: 'paused' })
      .eq('campaign_id', send.campaign_id)
      .eq('lead_id', send.lead_id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
