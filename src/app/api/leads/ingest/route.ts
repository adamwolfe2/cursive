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

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createMatchingEngine } from '@/lib/services/matching-engine.service'
import { createUserLeadRouter } from '@/lib/services/user-lead-router.service'
import { createClient } from '@/lib/supabase/server'

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

  // Optional raw data
  raw_data: z.any().optional(),
})

const IngestRequestSchema = z.object({
  // Single lead
  lead: LeadPushSchema.optional(),

  // Batch of leads
  leads: z.array(LeadPushSchema).optional(),

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

    // Handle batch leads
    if (request.leads) {
      for (const leadData of request.leads) {
        try {
          const leadId = await createLeadFromPush(supabase, workspaceId, leadData, request)

          if (request.auto_route) {
            const routing = await routeLeadToAll(leadId)
            results.push({
              leadId,
              matched: routing.matched,
              assignedTo: routing.assignedTo,
            })
          } else {
            results.push({ leadId, matched: false })
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
      try {
        const leadId = await createLeadFromPush(supabase, workspaceId, request.lead, request)

        if (request.auto_route) {
          const routing = await routeLeadToAll(leadId)
          results.push({
            leadId,
            matched: routing.matched,
            assignedTo: routing.assignedTo,
          })
        } else {
          results.push({ leadId, matched: false })
        }
      } catch (err) {
        results.push({
          leadId: '',
          matched: false,
          error: 'Failed to create lead',
        })
      }
    }

    // Update source statistics
    if (request.source_id) {
      await updateSourceStats(supabase, request.source_id, results)
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      matched: results.filter((r) => r.matched).length,
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
): Promise<string> {
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
    .single()

  if (error) {
    safeError('[Lead Ingest] Database error:', error)
    throw new Error('Failed to create lead')
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

  // Inngest disabled (Node.js runtime not available on this deployment)
  // Original: inngest.send({ name: 'lead/created', data: { lead_id: data.id, workspace_id, source } })
  safeError(`[Lead Ingest] Lead ${data.id} created (Inngest event skipped - Edge runtime)`)

  return data.id
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
