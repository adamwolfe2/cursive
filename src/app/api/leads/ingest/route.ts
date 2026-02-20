/**
 * Lead Ingestion API
 *
 * POST /api/leads/ingest
 *
 * Accepts leads from:
 * - Manual API pushes
 * - External integrations
 * - AudienceLab webhooks (via dedicated webhook routes)
 *
 * Automatically enriches and routes leads to matching clients.
 */


import { NextRequest, NextResponse } from 'next/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { inngest } from '@/inngest/client'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createMatchingEngine } from '@/lib/services/matching-engine.service'
import { createUserLeadRouter } from '@/lib/services/user-lead-router.service'
import { createClient } from '@/lib/supabase/server'
import { logDedupRejections } from '@/lib/services/deduplication.service'

// Schema for direct lead push
const LeadPushSchema = z.object({
  // Contact
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  full_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  linkedin_url: z.string().url().optional(),

  // Company
  company_name: z.string().optional(),
  job_title: z.string().optional(),
  company_domain: z.string().optional(),
  sic_code: z.string().optional(),
  sic_description: z.string().optional(),

  // Location
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),

  // Source tracking
  source: z.string().optional(),
  source_id: z.string().uuid().optional(),

  // Optional raw data (must be an object, not arbitrary primitives/arrays)
  raw_data: z.record(z.unknown()).optional(),
})

const IngestRequestSchema = z.object({
  // Single lead
  lead: LeadPushSchema.optional(),

  // Batch of leads (max 100 per request to prevent abuse)
  leads: z.array(LeadPushSchema).max(100, 'Maximum 100 leads per batch').optional(),

  // Source tracking
  source_type: z.enum(['api', 'webhook', 'manual']).optional(),
  source_id: z.string().uuid().optional(),
  source_name: z.string().optional(),

  // Routing options
  auto_route: z.boolean().default(true),
})

