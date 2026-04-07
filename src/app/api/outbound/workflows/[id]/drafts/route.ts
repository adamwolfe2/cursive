/**
 * GET /api/outbound/workflows/[id]/drafts
 *
 * Lists drafts in `email_sends.status='pending_approval'` for the workflow's
 * synthetic campaign. Optionally filter by lead_id (for the EmailDraftModal).
 *
 * Joined with `leads` to surface name/title/company in the UI.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import {
  handleApiError,
  unauthorized,
  NotFoundError,
} from '@/lib/utils/api-error-handler'
import { AgentRepository } from '@/lib/repositories/agent.repository'
import { createClient } from '@/lib/supabase/server'
import type { OutboundDraft } from '@/types/outbound'

const querySchema = z.object({
  lead_id: z.string().uuid().optional(),
  status: z.enum(['pending_approval', 'approved', 'sent', 'rejected']).default('pending_approval'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

const agentRepo = new AgentRepository()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const { lead_id, status, limit } = querySchema.parse({
      lead_id: searchParams.get('lead_id') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    })

    const agent = await agentRepo.findOutboundById(id, user.workspace_id)
    if (!agent) throw new NotFoundError('Workflow not found')
    if (!agent.outbound_campaign_id) {
      return NextResponse.json({ data: [] })
    }

    const supabase = await createClient()
    let query = supabase
      .from('email_sends')
      .select(`
        id,
        campaign_id,
        workspace_id,
        lead_id,
        recipient_email,
        recipient_name,
        subject,
        body_html,
        body_text,
        status,
        step_number,
        composition_metadata,
        created_at,
        leads:lead_id (
          first_name,
          last_name,
          full_name,
          job_title,
          company_name,
          company_domain
        )
      `)
      .eq('campaign_id', agent.outbound_campaign_id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (lead_id) {
      query = query.eq('lead_id', lead_id)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const drafts: OutboundDraft[] = (data ?? []).map((row: any) => ({
      id: row.id,
      campaign_id: row.campaign_id,
      workspace_id: row.workspace_id,
      lead_id: row.lead_id,
      recipient_email: row.recipient_email,
      recipient_name: row.recipient_name,
      subject: row.subject,
      body_html: row.body_html,
      body_text: row.body_text,
      status: row.status,
      step_number: row.step_number,
      composition_metadata: row.composition_metadata,
      created_at: row.created_at,
      lead_first_name: row.leads?.first_name ?? null,
      lead_last_name: row.leads?.last_name ?? null,
      lead_full_name: row.leads?.full_name ?? null,
      lead_job_title: row.leads?.job_title ?? null,
      lead_company_name: row.leads?.company_name ?? null,
      lead_company_domain: row.leads?.company_domain ?? null,
    }))

    return NextResponse.json({ data: drafts })
  } catch (error) {
    return handleApiError(error)
  }
}
