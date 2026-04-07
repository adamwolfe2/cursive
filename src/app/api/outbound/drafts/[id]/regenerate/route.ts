/**
 * POST /api/outbound/drafts/[id]/regenerate
 *
 * Re-runs `generateSalesEmail()` on the lead, replacing the draft's subject
 * and body in place. Keeps `status='pending_approval'`. Honors optional
 * `instructions` from the user (e.g. "Make it shorter").
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
import { generateSalesEmail } from '@/lib/services/ai/claude.service'

const bodySchema = z.object({
  instructions: z.string().max(1000).optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { instructions } = bodySchema.parse(body)

    // Verify ownership
    const supabase = await createClient()
    const { data: send } = await supabase
      .from('email_sends')
      .select('id, status, workspace_id, lead_id, campaign_id')
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (!send) throw new NotFoundError('Draft not found')
    if (send.status !== 'pending_approval') {
      throw new ApiError('Draft cannot be regenerated in its current state', 409)
    }

    const admin = createAdminClient()

    // Load lead, agent (via campaign), workspace
    const [
      { data: lead },
      { data: campaign },
      { data: workspace },
    ] = await Promise.all([
      admin.from('leads').select('*').eq('id', send.lead_id).maybeSingle(),
      admin.from('email_campaigns').select('agent_id').eq('id', send.campaign_id).maybeSingle(),
      admin.from('workspaces').select('name, sales_co_settings').eq('id', send.workspace_id).maybeSingle(),
    ])

    if (!lead || !campaign?.agent_id) {
      throw new Error('Lead or campaign agent not found')
    }

    const { data: agent } = await admin
      .from('agents')
      .select('id, name, tone, icp_text, persona_text, product_text')
      .eq('id', campaign.agent_id)
      .maybeSingle()

    const tone = ((agent?.tone as string) || 'professional') as
      | 'professional'
      | 'casual'
      | 'friendly'
      | 'urgent'
    const productText = (agent as any)?.product_text || 'our solution'
    const personaText = (agent as any)?.persona_text || ''
    const senderName = (workspace?.sales_co_settings as any)?.default_sender_name || 'Sales Team'
    const senderCompany = workspace?.name || 'Our Company'

    const draft = await generateSalesEmail({
      senderName,
      senderCompany,
      senderProduct: productText,
      recipientName:
        (lead.full_name as string) ||
        `${lead.first_name || ''} ${lead.last_name || ''}`.trim() ||
        'there',
      recipientTitle: (lead.job_title as string) || 'Decision Maker',
      recipientCompany: (lead.company_name as string) || 'your company',
      recipientIndustry: (lead.company_industry as string) || undefined,
      valueProposition: personaText
        ? `${productText} — built for ${personaText}.`
        : productText,
      callToAction: instructions
        ? `${instructions} End with: Open to a quick 15-minute call next week to share more?`
        : 'Open to a quick 15-minute call next week to share more?',
      tone,
    })

    const bodyHtml = draft.body
      .split('\n\n')
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('\n')

    const { data: updated, error } = await admin
      .from('email_sends')
      .update({
        subject: draft.subject,
        body_text: draft.body,
        body_html: bodyHtml,
      })
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
