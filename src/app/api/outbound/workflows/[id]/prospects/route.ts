/**
 * GET /api/outbound/workflows/[id]/prospects
 *
 * Returns the prospects (campaign_leads joined to leads) for this workflow's
 * synthetic campaign. Powers the right-side ProspectsList table.
 *
 * Query params:
 *   ?stage=…    optional filter by status (pending|enriching|ready|awaiting_approval|in_sequence|replied|positive|negative|completed|skipped)
 *   ?limit=…    default 50, max 200
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
import type { OutboundProspect } from '@/types/outbound'

const querySchema = z.object({
  stage: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

const agentRepo = new AgentRepository()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const { stage, limit } = querySchema.parse({
      stage: searchParams.get('stage') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    })

    const agent = await agentRepo.findOutboundById(id, user.workspace_id)
    if (!agent) throw new NotFoundError('Workflow not found')
    if (!agent.outbound_campaign_id) {
      return NextResponse.json({ data: [] })
    }

    const supabase = await createClient()
    let query = supabase
      .from('campaign_leads')
      .select(`
        id,
        campaign_id,
        lead_id,
        status,
        current_step,
        enriched_at,
        last_email_sent_at,
        leads:lead_id (
          id,
          first_name,
          last_name,
          full_name,
          email,
          job_title,
          company_name,
          company_domain
        )
      `)
      .eq('campaign_id', agent.outbound_campaign_id)
      .order('enriched_at', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (stage) {
      query = query.eq('status', stage)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const prospects: OutboundProspect[] = (data ?? []).map((row: any) => ({
      id: row.id,
      campaign_id: row.campaign_id,
      lead_id: row.lead_id,
      status: row.status,
      current_step: row.current_step,
      enriched_at: row.enriched_at,
      last_email_sent_at: row.last_email_sent_at,
      lead_first_name: row.leads?.first_name ?? null,
      lead_last_name: row.leads?.last_name ?? null,
      lead_full_name: row.leads?.full_name ?? null,
      lead_email: row.leads?.email ?? null,
      lead_job_title: row.leads?.job_title ?? null,
      lead_company_name: row.leads?.company_name ?? null,
      display_stage: deriveDisplayStage(row.status),
    }))

    return NextResponse.json({ data: prospects })
  } catch (error) {
    return handleApiError(error)
  }
}

function deriveDisplayStage(status: string): OutboundProspect['display_stage'] {
  switch (status) {
    case 'pending':
    case 'enriching':
      return 'enriching'
    case 'ready':
    case 'awaiting_approval':
      return 'drafting'
    case 'in_sequence':
      return 'engaging'
    case 'replied':
    case 'negative':
      return 'replying'
    case 'positive':
    case 'completed':
      return 'booked'
    case 'unsubscribed':
    case 'bounced':
    case 'paused':
      return 'skipped'
    default:
      return 'enriching'
  }
}