type IngestRequest = z.infer<typeof IngestRequestSchema>

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = IngestRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const request = parsed.data
    const workspaceId = user.workspace_id
    const results: Array<{
      leadId: string
      matched: boolean
      assignedTo?: string[]
      error?: string
      deduplicated?: boolean
    }> = []

    const supabase = await createClient()
    const matchingEngine = createMatchingEngine(workspaceId)
    const userLeadRouter = createUserLeadRouter(workspaceId)

    // Helper to route a lead through both systems
    async function routeLeadToAll(leadId: string) {
      const assignedTo: string[] = []
      let matched = false

      // Route to client profiles (B2B/agency model)
      try {
        const clientRouting = await matchingEngine.routeLead(leadId)
        if (clientRouting.matched) {
          matched = true
          assignedTo.push(...clientRouting.assignments.map((a) => a.clientName))
        }
      } catch (err) {
        safeError('Client routing error:', err)
      }

      // Route to individual users (self-service model)
      try {
        const userRouting = await userLeadRouter.routeLead(leadId)
        if (userRouting.matched) {
          matched = true
          assignedTo.push(...userRouting.assignedTo)
        }
      } catch (err) {
        safeError('User routing error:', err)
      }

      return { matched, assignedTo }
    }

    // Collect all leads for batch dedup logging
    const allLeads = [
      ...(request.leads || []),
      ...(request.lead ? [request.lead] : []),
    ]
    const dedupCandidates = allLeads.map((l) => ({
      email: l.email || null,
      first_name: l.first_name || null,
      last_name: l.last_name || null,
      company_name: l.company_name || null,
    }))
    const dedupIndices = new Set<number>()
    let leadIndex = 0

    // Handle batch leads
    if (request.leads) {
      for (const leadData of request.leads) {
        const currentIndex = leadIndex++
        try {
          const { id: leadId, wasDuplicate } = await createLeadFromPush(supabase, workspaceId, leadData, request)

          if (wasDuplicate) {
            dedupIndices.add(currentIndex)
          }

          if (request.auto_route && !wasDuplicate) {
            const routing = await routeLeadToAll(leadId)
            results.push({
              leadId,
              matched: routing.matched,
              assignedTo: routing.assignedTo,
              deduplicated: false,
            })
          } else {
            results.push({ leadId, matched: false, deduplicated: wasDuplicate })
          }
        } catch (err) {
          results.push({
            leadId: '',
            matched: false,
            error: 'Failed to create lead',
          })
        }
      }
    }

    // Handle single lead
    if (request.lead) {
      const currentIndex = leadIndex++
      try {
        const { id: leadId, wasDuplicate } = await createLeadFromPush(supabase, workspaceId, request.lead, request)

        if (wasDuplicate) {
          dedupIndices.add(currentIndex)
        }

        if (request.auto_route && !wasDuplicate) {
          const routing = await routeLeadToAll(leadId)
          results.push({
            leadId,
            matched: routing.matched,
            assignedTo: routing.assignedTo,
            deduplicated: false,
          })
        } else {
          results.push({ leadId, matched: false, deduplicated: wasDuplicate })
        }
      } catch (err) {
        results.push({
          leadId: '',
          matched: false,
          error: 'Failed to create lead',
        })
      }
    }

    // Log dedup rejections (non-blocking)
    logDedupRejections(workspaceId, 'api_ingest', dedupCandidates, dedupIndices, allLeads.length)

    // Update source statistics
    if (request.source_id) {
      await updateSourceStats(supabase, request.source_id, results)
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      matched: results.filter((r) => r.matched).length,
      deduplicated: results.filter((r) => r.deduplicated).length,
      results,
    })
  } catch (error) {
    safeError('Lead ingestion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Create a lead from API push data
 */
async function createLeadFromPush(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  leadData: z.infer<typeof LeadPushSchema>,
  request: IngestRequest
): Promise<{ id: string; wasDuplicate: boolean }> {
  // Deduplication: check email and name+company within workspace
  if (leadData.email) {
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('email', leadData.email.toLowerCase().trim())
      .maybeSingle()

    if (existing) {
      return { id: existing.id, wasDuplicate: true }
    }
  }

  // Secondary dedup: same first_name + last_name + company_name
  if (leadData.first_name && leadData.last_name && leadData.company_name) {
    const { data: nameMatch } = await supabase
      .from('leads')
      .select('id')
      .eq('workspace_id', workspaceId)
      .ilike('first_name', leadData.first_name.trim())
      .ilike('last_name', leadData.last_name.trim())
      .ilike('company_name', leadData.company_name.trim())
      .maybeSingle()

    if (nameMatch) {
      return { id: nameMatch.id, wasDuplicate: true }
    }
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      workspace_id: workspaceId,
      first_name: leadData.first_name,
      last_name: leadData.last_name,
      full_name: leadData.full_name || `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim() || null,
      email: leadData.email,
      phone: leadData.phone,
      linkedin_url: leadData.linkedin_url,
      company_name: leadData.company_name,
      job_title: leadData.job_title,
      contact_title: leadData.job_title,
      company_domain: leadData.company_domain,
      address: leadData.address,
      city: leadData.city,
      state: leadData.state,
      state_code: leadData.state,
      postal_code: leadData.postal_code,
      country: leadData.country || 'US',
      source: request.source_type || leadData.source || 'api',
      enrichment_status: 'pending',
      delivery_status: 'pending',
    })
    .select('id')
    .maybeSingle()

  if (error) {
    safeError('[Lead Ingest] Database error:', error)
    throw new Error('Failed to create lead')
  }

  if (!data) {
    throw new Error('Failed to create lead: no data returned')
  }

  // Create company association if SIC code provided
  if (leadData.sic_code && leadData.company_name) {
    await supabase.from('lead_companies').insert({
      lead_id: data.id,
      workspace_id: workspaceId,
      company_name: leadData.company_name,
      job_title: leadData.job_title,
      sic_code: leadData.sic_code,
      sic_description: leadData.sic_description,
      is_primary: true,
    })
  }

  inngest.send({
    name: 'lead/created' as const,
    data: { lead_id: data.id, workspace_id: workspaceId, source: request.source_type || leadData.source || 'api' },
  }).catch((err) => safeError('[Lead Ingest] Inngest send failed:', err))

  // Fire outbound webhook: lead.received
  inngest.send({
    name: 'outbound-webhook/deliver' as const,
    data: {
      workspace_id: workspaceId,
      event_type: 'lead.received',
      payload: {
        event: 'lead.received',
        timestamp: new Date().toISOString(),
        lead: {
          id: data.id,
          first_name: leadData.first_name,
          last_name: leadData.last_name,
          email: leadData.email,
          phone: leadData.phone,
          company_name: leadData.company_name,
          source: request.source_type || leadData.source || 'api',
        },
      },
    },
  }).catch((err) => safeError('[Lead Ingest] Outbound webhook send failed:', err))

  return { id: data.id, wasDuplicate: false }
}

/**
 * Update source statistics
 */
async function updateSourceStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sourceId: string,
  results: Array<{ matched: boolean }>
) {
  const matched = results.filter((r) => r.matched).length
  const unroutable = results.filter((r) => !r.matched).length

  await supabase.rpc('update_source_stats', {
    p_source_id: sourceId,
    p_received: results.length,
    p_matched: matched,
    p_unroutable: unroutable,
  })
}
