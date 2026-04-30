/**
 * POST /api/outbound/drafts/[id]/approve
 *
 * Mark a draft as approved → fires `campaign/email-approved` Inngest event,
 * which the existing `onEmailApproved` handler picks up to trigger the send
 * pipeline. Zero new send code.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import {
  handleApiError,
  unauthorized,
  NotFoundError,
  ApiError,
} from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/inngest/client'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const { id } = await params

    // Use the user-scoped client first to verify ownership
    const supabase = await createClient()
    const { data: existing } = await supabase
      .from('email_sends')
      .select('id, status, workspace_id, campaign_id, lead_id')
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (!existing) throw new NotFoundError('Draft not found')
    if (existing.status !== 'pending_approval') {
      throw new ApiError(`Draft cannot be approved (status: ${existing.status})`, 409)
    }

    // Update via admin client so we can also write composition_metadata + approved_*
    const admin = createAdminClient()
    const { error: updateError } = await admin
      .from('email_sends')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      } as any)
      .eq('id', id)
      .eq('status', 'pending_approval')

    if (updateError) throw new Error(updateError.message)

    // Find the campaign_lead so onEmailApproved can update its status
    const { data: campaignLead } = await admin
      .from('campaign_leads')
      .select('id')
      .eq('campaign_id', existing.campaign_id)
      .eq('lead_id', existing.lead_id)
      .maybeSingle()

    await inngest.send({
      name: 'campaign/email-approved',
      data: {
        email_send_id: id,
        campaign_lead_id: campaignLead?.id ?? '',
        workspace_id: user.workspace_id,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
