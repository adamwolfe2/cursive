/**
 * Clay Webhook Handler
 * Cursive Platform
 *
 * Receives enriched contact/company data from Clay.
 */


import { NextRequest, NextResponse } from 'next/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { createAdminClient } from '@/lib/supabase/admin'
import { hmacSha256Hex, timingSafeEqual } from '@/lib/utils/crypto'

// Types for Clay webhook payload
interface ClayPerson {
  email?: string
  full_name?: string
  first_name?: string
  last_name?: string
  phone?: string
  linkedin_url?: string
  job_title?: string
}

interface ClayCompany {
  name: string
  domain?: string
  industry?: string
  location?: string
  employee_count?: number
  revenue?: string
}

interface ClayWebhookPayload {
  person: ClayPerson
  company: ClayCompany
  clay_record_id?: string
  workspace_id?: string
  enrichment_job_id?: string
  timestamp?: string
}

/**
 * Verify Clay webhook signature
 */
async function verifySignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    return false
  }

  try {
    const expectedSignature = await hmacSha256Hex(secret, payload)
    return timingSafeEqual(signature, expectedSignature)
  } catch {
    return false
  }
}


export async function POST(req: NextRequest) {
  let clay_record_id: string | undefined
  let targetWorkspaceId: string | undefined

  try {
    // Get raw body for signature verification
    const rawBody = await req.text()

    // Verify webhook signature
    const webhookSecret = process.env.CLAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      safeError('[Clay Webhook] Missing CLAY_WEBHOOK_SECRET')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    const signature = req.headers.get('x-clay-signature') ||
                      req.headers.get('x-webhook-signature')

    if (!(await verifySignature(rawBody, signature, webhookSecret))) {
      safeError('[Clay Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse payload after signature verification
    let payload: ClayWebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    const { person, company, workspace_id, enrichment_job_id } = payload
    clay_record_id = payload.clay_record_id

    if (!person || !company) {
      return NextResponse.json(
        { error: 'Missing required fields: person and company' },
        { status: 400 }
      )
    }

    // Use admin client for database operations
    const supabase = createAdminClient()

    // Determine workspace - use provided or find from enrichment job
    targetWorkspaceId = workspace_id

    if (!targetWorkspaceId && enrichment_job_id) {
      // Look up workspace from enrichment job
      const { data: job } = await supabase
        .from('enrichment_jobs')
        .select('workspace_id')
        .eq('id', enrichment_job_id)
        .maybeSingle()

      targetWorkspaceId = job?.workspace_id
    }

    // SECURITY: Fail if workspace cannot be determined - do not fallback to admin
    if (!targetWorkspaceId) {
      safeError('[Clay Webhook] Could not determine target workspace', {
        workspace_id_provided: !!workspace_id,
        enrichment_job_id_provided: !!enrichment_job_id,
        clay_record_id,
      })
      return NextResponse.json(
        {
          error: 'Could not determine target workspace',
          details: 'Webhook must include workspace_id or valid enrichment_job_id',
        },
        { status: 400 }
      )
    }

    // IDEMPOTENCY: Check if this webhook has already been processed
    if (clay_record_id) {
      const { data: existingKey } = await supabase
        .from('api_idempotency_keys')
        .select('status, response_data, completed_at')
        .eq('idempotency_key', clay_record_id)
        .eq('workspace_id', targetWorkspaceId)
        .eq('endpoint', '/api/webhooks/clay')
        .maybeSingle()

      if (existingKey) {
        // Request already processed successfully - return cached response
        if (existingKey.status === 'completed' && existingKey.response_data) {
          return NextResponse.json(existingKey.response_data)
        }

        // Request currently processing - return conflict
        if (existingKey.status === 'processing') {
          return NextResponse.json(
            { error: 'Webhook already being processed. Please retry later.' },
            { status: 409 }
          )
        }

        // Request failed previously - allow retry (don't return early)
      } else {
        // Create new idempotency key record
        await supabase.from('api_idempotency_keys').insert({
          idempotency_key: clay_record_id,
          workspace_id: targetWorkspaceId,
          endpoint: '/api/webhooks/clay',
          status: 'processing',
        })
      }
    }

    // Build full name from parts if not provided
    const fullName = person.full_name ||
      [person.first_name, person.last_name].filter(Boolean).join(' ') ||
      null

    // Insert lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        workspace_id: targetWorkspaceId,
        company_name: company.name,
        company_domain: company.domain || null,
        company_industry: company.industry || null,
        company_location: company.location || null,
        email: person.email || null,
        full_name: fullName,
        first_name: person.first_name || null,
        last_name: person.last_name || null,
        phone: person.phone || null,
        linkedin_url: person.linkedin_url || null,
        job_title: person.job_title || null,
        source: 'clay',
        enrichment_status: 'completed',
        delivery_status: 'pending',
        raw_data: {
          clay_record_id,
          enrichment_job_id,
          company_details: {
            employee_count: company.employee_count,
            revenue: company.revenue,
          },
          webhook_received_at: new Date().toISOString(),
        },
      })
      .select('id')
      .maybeSingle()

    if (leadError) {
      safeError('[Clay Webhook] Failed to insert lead:', leadError)

      // Mark idempotency key as failed
      if (clay_record_id) {
        await supabase
          .from('api_idempotency_keys')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', clay_record_id)
          .eq('workspace_id', targetWorkspaceId)
      }

      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      )
    }

    if (!lead) {
      return NextResponse.json({ error: 'Failed to create lead: no data returned' }, { status: 500 })
    }

    // Route lead to appropriate workspace
    const { data: routedWorkspaceId, error: routeError } = await supabase
      .rpc('route_lead_to_workspace', {
        p_lead_id: lead.id,
        p_source_workspace_id: targetWorkspaceId,
      })

    if (routeError) {
      safeError('[Clay Webhook] Lead routing failed:', routeError)
      // Don't fail the webhook - lead was created successfully
    }

    // Update enrichment job if provided
    if (enrichment_job_id) {
      let jobQuery = supabase
        .from('enrichment_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result_lead_id: lead.id,
        })
        .eq('id', enrichment_job_id)
      if (targetWorkspaceId) {
        jobQuery = jobQuery.eq('workspace_id', targetWorkspaceId)
      }
      await jobQuery
    }

    // Prepare successful response
    const response = {
      success: true,
      lead_id: lead.id,
      clay_record_id,
      routed_to_workspace: routedWorkspaceId || targetWorkspaceId,
      message: 'Clay enrichment received and processed successfully',
    }

    // Update idempotency key with successful response
    if (clay_record_id) {
      await supabase
        .from('api_idempotency_keys')
        .update({
          status: 'completed',
          response_data: response,
          completed_at: new Date().toISOString(),
        })
        .eq('idempotency_key', clay_record_id)
        .eq('workspace_id', targetWorkspaceId)
    }

    return NextResponse.json(response)
  } catch (error: any) {
    safeError('[Clay Webhook] Error:', error)

    // Mark idempotency key as failed to allow retry
    if (clay_record_id && targetWorkspaceId) {
      try {
        const supabase = createAdminClient()
        await supabase
          .from('api_idempotency_keys')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', clay_record_id)
          .eq('workspace_id', targetWorkspaceId)
      } catch (idempotencyError) {
        safeError('[Clay Webhook] Failed to update idempotency key:', idempotencyError)
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
